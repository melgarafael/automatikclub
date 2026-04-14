"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/shared/lib/supabase/client";
import type { AuthUser } from "../types";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (authUser: User) => {
      // Fetch profile, XP, and preferences in parallel
      const [{ data: profile }, { data: xpData }, { data: prefs }] =
        await Promise.all([
          supabase
            .from("user_profiles")
            .select("*")
            .eq("id", authUser.id)
            .single(),
          supabase
            .from("user_xp")
            .select("total_xp, level, current_streak")
            .eq("user_id", authUser.id)
            .maybeSingle(),
          supabase
            .from("user_preferences")
            .select("profile_visibility")
            .eq("user_id", authUser.id)
            .maybeSingle(),
        ]);

      if (profile) {
        setUser({
          id: profile.id,
          email: authUser.email ?? "",
          full_name: profile.full_name,
          username: profile.username,
          role: profile.role,
          subscription_level: profile.subscription_level,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          whatsapp: profile.whatsapp,
          instagram: profile.instagram,
          linkedin: profile.linkedin ?? null,
          github: profile.github ?? null,
          youtube: profile.youtube ?? null,
          reddit: profile.reddit ?? null,
          portfolio_url: profile.portfolio_url,
          stack: profile.stack ?? [],
          xp: xpData?.total_xp ?? 0,
          level: xpData?.level ?? 1,
          streak: xpData?.current_streak ?? 0,
          profile_visibility: prefs?.profile_visibility ?? "public",
          created_at: profile.created_at,
        });
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (supabaseUser) {
      await fetchProfile(supabaseUser);
    }
  }, [supabaseUser, fetchProfile]);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        setSupabaseUser(authUser);
        await fetchProfile(authUser);
      }
      setIsLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setSupabaseUser(session.user);
        await fetchProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setSupabaseUser(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setSupabaseUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return {
    user,
    supabaseUser,
    isLoading,
    isAuthenticated: !!user,
    refreshProfile,
  };
}
