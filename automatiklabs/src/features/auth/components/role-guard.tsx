"use client";

import { useRole } from "../hooks/use-role";
import { type UserRole } from "@/shared/lib/auth/roles";
import { ShieldXIcon } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
  showDenied?: boolean;
}

export function RoleGuard({
  children,
  requiredRole,
  fallback,
  showDenied = false,
}: RoleGuardProps) {
  const { hasRole, isLoading } = useRole();

  if (isLoading) {
    return null;
  }

  if (!hasRole(requiredRole)) {
    if (fallback) return <>{fallback}</>;
    if (showDenied) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <ShieldXIcon className="size-10 text-text-3" />
          <p className="font-display text-[16px] font-bold text-text-1">
            Acesso negado
          </p>
          <p className="text-[13px] text-text-3">
            Voce nao tem permissao para acessar este conteudo.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
