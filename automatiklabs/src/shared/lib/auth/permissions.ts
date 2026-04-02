import { type UserRole, hasMinRole } from "./roles";

// Permission check functions based on BR13 matrix

export function canCreatePost(role: UserRole): boolean {
  return hasMinRole(role, "aluno");
}

export function canEditOwnPost(role: UserRole): boolean {
  return hasMinRole(role, "aluno");
}

export function canDeleteOwnPost(role: UserRole): boolean {
  return hasMinRole(role, "aluno");
}

export function canDeleteAnyPost(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canCreateComment(role: UserRole): boolean {
  return hasMinRole(role, "aluno");
}

export function canEditOwnComment(role: UserRole): boolean {
  return hasMinRole(role, "aluno");
}

export function canDeleteAnyComment(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canCreateCourse(role: UserRole): boolean {
  return hasMinRole(role, "contribuidor");
}

export function canPublishCourse(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canEditAnyCourse(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canDeleteCourse(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canCreateLearningPath(role: UserRole): boolean {
  return hasMinRole(role, "contribuidor");
}

export function canModerateContent(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canManageUsers(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canAccessAdmin(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canUpdateUserRole(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canManageBilling(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canViewAnalytics(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canPinPost(role: UserRole): boolean {
  return hasMinRole(role, "moderador");
}

export function canBanUser(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canCreateMarketplaceItem(role: UserRole): boolean {
  return hasMinRole(role, "contribuidor");
}
