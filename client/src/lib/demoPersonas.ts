import type { UserRole } from "./store";
import { productionUsers } from "./productionUsers";

export interface DemoPersona {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  email: string;
  department: string;
  description: string;
  isPrimary: boolean; // Om detta är användarens huvudroll
}

// Generera alla demo-personas (alla användar+roll kombinationer)
export const demoPersonas: DemoPersona[] = productionUsers.flatMap(user => {
  return user.assignedRoles.map(role => ({
    id: `${user.id}-${role}`,
    userId: user.id,
    name: user.name,
    role: role,
    email: user.email,
    department: user.department,
    description: getRoleDescription(role),
    isPrimary: role === user.defaultRole
  }));
});

function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'employee': return 'Visa endast egna uppgifter';
    case 'manager': return 'Godkänn ansökningar från medarbetare';
    case 'hr': return 'Hantera personalärenden';
    case 'payroll': return 'Hantera löner och PAXML-export';
    default: return '';
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'employee': return 'Medarbetare';
    case 'manager': return 'Chef';
    case 'hr': return 'HR-specialist';
    case 'payroll': return 'Löneadministratör';
    default: return role;
  }
}

export function getRoleIcon(role: UserRole): string {
  switch (role) {
    case 'employee': return 'person';
    case 'manager': return 'supervisor_account';
    case 'hr': return 'people';
    case 'payroll': return 'account_balance_wallet';
    default: return 'person';
  }
}

export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'employee': return 'bg-green-100 text-green-800';
    case 'manager': return 'bg-blue-100 text-blue-800';
    case 'hr': return 'bg-purple-100 text-purple-800';
    case 'payroll': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}