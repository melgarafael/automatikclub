import { notFound } from "next/navigation";
import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getCourseWithProgress } from "@/features/courses/actions/get-course-with-progress";
import { CourseHeader } from "@/features/courses/components/course-header";
import { ModuleAccordion } from "@/features/courses/components/module-accordion";
import { ContinueButton } from "@/features/courses/components/continue-button";
import { Paywall } from "@/shared/components/paywall";
import { createClient } from "@/shared/lib/supabase/server";
import {
  hasMinTier,
  type SubscriptionTier,
} from "@/shared/lib/auth/subscriptions";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ trackSlug: string; courseSlug: string }>;
}) {
  const { trackSlug, courseSlug } = await params;
  const course = await getCourseWithProgress(courseSlug);

  if (!course) notFound();

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

  const hasAccess = hasMinTier(userTier, course.tier_required);

  return (
    <>
      <Topbar title={course.title} />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: course.track.slug, href: `/learn/${trackSlug}` },
            { label: course.slug },
          ]}
        />

        <CourseHeader course={course} />

        {hasAccess ? (
          <>
            <ContinueButton
              trackSlug={trackSlug}
              courseSlug={courseSlug}
              nextLessonSlug={course.next_lesson_slug}
              hasProgress={(course.user_progress?.percentage ?? 0) > 0}
            />

            <ModuleAccordion
              modules={course.modules}
              trackSlug={trackSlug}
              courseSlug={courseSlug}
            />
          </>
        ) : (
          <Paywall requiredTier={course.tier_required} />
        )}
      </div>
    </>
  );
}
