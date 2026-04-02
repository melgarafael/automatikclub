import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getTracks } from "@/features/courses/actions/get-tracks";
import { TrackGrid } from "@/features/courses/components/track-grid";
import { TrackCatalogFilters } from "./track-catalog-filters";

export const revalidate = 60;

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; difficulty?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tracks = await getTracks({
    category: params.category,
    difficulty: params.difficulty,
    search: params.q,
  });

  return (
    <>
      <Topbar title="Aprender" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb items={[{ label: "learn" }]} />

        <TrackCatalogFilters
          activeCategory={params.category}
          activeDifficulty={params.difficulty}
          searchQuery={params.q}
        />

        <TrackGrid tracks={tracks} />
      </div>
    </>
  );
}
