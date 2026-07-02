import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  favorites: string[];
  toggle: (symbol: string) => void;
  isFavorite: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (symbol) =>
        set((state) => ({
          favorites: state.favorites.includes(symbol)
            ? state.favorites.filter((item) => item !== symbol)
            : [...state.favorites, symbol],
        })),
      isFavorite: (symbol) => get().favorites.includes(symbol),
    }),
    { name: 'watchlist-favorites' },
  ),
);
