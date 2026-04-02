import { getChannel } from "@/features/community/actions/get-channel";
import { getFeed } from "@/features/community/actions/get-feed";
import { getChannels } from "@/features/community/actions/get-channel";
import { ChannelHeader } from "@/features/community/components/channel-header";
import { PostFeed } from "@/features/community/components/post-feed";
import { EmptyState } from "@/shared/components/empty-state";
import { notFound } from "next/navigation";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelSlug: string }>;
}) {
  const { channelSlug } = await params;

  const channelData = await getChannel(channelSlug);

  if (!channelData) {
    notFound();
  }

  const { channel, tabs } = channelData;

  const [feedResult, allChannels] = await Promise.all([
    getFeed({ filter: "recentes", channelId: channel.id }),
    getChannels(),
  ]);

  return (
    <div className="py-0">
      <ChannelHeader channel={channel} tabs={tabs} />

      <div className="py-4">
        <PostFeed
          initialPosts={feedResult.posts}
          initialCursor={feedResult.nextCursor}
          initialHasMore={feedResult.hasMore}
          channels={allChannels}
          channelId={channel.id}
          showTabs={false}
          showComposer
        />
      </div>
    </div>
  );
}
