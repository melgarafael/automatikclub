import type { TrackWithMeta } from "../types";
import { TrackCard } from "./track-card";
import { EmptyState } from "@/shared/components/empty-state";

interface TrackGridProps {
  tracks: TrackWithMeta[];
}

export function TrackGrid({ tracks }: TrackGridProps) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        title="Nenhuma trilha encontrada"
        description="Tente ajustar seus filtros ou volte mais tarde."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}

export default TrackGrid;
