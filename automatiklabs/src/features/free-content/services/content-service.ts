import { createAdminClient } from '@/shared/lib/supabase/admin';
import type { FreeContent, UnlockResponse, BalanceResponse, MarketplaceContent } from '../types';

export async function getContentBySlug(slug: string): Promise<FreeContent | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('free_contents')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  return data ? mapContent(data) : null;
}

export async function unlockContent(
  email: string,
  slug: string,
  key: string | undefined,
  isStudent: boolean
): Promise<UnlockResponse> {
  const supabase = createAdminClient();

  const content = await getContentBySlug(slug);
  if (!content) throw new Error('Content not found');

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('content_unlocks')
    .select('id')
    .eq('lead_email', email)
    .eq('content_id', content.id)
    .single();

  if (existing) {
    return { unlocked: true, coinsEarned: 0, isStudent, method: 'key' };
  }

  // Determine unlock method
  let method: 'key' | 'coins' | 'student' = 'key';

  if (isStudent) {
    method = 'student';
  } else if (key && key === content.unlockKey) {
    method = 'key';
  } else if (key && key !== content.unlockKey) {
    return { unlocked: false, coinsEarned: 0, isStudent, method: 'key' };
  } else {
    return { unlocked: false, coinsEarned: 0, isStudent, method: 'coins' };
  }

  // Create unlock record — use INSERT with conflict detection
  const { data: inserted, error: unlockError } = await supabase
    .from('content_unlocks')
    .insert({
      lead_email: email,
      content_id: content.id,
      method,
    })
    .select('id')
    .single();

  // If unique constraint violation, another request already unlocked
  if (unlockError?.code === '23505' || !inserted) {
    return { unlocked: true, coinsEarned: 0, isStudent, method };
  }

  // Award coins (students get 2x)
  const coinsEarned = isStudent ? content.coinReward * 2 : content.coinReward;

  await supabase.from('coin_transactions').insert({
    lead_email: email,
    content_id: content.id,
    amount: coinsEarned,
    type: 'earned',
    description: `Conteudo desbloqueado: ${content.title}`,
  });

  // Log activity
  await supabase.from('lead_activity_log').insert({
    lead_email: email,
    action: 'unlocked_content',
    content_id: content.id,
    metadata: { method, coins_earned: coinsEarned, slug },
  });

  return { unlocked: true, coinsEarned, isStudent, method };
}

export async function purchaseContent(email: string, slug: string): Promise<UnlockResponse> {
  const supabase = createAdminClient();

  const content = await getContentBySlug(slug);
  if (!content) throw new Error('Content not found');

  // Atomic purchase via database function
  const { data, error } = await supabase.rpc('purchase_content_atomic', {
    p_email: email,
    p_content_id: content.id,
    p_cost: content.coinCost,
    p_title: content.title,
    p_slug: slug,
  });

  if (error) throw new Error(error.message);

  const result = data as { ok: boolean; already_unlocked?: boolean; error?: string; balance?: number };

  if (!result.ok) {
    if (result.error === 'insufficient_coins') {
      throw new Error('Insufficient coins');
    }
    throw new Error(result.error || 'Purchase failed');
  }

  return {
    unlocked: true,
    coinsEarned: 0,
    isStudent: false,
    method: 'coins',
  };
}

export async function getBalance(email: string): Promise<BalanceResponse> {
  const supabase = createAdminClient();

  // Get total coins from leads table (maintained by trigger)
  const { data: lead } = await supabase
    .from('leads')
    .select('total_coins')
    .eq('email', email)
    .single();

  // For students, calculate from coin_transactions directly
  let coins = lead?.total_coins ?? 0;
  if (!lead) {
    const { data: txns } = await supabase
      .from('coin_transactions')
      .select('amount')
      .eq('lead_email', email);
    coins = txns?.reduce((sum, t) => sum + t.amount, 0) ?? 0;
  }

  // Get unlocked content IDs
  const { data: unlocks } = await supabase
    .from('content_unlocks')
    .select('content_id')
    .eq('lead_email', email);

  return {
    coins,
    unlockedContentIds: unlocks?.map(u => u.content_id) ?? [],
  };
}

export async function getAllPublishedContent(email?: string): Promise<MarketplaceContent[]> {
  const supabase = createAdminClient();

  const { data: contents } = await supabase
    .from('free_contents')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (!contents) return [];

  let unlockedIds: string[] = [];
  if (email) {
    const { data: unlocks } = await supabase
      .from('content_unlocks')
      .select('content_id')
      .eq('lead_email', email);
    unlockedIds = unlocks?.map(u => u.content_id) ?? [];
  }

  return contents.map(c => ({
    ...mapContent(c),
    isUnlocked: unlockedIds.includes(c.id),
  }));
}

function mapContent(row: Record<string, unknown>): FreeContent {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    unlockKey: row.unlock_key as string,
    coinReward: row.coin_reward as number,
    coinCost: row.coin_cost as number,
    contentData: row.content_data as FreeContent['contentData'],
    publishedAt: row.published_at as string,
    status: row.status as FreeContent['status'],
    createdAt: row.created_at as string,
  };
}
