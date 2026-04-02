"use client";

import { useAuth } from "./use-auth";
import { hasMinRole, type UserRole } from "@/shared/lib/auth/roles";

interface UseRoleReturn {
  role: UserRole | null;
  isLoading: boolean;
  hasRole: (requiredRole: UserRole) => boolean;
  isAdmin: boolean;
  isModerador: boolean;
  isContribuidor: boolean;
}

export function useRole(): UseRoleReturn {
  const { user, isLoading } = useAuth();

  const role = user?.role ?? null;

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role) return false;
    return hasMinRole(role, requiredRole);
  };

  return {
    role,
    isLoading,
    hasRole,
    isAdmin: hasRole("admin"),
    isModerador: hasRole("moderador"),
    isContribuidor: hasRole("contribuidor"),
  };
}
