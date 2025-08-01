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
  demoUserId?: string; // För att hålla koll på vilken demo-användare som är aktiv
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
  setDemoUser: (userId: string) => void; // Ny funktion för att växla demo-användare
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
      // User state - starta med första demo-användaren
      user: {
        isAuthenticated: true, // Simulate being authenticated
        currentUser: null,
        currentRole: 'employee',
        availableRoles: ['employee'], // Kommer uppdateras när demo-användare väljs
        isDemoMode: true, // Demo mode - växla fritt mellan roller
        timeBalance: null,
        todaySchedule: null,
        demoUserId: 'emp-001', // Anna Andersson som standard
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
      setDemoUser: (userId) => set((state) => {
        // Importera produktionsanvändare
        const { simulateProductionLogin } = require('./productionUsers');
        const demoUserData = simulateProductionLogin(userId);
        
        if (!demoUserData) {
          console.warn(`Demo user not found: ${userId}`);
          return state;
        }

        // Skapa Employee objekt från demo-användaren
        const employeeUser: Employee = {
          id: 0, // Mock ID
          employeeId: demoUserData.id,
          personnummer: "000000-0000", // Mock
          firstName: demoUserData.name.split(' ')[0],
          lastName: demoUserData.name.split(' ')[1] || '',
          careOfAddress: null,
          streetAddress: "Mock Address",
          postalCode: "12345",
          city: "Stockholm",
          country: "Sverige",
          phoneNumber: null,
          email: demoUserData.email,
          workEmail: demoUserData.email,
          preferredEmail: "work",
          status: "active",
          role: demoUserData.defaultRole,
          bankClearingNumber: null,
          bankAccountNumber: null,
          bankBIC: null,
          bankCountryCode: null,
          bankIBAN: null,
          department: demoUserData.department,
          position: null,
          manager: null,
          scheduleTemplate: null
        };

        console.log(`Demo: Switched to user ${demoUserData.name} (${userId}) with role ${demoUserData.defaultRole}`);
        
        return {
          user: {
            ...state.user,
            currentUser: employeeUser,
            currentRole: demoUserData.defaultRole,
            availableRoles: demoUserData.assignedRoles,
            demoUserId: userId,
            isDemoMode: true
          }
        };
      }),
      logout: () => set((state) => ({ 
        user: { 
          ...state.user, 
          isAuthenticated: false, 
          currentUser: null,
          currentRole: 'employee',
          availableRoles: ['employee'], // Reset till grundroll
          isDemoMode: true,
          demoUserId: undefined
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
          demoUserId: state.user.demoUserId,
        }
      }),
    }
  )
);
