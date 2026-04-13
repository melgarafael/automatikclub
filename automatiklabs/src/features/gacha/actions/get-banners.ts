"use server";

import { getBanners, getBannerItems } from "../services/gacha-engine";
import type { GachaBanner, BannerItem } from "../types";

interface BannersActionResult {
  banners?: GachaBanner[];
  error?: string;
}

export async function getBannersAction(): Promise<BannersActionResult> {
  try {
    const banners = await getBanners();
    return { banners };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

interface BannerItemsActionResult {
  items?: BannerItem[];
  error?: string;
}

export async function getBannerItemsAction(
  bannerId: string
): Promise<BannerItemsActionResult> {
  try {
    const items = await getBannerItems(bannerId);
    return { items };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
