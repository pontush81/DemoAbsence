import { create } from 'zustand';
import { Employee, Deviation, LeaveRequest, TimeBalance, Schedule } from '@shared/schema';
import { persist } from 'zustand/middleware';

export type UserRole = 'employee' | 'manager' | 'hr' | 'payroll';

export type UserState = {
  isAuthenticated: boolean;
  currentUser: Employee | null;
  currentRole: UserRole;
  availableRoles: UserRole[]; // Vilka roller användaren har tillgång till
  isDemoMode: boolean; // Demo vs Production
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
        availableRoles: ['employee', 'manager', 'hr', 'payroll'], // Demo: alla roller
        isDemoMode: true, // Demo mode - växla fritt mellan roller
        timeBalance: null,
        todaySchedule: null,
      },
      setCurrentUser: (user) => set((state) => ({ 
        user: { ...state.user, currentUser: user, isAuthenticated: true } 
      })),
      setCurrentRole: (role) => set((state) => {
        // Fallback för availableRoles om det inte finns (bakåtkompatibilitet)
        const availableRoles = state.user.availableRoles || ['employee', 'manager', 'hr', 'payroll'];
        
        // Kontrollera om användaren har tillgång till rollen
        if (!availableRoles.includes(role)) {
          console.warn(`User doesn't have access to role: ${role}`);
          return state;
        }
        
        // Säkerställ att user-objektet har alla nödvändiga fält
        const updatedUser = {
          ...state.user,
          currentRole: role,
          availableRoles: availableRoles,
          isDemoMode: state.user.isDemoMode ?? true // Fallback till demo mode
        };
        
        // I demo mode, logga rollväxling
        if (updatedUser.isDemoMode) {
          console.log(`Demo: Role switched from ${state.user.currentRole} to ${role}`);
        } else {
          // I production, logga mer detaljerat
          console.log(`Production: Role switched from ${state.user.currentRole} to ${role} at ${new Date().toISOString()}`);
        }
        
        return { 
          user: updatedUser
        };
      }),
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
          currentRole: 'employee',
          availableRoles: ['employee'], // Reset till grundroll
          isDemoMode: true
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
          availableRoles: state.user.availableRoles,
          isDemoMode: state.user.isDemoMode,
        }
      }),
    }
  )
);
