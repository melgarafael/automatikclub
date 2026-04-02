import { getChannels } from "@/features/community/actions/get-channel";
import { ChannelList } from "@/features/community/components/channel-list";
import { EmptyState } from "@/shared/components/empty-state";

export default async function CommunityPage() {
  const channels = await getChannels();

  return (
    <div className="py-5">
      <h1 className="mb-4 font-display text-[18px] font-bold tracking-[-0.03em] text-text-1">
        Comunidade
      </h1>
      <p className="mb-6 text-[14px] text-text-3">
        Explore os canais da comunidade AutomatikClub
      </p>

      {channels.length > 0 ? (
        <ChannelList channels={channels} />
      ) : (
        <EmptyState
          icon={"\uD83D\uDCAC"}
          title="Nenhum canal disponivel"
          description="Os canais da comunidade serao adicionados em breve."
        />
      )}
    </div>
  );
}
