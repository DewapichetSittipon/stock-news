import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `block rounded-lg px-4 py-2 text-sm font-medium ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
  }`;

export const Sidebar = (): JSX.Element => (
  <aside className="w-full shrink-0 border-b border-slate-800 md:h-screen md:w-60 md:border-b-0 md:border-r">
    <div className="p-5">
      <h1 className="text-lg font-bold text-white">📊 Smart DCA</h1>
      <p className="text-xs text-slate-500">Curated Stock Dashboard</p>
    </div>
    <nav className="flex gap-2 px-3 md:flex-col">
      <NavLink to="/" className={linkClass} end>
        Dashboard
      </NavLink>
      <NavLink to="/watchlist" className={linkClass}>
        Watchlist
      </NavLink>
    </nav>
  </aside>
);
