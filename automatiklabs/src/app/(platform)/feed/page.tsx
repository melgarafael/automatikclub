import { getFeed } from "@/features/community/actions/get-feed";
import { getChannels } from "@/features/community/actions/get-channel";
import { PostFeed } from "@/features/community/components/post-feed";

export default async function FeedPage() {
  const [feedResult, channels] = await Promise.all([
    getFeed({ filter: "recentes" }),
    getChannels(),
  ]);

  return (
    <div className="py-5">
      <PostFeed
        initialPosts={feedResult.posts}
        initialCursor={feedResult.nextCursor}
        initialHasMore={feedResult.hasMore}
        channels={channels}
        showTabs
        showComposer
      />
    </div>
  );
}
