import { GitBranch, X } from 'lucide-react';
import Navigation from './Navigation';

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

function LogoMark() {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[#1683e8] text-[#07131f]"
      aria-hidden="true"
    >
      <GitBranch size={15} strokeWidth={2.5} />
    </div>
  );
}

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  return (
    <aside
      className={`absolute inset-y-0 left-0 z-30 w-[176px] border-r border-[#182b3e] bg-[#081522] transition-transform duration-200 md:relative md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-11 items-center gap-2 border-b border-[#182b3e] px-4">
        <LogoMark />

        <div className="min-w-0 leading-tight">
          <div className="truncate text-[11px] font-bold text-[#d5e3ef]">
            PR Review Agent
          </div>

          <div className="mt-[1px] font-mono text-[7px] font-bold tracking-[0.16em] text-[#537087]">
            PRIVATE BETA
          </div>
        </div>

        <button
          type="button"
          className="ml-auto rounded p-1 text-[#557086] hover:bg-[#10263a] md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={15} />
        </button>
      </div>

      <Navigation onNavigate={onClose} />

      <div className="mx-4 mt-2 border-t border-[#172b3d] pt-3">
        <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold tracking-[0.1em] text-[#31c9a7]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#23c9a6]" />
          WORKSPACE ONLINE
        </div>

        <p className="mt-2 text-[9px] leading-[14px] text-[#657b8d]">
          Reviews stay local in this prototype.
          <br />
          Nothing leaves this workspace.
        </p>
      </div>
    </aside>
  );
}