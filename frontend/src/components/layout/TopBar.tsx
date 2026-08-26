import { Clock3, Menu, SlidersHorizontal } from 'lucide-react';

type TopBarProps = {
  onMenu: () => void;
  onSettings: () => void;
};

export default function TopBar({
  onMenu,
  onSettings,
}: TopBarProps) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-[#182b3e] bg-[#091725] px-4 md:px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded p-1 text-[#89a3b8] hover:bg-[#10263a] md:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu size={17} />
        </button>

        <span className="flex items-center gap-2 text-[10px] text-[#7d96a9]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#18c59b]" />
          Backend reachable
        </span>
      </div>

      <div className="flex items-center gap-3 text-[9px] text-[#526b80]">
        <span className="hidden items-center gap-1.5 sm:flex">
          <Clock3 size={11} />
          Last sync 2 min ago
        </span>

        <button
          type="button"
          className="rounded p-1 hover:bg-[#12283a]"
          onClick={onSettings}
          aria-label="Workspace settings"
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>
    </header>
  );
}