import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getRecommendations } from "@/features/recommendations/actions/get-recommendations";
import { RecommendationGrid } from "@/features/courses/components/recommendation-grid";

export default async function RecommendedPage() {
  const recommendations = await getRecommendations(10);

  // Map RecommendedItem to the shape RecommendationGrid expects
  const lessons = recommendations.map((r) => ({
    id: r.lesson_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    video_url: r.video_url,
    video_source: null,
    content_md: null,
    duration_minutes: r.duration_minutes,
    position: 0,
    is_published: true,
    tier_required: r.requires_upgrade ? ("pro" as const) : ("free" as const),
    tags: r.tags,
    created_at: "",
    updated_at: "",
    module_id: "",
    reason: r.reason,
    source: r.source,
    track_title: r.track_title,
    course_title: r.course_title,
    track_slug: r.track_slug,
    course_slug: r.course_slug,
    avg_rating: r.avg_rating,
  }));

  return (
    <>
      <Topbar title="Recomendadas" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "recomendadas" },
          ]}
        />

        <div className="space-y-1">
          <h2 className="font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
            Aulas recomendadas
          </h2>
          <p className="text-[13px] text-text-2">
            Baseado no seu historico de aprendizado e nas aulas mais populares.
          </p>
        </div>

        <RecommendationGrid lessons={lessons} />
      </div>
    </>
  );
}
