import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';

export const App = (): JSX.Element => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <Header />
    <main className="mx-auto w-full max-w-4xl">
      <Dashboard />
    </main>
  </div>
);
