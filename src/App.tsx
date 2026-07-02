import { useState } from 'react';
import { Header } from './components/Header';
import { Backtest } from './pages/Backtest';
import { Dashboard } from './pages/Dashboard';

type View = 'dashboard' | 'backtest';

export const App = (): JSX.Element => {
  const [view, setView] = useState<View>('dashboard');

  const tabClass = (id: View): string =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      view === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <div className="mx-auto flex max-w-4xl gap-2 px-4 pt-4">
        <button onClick={() => setView('dashboard')} className={tabClass('dashboard')}>
          Dashboard
        </button>
        <button onClick={() => setView('backtest')} className={tabClass('backtest')}>
          Backtest
        </button>
      </div>
      <main className="mx-auto w-full max-w-4xl">
        {view === 'dashboard' ? <Dashboard /> : <Backtest />}
      </main>
    </div>
  );
};
