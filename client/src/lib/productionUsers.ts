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
  // Grundläggande medarbetare - bara en roll
  {
    id: "emp-001",
    name: "Anna Andersson",
    email: "anna.andersson@kontek.se", 
    department: "Utveckling",
    assignedRoles: ["employee"],
    defaultRole: "employee",
    canSwitchRoles: false
  },
  
  // Chef - kan vara både medarbetare och chef
  {
    id: "mgr-001", 
    name: "Erik Eriksson",
    email: "erik.eriksson@kontek.se",
    department: "Utveckling",
    assignedRoles: ["employee", "manager"],
    defaultRole: "manager", 
    canSwitchRoles: true
  },
  
  // HR-specialist - också chef funktioner
  {
    id: "hr-001",
    name: "Maria Larsson", 
    email: "maria.larsson@kontek.se",
    department: "HR",
    assignedRoles: ["employee", "hr", "manager"],
    defaultRole: "hr",
    canSwitchRoles: true
  },
  
  // Löneadministratör - specialiserad roll
  {
    id: "pay-001",
    name: "Lars Johansson",
    email: "lars.johansson@kontek.se", 
    department: "Ekonomi",
    assignedRoles: ["employee", "payroll"],
    defaultRole: "payroll",
    canSwitchRoles: true
  },
  
  // Systemadmin - alla roller för support
  {
    id: "admin-001",
    name: "Tekla Support",
    email: "support@kontek.se",
    department: "IT", 
    assignedRoles: ["employee", "manager", "hr", "payroll"],
    defaultRole: "employee",
    canSwitchRoles: true // För troubleshooting
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