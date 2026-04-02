import { Breadcrumb } from "@/shared/components/breadcrumb";
import { AIModerationQueue } from "@/features/ai-feed/components/ai-moderation-queue";
import { getPendingAIPosts } from "@/features/ai-feed/actions/moderate-ai-post";

export default async function AdminAIFeedPage() {
  const { posts } = await getPendingAIPosts();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Feed IA" },
        ]}
      />

      <h1 className="mb-6 font-display text-[22px] font-bold tracking-[-0.03em] text-text-1">
        Moderacao do Feed IA
      </h1>

      <div className="mb-4 rounded-[2px] border-2 border-border bg-bg-raised px-4 py-3">
        <p className="font-mono text-[12px] text-text-2">
          <span className="font-semibold text-text-1">{posts.length}</span> post
          {posts.length !== 1 ? "s" : ""} pendente{posts.length !== 1 ? "s" : ""} de aprovacao
        </p>
      </div>

      <AIModerationQueue
        initialPosts={
          posts as Parameters<typeof AIModerationQueue>[0]["initialPosts"]
        }
      />
    </div>
  );
}
