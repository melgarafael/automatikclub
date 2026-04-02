import { createAdminClient } from '@/shared/lib/supabase/admin';
import type { Lead, CheckEmailResponse } from '../types';

export async function checkEmail(email: string): Promise<CheckEmailResponse> {
  const supabase = createAdminClient();

  // Check if email exists in profiles (is a student)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profile) {
    return { status: 'student' };
  }

  // Check if email exists in leads
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('email', email)
    .single();

  if (lead) {
    return {
      status: 'lead',
      lead: mapLead(lead),
    };
  }

  return { status: 'new' };
}

export async function registerLead(email: string, name: string, whatsapp: string): Promise<Lead> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('leads')
    .insert({ email, name, whatsapp })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation — already exists, fetch it
      const { data: existing } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .single();
      return mapLead(existing!);
    }
    throw new Error(error.message);
  }

  return mapLead(data);
}

export async function getLeadByEmail(email: string): Promise<Lead | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('email', email)
    .single();

  return data ? mapLead(data) : null;
}

function mapLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    whatsapp: row.whatsapp as string,
    isStudent: row.is_student as boolean,
    totalCoins: row.total_coins as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
