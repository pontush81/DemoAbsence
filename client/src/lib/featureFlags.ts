import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureFlags = {
  // Feature flags
  enableTravelExpenses: boolean;
  
  // Functions
  isFeatureEnabled: (name: keyof FeatureFlags) => boolean;
  setFeatureFlag: (name: keyof FeatureFlags, value: boolean) => void;
};

export const useFeatureFlags = create<FeatureFlags>()(
  persist(
    (set, get) => ({
      // Feature flags - initial values
      enableTravelExpenses: true, // Travel & Expenses feature - enabled for demonstration
      
      // Functions
      isFeatureEnabled: (name) => {
        // Get the current state and check if the feature is enabled
        const state = get();
        // Only return for known feature flags
        if (name in state && typeof state[name] === 'boolean') {
          return state[name] as boolean;
        }
        return false;
      },
      
      setFeatureFlag: (name, value) => {
        set({ [name]: value });
      },
    }),
    {
      name: 'kontek-feature-flags',
    }
  )
);
