import { createClient } from "@/shared/lib/supabase/server";
import type {
  MarketplaceListing,
  ItemRarity,
  GachaItem,
} from "../types";

// -- Filters --

export interface MarketplaceFilters {
  rarity?: ItemRarity;
  category?: GachaItem["category"];
  minPrice?: number;
  maxPrice?: number;
}

// -- List an item for sale --

export async function listItem(
  inventoryId: string,
  priceCredits: number
): Promise<MarketplaceListing> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch inventory item + joined gacha_item
  const { data: invItem, error: invError } = await supabase
    .from("user_inventory")
    .select("id, user_id, item_id, is_locked, gacha_items ( rarity, bind_type )")
    .eq("id", inventoryId)
    .single();

  if (invError || !invItem)
    throw new Error("Inventory item not found");

  if (invItem.user_id !== user.id)
    throw new Error("Item not owned");

  if (invItem.is_locked)
    throw new Error("Item is locked");

  const itemInfo = invItem.gacha_items as unknown as {
    rarity: ItemRarity;
    bind_type: string;
  };

  if (itemInfo.bind_type === "soulbound")
    throw new Error("SOULBOUND_ITEM");

  // Check price floor/ceiling
  const { data: priceConfig, error: priceError } = await supabase
    .from("gacha_rarity_price_config")
    .select("price_floor, price_ceiling")
    .eq("rarity", itemInfo.rarity)
    .single();

  if (priceError || !priceConfig)
    throw new Error("Price config not found for rarity");

  if (priceCredits < priceConfig.price_floor || priceCredits > priceConfig.price_ceiling) {
    throw new Error(
      `PRICE_OUT_OF_RANGE: min=${priceConfig.price_floor}, max=${priceConfig.price_ceiling}`
    );
  }

  // Lock the item
  const { error: lockError } = await supabase
    .from("user_inventory")
    .update({ is_locked: true })
    .eq("id", inventoryId);

  if (lockError)
    throw new Error(`Failed to lock item: ${lockError.message}`);

  // Create listing (expires in 7 days)
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: listing, error: listingError } = await supabase
    .from("gacha_marketplace_listings")
    .insert({
      seller_id: user.id,
      inventory_id: inventoryId,
      item_id: invItem.item_id,
      price_credits: priceCredits,
      status: "active",
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (listingError)
    throw new Error(`Failed to create listing: ${listingError.message}`);

  return mapListing(listing);
}

// -- Buy an item --

export async function buyItem(
  listingId: string
): Promise<MarketplaceListing> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("perform_marketplace_purchase", {
    p_listing_id: listingId,
  });

  if (error) throw new Error(error.message);

  const result = data as Record<string, unknown>;

  return {
    id: result.listing_id as string,
    sellerId: "",
    inventoryId: "",
    itemId: result.item_id as string,
    priceCredits: result.price_paid as number,
    status: "sold",
    buyerId: null,
    expiresAt: "",
    createdAt: "",
    item: {
      id: result.item_id as string,
      name: result.item_name as string,
      slug: "",
      description: null,
      rarity: result.item_rarity as ItemRarity,
      bindType: "tradeable",
      category: "asset",
      iconUrl: null,
      baseWeight: 0,
      properties: {},
      createdAt: "",
    },
  };
}

// -- Cancel a listing --

export async function cancelListing(listingId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch listing
  const { data: listing, error: fetchError } = await supabase
    .from("gacha_marketplace_listings")
    .select("id, seller_id, inventory_id, status")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing)
    throw new Error("Listing not found");

  if (listing.seller_id !== user.id)
    throw new Error("Not your listing");

  if (listing.status !== "active")
    throw new Error("Listing is not active");

  // Cancel listing
  const { error: updateError } = await supabase
    .from("gacha_marketplace_listings")
    .update({ status: "cancelled" })
    .eq("id", listingId);

  if (updateError)
    throw new Error(`Failed to cancel listing: ${updateError.message}`);

  // Unlock inventory item
  const { error: unlockError } = await supabase
    .from("user_inventory")
    .update({ is_locked: false })
    .eq("id", listing.inventory_id);

  if (unlockError)
    throw new Error(`Failed to unlock item: ${unlockError.message}`);
}

// -- Query active listings --

export async function getListings(
  filters?: MarketplaceFilters
): Promise<MarketplaceListing[]> {
  const supabase = await createClient();

  let query = supabase
    .from("gacha_marketplace_listings")
    .select(
      `
      id,
      seller_id,
      inventory_id,
      item_id,
      price_credits,
      status,
      buyer_id,
      expires_at,
      listed_at,
      gacha_items (
        id,
        name,
        slug,
        description,
        rarity,
        bind_type,
        category,
        icon_url,
        base_weight,
        properties,
        created_at
      )
    `
    )
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("listed_at", { ascending: false });

  if (filters?.minPrice) {
    query = query.gte("price_credits", filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte("price_credits", filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch listings: ${error.message}`);
  if (!data) return [];

  let listings = data.map(mapListingWithJoin);

  // Post-query filters on joined data
  if (filters?.rarity) {
    listings = listings.filter((l) => l.item?.rarity === filters.rarity);
  }
  if (filters?.category) {
    listings = listings.filter((l) => l.item?.category === filters.category);
  }

  return listings;
}

// -- My listings (all statuses) --

export async function getMyListings(): Promise<MarketplaceListing[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("gacha_marketplace_listings")
    .select(
      `
      id,
      seller_id,
      inventory_id,
      item_id,
      price_credits,
      status,
      buyer_id,
      expires_at,
      listed_at,
      gacha_items (
        id,
        name,
        slug,
        description,
        rarity,
        bind_type,
        category,
        icon_url,
        base_weight,
        properties,
        created_at
      )
    `
    )
    .eq("seller_id", user.id)
    .order("listed_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch my listings: ${error.message}`);

  return (data ?? []).map(mapListingWithJoin);
}

// -- Mappers --

function mapListing(row: Record<string, unknown>): MarketplaceListing {
  return {
    id: row.id as string,
    sellerId: row.seller_id as string,
    inventoryId: row.inventory_id as string,
    itemId: row.item_id as string,
    priceCredits: row.price_credits as number,
    status: row.status as MarketplaceListing["status"],
    buyerId: (row.buyer_id as string) ?? null,
    expiresAt: row.expires_at as string,
    createdAt: (row.listed_at as string) ?? "",
  };
}

function mapListingWithJoin(row: Record<string, unknown>): MarketplaceListing {
  const listing = mapListing(row);
  const item = row.gacha_items as Record<string, unknown> | null;

  if (item) {
    listing.item = {
      id: item.id as string,
      name: item.name as string,
      slug: item.slug as string,
      description: item.description as string | null,
      rarity: item.rarity as ItemRarity,
      bindType: item.bind_type as GachaItem["bindType"],
      category: item.category as GachaItem["category"],
      iconUrl: item.icon_url as string | null,
      baseWeight: item.base_weight as number,
      properties: (item.properties as Record<string, unknown>) ?? {},
      createdAt: item.created_at as string,
    };
  }

  return listing;
}
