import type { UserRole } from "./store";

// Mock användardatabas för produktion
// Visar hur rollfördelning skulle se ut i verkliga systemet

export interface ProductionUser {
  id: string;
  name: string;
  email: string;
  department: string;
  assignedRoles: UserRole[]; 
  defaultRole: UserRole;
  canSwitchRoles: boolean; // Bara vissa användare kan växla
  lastRoleSwitch?: Date;
}

export const productionUsers: ProductionUser[] = [
  // 👤 MEDARBETARE - Anna Andersson
  {
    id: "E001",
    name: "Anna Andersson",
    email: "anna.andersson@kontek.se", 
    department: "Ekonomi",
    assignedRoles: ["employee"],
    defaultRole: "employee",
    canSwitchRoles: false
  },
  
  // 👨‍💼 CHEF - Mikael Svensson (bara manager-roll)
  {
    id: "E005", 
    name: "Mikael Svensson",
    email: "mikael.svensson@kontek.se",
    department: "Ledning",
    assignedRoles: ["manager"],
    defaultRole: "manager", 
    canSwitchRoles: false
  },
  
  // 👩‍💼 HR - Lisa Nilsson (bara HR-roll)
  {
    id: "hr-001",
    name: "Lisa Nilsson", 
    email: "lisa.nilsson@kontek.se",
    department: "HR",
    assignedRoles: ["hr"],
    defaultRole: "hr",
    canSwitchRoles: false
  },
  
  // 💰 LÖNEADMIN - Lars Johansson (bara payroll-roll)
  {
    id: "pay-001",
    name: "Lars Johansson",
    email: "lars.johansson@kontek.se", 
    department: "Ekonomi",
    assignedRoles: ["payroll"],
    defaultRole: "payroll",
    canSwitchRoles: false
  }
];

// Simulera inloggning med olika användare i produktion
export const simulateProductionLogin = (userId: string) => {
  const user = productionUsers.find(u => u.id === userId);
  if (!user) return null;
  
  return {
    ...user,
    availableRoles: user.assignedRoles,
    currentRole: user.defaultRole,
    isDemoMode: false
  };
};

// Kontrollera om rollväxling är tillåten
export const canUserSwitchToRole = (user: ProductionUser, targetRole: UserRole): boolean => {
  return user.canSwitchRoles && user.assignedRoles.includes(targetRole);
};

// Logga rollväxling för audit
export const logRoleSwitch = (userId: string, fromRole: UserRole, toRole: UserRole) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    action: 'ROLE_SWITCH',
    fromRole, 
    toRole,
    ipAddress: 'MOCK_IP', // I verkligheten från request
    userAgent: 'MOCK_AGENT'
  };
  
  console.log('AUDIT LOG:', logEntry);
  // I produktion: spara till databas/audit log
};