import {
  Activity,
  ExternalLink,
  MoreHorizontal,
  Unplug,
} from 'lucide-react';
import { useState } from 'react';
import type { Repository } from '@/types/repository';

type RepositoryCardProps = {
  repository: Repository;
  onDetails: (repository: Repository) => void;
  onDisconnect: (repository: Repository) => void;
  onOpen: (repository: Repository) => void;
};

function RepoAvatar({
  repository,
}: {
  repository: Repository;
}) {
  const classes = {
    cyan: 'bg-[#12bce8] text-[#062035]',
    violet: 'bg-[#a873f4] text-[#1b0d31]',
    amber: 'bg-[#ffc10c] text-[#281a00]',
  };

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-bold ${classes[repository.tone]}`}
    >
      {repository.owner.slice(0, 1).toUpperCase()}
    </div>
  );
}

function StatusPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#145e5d] bg-[#0b4848]/60 px-2 py-[2px] text-[10px] font-semibold text-[#43dbc7]">
      <span className="h-1 w-1 rounded-full bg-[#37d8be]" />
      Active
    </span>
  );
}

export default function RepositoryCard({
  repository,
  onDetails,
  onDisconnect,
  onOpen,
}: RepositoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="group relative flex min-h-[53px] items-center gap-3 rounded-[6px] border border-[#1b3044] bg-[#0e1c2c] px-3 py-2.5 transition-colors hover:border-[#2b5270] hover:bg-[#102238]">
      <RepoAvatar repository={repository} />

      {/* Clicking the repository name opens the details modal */}
      <button
        type="button"
        className="min-w-0 flex-1 text-left focus-ring"
        onClick={() => onDetails(repository)}
        aria-label={`Inspect ${repository.owner}/${repository.name}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[11px] font-bold text-[#cbd9e5]">
            {repository.owner}/{repository.name}
          </span>

          <StatusPill />
        </div>

        <div className="mt-1 text-[9px] text-[#6c8295]">
          Connected {repository.connected}
          <span className="px-1 text-[#3c566b]">·</span>
          Click to inspect
        </div>
      </button>

      <div className="relative flex items-center gap-1">
        <button
          type="button"
          className="rounded p-1.5 text-[#6b8297] hover:bg-[#1a344c]"
          onClick={() => onOpen(repository)}
          aria-label={`Open ${repository.owner}/${repository.name} on GitHub`}
        >
          <ExternalLink size={13} />
        </button>

        <button
          type="button"
          className="rounded p-1.5 text-[#6b8297] hover:bg-[#1a344c]"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="More repository actions"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal size={14} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-[#284259] bg-[#101f30] p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[10px] text-[#b4c9d9] hover:bg-[#17344c]"
              onClick={() => {
                setMenuOpen(false);
                onDetails(repository);
              }}
            >
              <Activity size={12} />
              View details
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[10px] text-[#ec8f9e] hover:bg-[#3a2330]"
              onClick={() => {
                setMenuOpen(false);
                onDisconnect(repository);
              }}
            >
              <Unplug size={12} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    </article>
  );
}