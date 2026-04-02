"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="space-y-4 p-5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
