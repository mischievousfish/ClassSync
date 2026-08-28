import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AppMode = 'STUDENT' | 'TEACHER';

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  mode: 'STUDENT',
  setMode: (mode) => set({ mode }),
}), {
  name: 'classsync-preferences',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({ mode: state.mode }),
}));
