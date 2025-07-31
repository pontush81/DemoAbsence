import { create } from 'zustand';
import { Employee, Deviation, LeaveRequest, TimeBalance, Schedule } from '@shared/schema';
import { persist } from 'zustand/middleware';

export type UserRole = 'employee' | 'manager';

export type UserState = {
  isAuthenticated: boolean;
  currentUser: Employee | null;
  currentRole: UserRole;
  timeBalance: TimeBalance | null;
  todaySchedule: Schedule | null;
};

type NavigationState = {
  isMobileSidebarOpen: boolean;
  currentRoute: string;
};

type AppState = {
  // User state
  user: UserState;
  setCurrentUser: (user: Employee) => void;
  setCurrentRole: (role: UserRole) => void;
  setTimeBalance: (timeBalance: TimeBalance) => void;
  setTodaySchedule: (schedule: Schedule) => void;
  logout: () => void;
  
  // Navigation state
  navigation: NavigationState;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  toggleMobileSidebar: () => void;
  setCurrentRoute: (route: string) => void;
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User state
      user: {
        isAuthenticated: true, // Simulate being authenticated
        currentUser: null,
        currentRole: 'employee',
        timeBalance: null,
        todaySchedule: null,
      },
      setCurrentUser: (user) => set((state) => ({ 
        user: { ...state.user, currentUser: user, isAuthenticated: true } 
      })),
      setCurrentRole: (role) => set((state) => ({ 
        user: { ...state.user, currentRole: role } 
      })),
      setTimeBalance: (timeBalance) => set((state) => ({ 
        user: { ...state.user, timeBalance } 
      })),
      setTodaySchedule: (todaySchedule) => set((state) => ({ 
        user: { ...state.user, todaySchedule } 
      })),
      logout: () => set((state) => ({ 
        user: { 
          ...state.user, 
          isAuthenticated: false, 
          currentUser: null,
          currentRole: 'employee'
        } 
      })),
      
      // Navigation state
      navigation: {
        isMobileSidebarOpen: false,
        currentRoute: '/'
      },
      setMobileSidebarOpen: (isOpen) => set((state) => ({ 
        navigation: { ...state.navigation, isMobileSidebarOpen: isOpen } 
      })),
      toggleMobileSidebar: () => set((state) => ({ 
        navigation: { 
          ...state.navigation, 
          isMobileSidebarOpen: !state.navigation.isMobileSidebarOpen 
        } 
      })),
      setCurrentRoute: (route) => set((state) => ({ 
        navigation: { ...state.navigation, currentRoute: route } 
      })),
    }),
    {
      name: 'kontek-app-storage',
      partialize: (state) => ({
        user: {
          isAuthenticated: state.user.isAuthenticated,
          currentRole: state.user.currentRole,
        }
      }),
    }
  )
);
