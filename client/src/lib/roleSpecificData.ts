import type { ActivityLog } from '@shared/schema';
import type { UserRole } from './store';

// Rollspecifika aktivitetsloggar för olika användartyper
export const getRoleSpecificActivities = (role: UserRole): ActivityLog[] => {
  const now = new Date();
  
  switch (role) {
    case 'employee':
      // Medarbetare ser sina egna aktiviteter - ansökningar, godkännanden
      return [
        {
          id: 1,
          employeeId: 'E001',
          type: 'deviation',
          action: 'approved',
          description: 'Din övertidsansökan för 12 april har godkänts av Mikael Svensson',
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2h sedan
          referenceId: '1',
          referenceType: 'deviation',
          performedBy: null,
        },
        {
          id: 2,
          employeeId: 'E001',
          type: 'leave',
          action: 'created',
          description: 'Du ansökte om semester 10-15 juli',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 dag sedan
          referenceId: '1',
          referenceType: 'leave',
          performedBy: null,
        },
        {
          id: 3,
          employeeId: 'E001',
          type: 'deviation',
          action: 'returned',
          description: 'Mikael har skickat tillbaka din avvikelserapport för 11 april med kommentar',
          timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dagar sedan
          referenceId: '2',
          referenceType: 'deviation',
          performedBy: null,
        }
      ];

    case 'manager':
      // Chef ser aktiviteter relaterade till godkännanden och teamhantering
      return [
        {
          id: 10,
          employeeId: 'MANAGER',
          type: 'deviation',
          action: 'pending_approval',
          description: '3 nya avvikelserapporter väntar på ditt godkännande',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 min sedan
          referenceId: '10',
          referenceType: 'deviation',
          performedBy: null,
        },
        {
          id: 11,
          employeeId: 'MANAGER', 
          type: 'leave',
          action: 'approved',
          description: 'Du godkände Anna Anderssons semesteransökan för 10-15 juli',
          timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3h sedan
          referenceId: '11',
          referenceType: 'leave',
          performedBy: null,
        },
        {
          id: 12,
          employeeId: 'MANAGER',
          type: 'deviation',
          action: 'returned',
          description: 'Du skickade tillbaka Johan Svenssons övertidsrapport för mer information',
          timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6h sedan
          referenceId: '12',
          referenceType: 'deviation',
          performedBy: null,
        }
      ];

    case 'hr':
      // HR ser systemövergripande aktiviteter och personalärenden
      return [
        {
          id: 20,
          employeeId: 'HR',
          type: 'employee',
          action: 'onboarded',
          description: 'Ny medarbetare Lisa Karlsson har registrerats i systemet',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000), // 1h sedan
          referenceId: '20',
          referenceType: 'employee',
          performedBy: null,
        },
        {
          id: 21,
          employeeId: 'HR',
          type: 'leave',
          action: 'policy_updated',
          description: 'Semesterpolicy har uppdaterats - nya regler för sparade semesterdagar',
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4h sedan
          referenceId: '21',
          referenceType: 'policy',
          performedBy: null,
        },
        {
          id: 22,
          employeeId: 'HR',
          type: 'deviation',
          action: 'escalated',
          description: 'Avvikelserapport från Erik Eriksson kräver HR-granskning',
          timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000), // 8h sedan
          referenceId: '22',
          referenceType: 'deviation',
          performedBy: null,
        }
      ];

    case 'payroll':
      // Löneadministratör ser lönerelaterade aktiviteter och PAXML-exporter
      return [
        {
          id: 30,
          employeeId: 'PAYROLL',
          type: 'payroll',
          action: 'exported',
          description: 'PAXML-export för mars 2024 slutförd - 47 medarbetare inkluderade',
          timestamp: new Date(now.getTime() - 90 * 60 * 1000), // 1.5h sedan
          referenceId: '30',
          referenceType: 'paxml',
          performedBy: null,
        },
        {
          id: 31,
          employeeId: 'PAYROLL',
          type: 'payslip',
          action: 'published',
          description: 'Lönespecifikationer för mars publicerade för alla medarbetare',
          timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5h sedan
          referenceId: '31',
          referenceType: 'payslip',
          performedBy: null,
        },
        {
          id: 32,
          employeeId: 'PAYROLL',
          type: 'deviation',
          action: 'processed',
          description: '12 övertidsrapporter har behandlats och förts in i lönesystemet',
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 dag sedan
          referenceId: '32',
          referenceType: 'deviation',
          performedBy: null,
        }
      ];

    default:
      return [];
  }
};

// Få aktivitetstitlar som är rollspecifika
export const getRoleSpecificActivityTitle = (role: UserRole): string => {
  switch (role) {
    case 'employee': return 'Senaste aktivitet';
    case 'manager': return 'Senaste chefsaktiviteter';
    case 'hr': return 'Senaste HR-aktiviteter';
    case 'payroll': return 'Senaste löneaktiviteter';
    default: return 'Senaste aktivitet';
  }
};