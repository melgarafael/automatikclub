import { notFound } from "next/navigation";
import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getLesson } from "@/features/courses/actions/get-lesson";
import { getCourseWithProgress } from "@/features/courses/actions/get-course-with-progress";
import { LessonPlayer } from "@/features/courses/components/lesson-player";
import { LessonContent } from "@/features/courses/components/lesson-content";
import { CurriculumSidebar } from "@/features/courses/components/curriculum-sidebar";
import { Paywall } from "@/shared/components/paywall";
import { createClient } from "@/shared/lib/supabase/server";
import { hasMinTier, type SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import { getComments } from "@/features/comments/actions/get-comments";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ trackSlug: string; courseSlug: string; lessonSlug: string }>;
}) {
  const { trackSlug, courseSlug, lessonSlug } = await params;
  const [lesson, courseDetail] = await Promise.all([
    getLesson(lessonSlug),
    getCourseWithProgress(courseSlug),
  ]);

  if (!lesson) notFound();

  // Check tier access
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userTier: SubscriptionTier = "free";
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("subscription_level")
      .eq("id", user.id)
      .single();
    userTier = (profile?.subscription_level as SubscriptionTier) ?? "free";
  }

  const hasAccess = hasMinTier(userTier, lesson.tier_required);

  // Fetch lesson comments (only if user has access)
  const comments = hasAccess ? await getComments("lesson", lesson.id) : [];

  return (
    <>
      <Topbar title={lesson.title} />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: lesson.course.track.slug, href: `/learn/${trackSlug}` },
            {
              label: lesson.course.slug,
              href: `/learn/${trackSlug}/${courseSlug}`,
            },
            { label: lesson.slug },
          ]}
        />

        {hasAccess ? (
          <div className="space-y-5">
            <LessonPlayer lesson={lesson} comments={comments} />

            {/* Markdown content */}
            <LessonContent content={lesson.content_md} />

            {/* Inline curriculum for mobile (right panel handles desktop) */}
            {courseDetail && (
              <div className="border-t border-border pt-5 lg:hidden">
                <CurriculumSidebar
                  modules={courseDetail.modules}
                  trackSlug={trackSlug}
                  courseSlug={courseSlug}
                  activeLessonSlug={lessonSlug}
                />
              </div>
            )}
          </div>
        ) : (
          <Paywall
            requiredTier={lesson.tier_required}
            title="Aula bloqueada"
            description="Faca upgrade para acessar esta aula e todo o conteudo do curso."
          />
        )}
      </div>
    </>
  );
}
