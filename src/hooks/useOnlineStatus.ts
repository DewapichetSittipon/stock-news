import { useEffect, useState } from 'react';

// Tracks browser connectivity so the UI can flag when it may be showing
// cached (service-worker) data instead of a fresh fetch.
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = (): void => setOnline(true);
    const off = (): void => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
};
