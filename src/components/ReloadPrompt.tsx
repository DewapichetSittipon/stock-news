import { useRegisterSW } from 'virtual:pwa-register/react';

// Fixed banner shown when a newer build has been deployed. Tapping "รีเฟรช"
// activates the waiting service worker and reloads with the latest code.
export const ReloadPrompt = (): JSX.Element | null => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">มีเวอร์ชันใหม่</p>
          <p className="text-xs text-slate-400">แตะรีเฟรชเพื่อโหลดข้อมูลและฟีเจอร์ล่าสุด</p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          รีเฟรช
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:text-slate-200"
          aria-label="ปิด"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
