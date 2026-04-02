export const ROLE_HIERARCHY = {
  aluno: 0,
  contribuidor: 1,
  moderador: 2,
  admin: 3,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export function hasMinRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    aluno: "Aluno",
    contribuidor: "Contribuidor",
    moderador: "Moderador",
    admin: "Admin",
  };
  return labels[role];
}

export function getRoleBadgeVariant(
  role: UserRole
): "default" | "admin" | "contrib" | "mod" {
  const variants: Record<
    UserRole,
    "default" | "admin" | "contrib" | "mod"
  > = {
    aluno: "default",
    contribuidor: "contrib",
    moderador: "mod",
    admin: "admin",
  };
  return variants[role];
}
