import { Activity, Github, History } from 'lucide-react';
import { Link, useLocation } from 'wouter';

type NavigationProps = {
  onNavigate?: () => void;
};

export default function Navigation({
  onNavigate,
}: NavigationProps) {
  const [location] = useLocation();

  const items = [
    {
      label: 'Connect',
      hint: 'Repositories',
      icon: Github,
      href: '/',
    },
    {
      label: 'Live Activity',
      hint: 'Current reviews',
      icon: Activity,
      href: '/activity',
    },
    {
      label: 'History',
      hint: 'Review archive',
      icon: History,
      href: '/history',
    },
  ];

  return (
    <nav
      className="space-y-1 px-2 py-3"
      aria-label="Primary navigation"
    >
      {items.map(({ label, hint, icon: Icon, href }) => {
        const active =
          href === '/'
            ? location === '/'
            : location.startsWith(href);

        return (
          <Link
            key={label}
            href={href}
            className={`group flex w-full items-center gap-3 rounded-[5px] border px-2.5 py-2 text-left transition-colors focus-ring ${
              active
                ? 'border-[#1a6eb5] bg-[#112d49] text-[#e5f2ff]'
                : 'border-transparent text-[#7e94a7] hover:border-[#1b344a] hover:bg-[#0e2336] hover:text-[#b3c9d9]'
            }`}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
          >
            <Icon
              size={14}
              strokeWidth={1.8}
              className={
                active
                  ? 'text-[#5fb8fa]'
                  : 'text-[#688298]'
              }
            />

            <span className="min-w-0">
              <span className="block text-[10px] font-semibold leading-[13px]">
                {label}
              </span>

              <span className="block text-[8px] leading-[11px] text-[#526b7f]">
                {hint}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}