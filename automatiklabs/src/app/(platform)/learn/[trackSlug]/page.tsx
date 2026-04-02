import { notFound } from "next/navigation";
import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getCoursesByTrack } from "@/features/courses/actions/get-courses-by-track";
import { CourseList } from "@/features/courses/components/course-list";
import { ProgressBar } from "@/features/courses/components/progress-bar";
import { TierBadge } from "@/features/courses/components/tier-badge";

export const revalidate = 60;

export default async function TrackPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const { trackSlug } = await params;
  const { track, courses } = await getCoursesByTrack(trackSlug);

  if (!track) notFound();

  // Calculate aggregate progress
  const progressCourses = courses.filter((c) => c.user_progress);
  const avgProgress =
    progressCourses.length > 0
      ? Math.round(
          progressCourses.reduce(
            (s, c) => s + (c.user_progress?.percentage ?? 0),
            0
          ) / courses.length
        )
      : 0;

  return (
    <>
      <Topbar title={track.title} />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: track.slug },
          ]}
        />

        {/* Track header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
              {track.title}
            </h1>
            <TierBadge tier={track.tier_required} />
          </div>

          {track.description && (
            <p className="text-[14px] leading-[1.6] text-text-2">
              {track.description}
            </p>
          )}

          <div className="flex items-center gap-4 font-mono text-[12px] text-text-3">
            <span>
              {courses.length} curso{courses.length !== 1 ? "s" : ""}
            </span>
            {avgProgress > 0 && (
              <ProgressBar percentage={avgProgress} width={16} />
            )}
          </div>
        </div>

        <CourseList courses={courses} trackSlug={trackSlug} />
      </div>
    </>
  );
}
