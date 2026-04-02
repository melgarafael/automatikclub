"use client";

import { useState, useTransition } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { SearchIcon } from "lucide-react";
import { getRoleBadgeVariant, type UserRole } from "@/shared/lib/auth/roles";
import { getTierBadgeVariant, type SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import { updateUserRole, updateUserTier, removeUser } from "../actions/manage-users";
import type { AdminUser } from "../types";

interface UserTableProps {
  users: AdminUser[];
}

const ROLES: UserRole[] = ["aluno", "contribuidor", "moderador", "admin"];
const TIERS: SubscriptionTier[] = ["free", "pro", "premium"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserRow({ user }: { user: AdminUser }) {
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      await updateUserRole(user.id, newRole as UserRole);
    });
  }

  function handleTierChange(newTier: string) {
    startTransition(async () => {
      await updateUserTier(user.id, newTier as SubscriptionTier);
    });
  }

  function handleRemove() {
    if (!confirm(`Remover ${user.full_name}?`)) return;
    startTransition(async () => {
      await removeUser(user.id);
    });
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-bg-hover">
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
            ) : null}
            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-display text-[13px] font-semibold text-text-1">
              {user.full_name}
            </p>
            <p className="truncate font-mono text-[11px] text-text-3">
              @{user.username}
            </p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 font-mono text-[12px] text-text-2">
        {user.email}
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <select
          value={user.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isPending}
          className="rounded-[2px] border border-border bg-bg-inset px-2 py-1 font-mono text-[11px] text-text-1 focus:border-blue focus:outline-none"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </td>

      {/* Tier */}
      <td className="px-4 py-3">
        <select
          value={user.tier}
          onChange={(e) => handleTierChange(e.target.value)}
          disabled={isPending}
          className="rounded-[2px] border border-border bg-bg-inset px-2 py-1 font-mono text-[11px] text-text-1 focus:border-blue focus:outline-none"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>

      {/* XP */}
      <td className="px-4 py-3 font-mono text-[12px] text-text-2">
        {user.xp.toLocaleString("pt-BR")}
      </td>

      {/* Joined */}
      <td className="px-4 py-3 font-mono text-[11px] text-text-3">
        {new Date(user.created_at).toLocaleDateString("pt-BR")}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Button size="xs" variant="ghost" asChild>
            <a href={`/membros/${user.username}`} target="_blank">
              Ver perfil
            </a>
          </Button>
          <Button
            size="xs"
            variant="destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            Remover
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function UserTable({ users }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesTier = tierFilter === "all" || u.tier === tierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, email ou username..."
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-[2px] border-2 border-border bg-bg-inset px-3 font-mono text-[12px] text-text-1 focus:border-blue focus:outline-none"
        >
          <option value="all">Todos os roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-9 rounded-[2px] border-2 border-border bg-bg-inset px-3 font-mono text-[12px] text-text-1 focus:border-blue focus:outline-none"
        >
          <option value="all">Todos os tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[2px] border-2 border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border bg-bg-inset">
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Usuario
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Email
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Role
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Tier
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                XP
              </th>
              <th className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Desde
              </th>
              <th className="px-4 py-2.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center font-mono text-[12px] text-text-3"
                >
                  Nenhum usuario encontrado
                </td>
              </tr>
            ) : (
              filtered.map((user) => <UserRow key={user.id} user={user} />)
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 font-mono text-[11px] text-text-3">
        {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default UserTable;
