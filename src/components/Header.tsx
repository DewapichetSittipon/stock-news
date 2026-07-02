export const Header = (): JSX.Element => (
  <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
    <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
      <span className="text-xl">📊</span>
      <div>
        <h1 className="text-base font-bold leading-tight text-white">Smart DCA</h1>
        <p className="text-xs leading-tight text-slate-500">Curated Stock Dashboard</p>
      </div>
    </div>
  </header>
);
