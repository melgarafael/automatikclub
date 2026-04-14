"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/utils";
import type { GachaBanner, BannerType } from "../types";

interface BannerCarouselProps {
  banners: GachaBanner[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  permanent: "Permanente",
  limited: "Limitado",
  themed: "Sazonal",
};

const BANNER_TYPE_COLORS: Record<BannerType, string> = {
  permanent: "bg-white/10 text-text-2",
  limited: "bg-[--gacha-epic-dim] text-[--gacha-epic]",
  themed: "bg-[--gacha-legendary-dim] text-[--gacha-legendary]",
};

function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Encerrado");
        return;
      }
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setRemaining(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    }

    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span className="font-mono text-[10px] text-[--gacha-legendary]">
      ⏱ {remaining}
    </span>
  );
}

export function BannerCarousel({
  banners,
  selectedId,
  onSelect,
  className,
}: BannerCarouselProps) {
  if (banners.length === 0) {
    return (
      <div className="py-8 text-center font-mono text-[13px] text-text-3">
        Nenhum banner ativo no momento.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none md:flex-wrap md:overflow-visible",
        className
      )}
      role="listbox"
      aria-label="Banners disponíveis"
    >
      {banners.map((banner) => {
        const isSelected = banner.id === selectedId;
        return (
          <button
            key={banner.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(banner.id)}
            className={cn(
              "group relative flex min-w-[220px] snap-start flex-col gap-2 rounded-[2px] border p-4 text-left transition-[border-color,box-shadow] duration-150",
              "md:min-w-0 md:flex-1",
              isSelected
                ? "border-blue shadow-[0_0_0_1px_var(--color-blue)]"
                : "border-border hover:border-border-hard"
            )}
          >
            {/* Gradient placeholder for hero artwork */}
            <div
              className="h-20 w-full rounded-[2px] opacity-60"
              style={{
                background:
                  banner.bannerType === "themed"
                    ? "var(--gacha-gradient-legendary)"
                    : banner.bannerType === "limited"
                      ? "var(--gacha-gradient-epic)"
                      : "var(--gacha-gradient-rare)",
              }}
              aria-hidden="true"
            />

            {/* Banner info */}
            <span className="font-display text-[14px] font-semibold text-text-1">
              {banner.name}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-[2px] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
                  BANNER_TYPE_COLORS[banner.bannerType]
                )}
              >
                {BANNER_TYPE_LABELS[banner.bannerType]}
              </span>

              {banner.endsAt && <Countdown endsAt={banner.endsAt} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
