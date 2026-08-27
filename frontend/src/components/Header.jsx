export default function Header() {
  return (
    <header className="topbar">
      <div className="backend-status">
        <span className="online-dot" />
        <span>Backend reachable</span>
      </div>

      <div className="topbar__right">
        <span>◷</span>
        <span>Last sync 2 min ago</span>
        <button type="button" className="topbar__menu">
          ⋯
        </button>
      </div>
    </header>
  );
}