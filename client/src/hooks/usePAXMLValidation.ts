import { useMemo } from 'react';
import { Deviation, Employee } from '@shared/schema';

// Validation types
export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'data' | 'business' | 'format';
  title: string;
  description: string;
  employeeId?: string;
  deviationId?: number;
  action?: string;
}

export interface ValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  stats: {
    totalDeviations: number;
    validDeviations: number;
    invalidDeviations: number;
    missingTimeCodes: number;
    duplicates: number;
    dataErrors: number;
  };
}

export function usePAXMLValidation(
  deviations: Deviation[], 
  employees: Employee[], 
  timeCodes: any[] = []
): ValidationResult {
  return useMemo(() => {
    const issues: ValidationIssue[] = [];
    let stats = {
      totalDeviations: deviations.length,
      validDeviations: 0,
      invalidDeviations: 0,
      missingTimeCodes: 0,
      duplicates: 0,
      dataErrors: 0,
    };

    // Only validate approved deviations (like current system)
    const approvedDeviations = deviations.filter(d => d.status === 'approved');
    stats.totalDeviations = approvedDeviations.length;

    if (approvedDeviations.length === 0) {
      issues.push({
        id: 'no-approved-deviations',
        type: 'info',
        category: 'data',
        title: 'Inga godkända avvikelser',
        description: 'Det finns inga godkända avvikelser att exportera till Kontek Lön.',
        action: 'Godkänn avvikelser först'
      });
      return {
        isValid: true, // Not an error - just empty
        hasErrors: false,
        hasWarnings: false,
        issues,
        stats
      };
    }

    // 1. DATA QUALITY VALIDATION
    approvedDeviations.forEach((deviation) => {
      let hasIssues = false;

      // Missing required fields
      if (!deviation.timeCode) {
        issues.push({
          id: `missing-timecode-${deviation.id}`,
          type: 'error',
          category: 'data',
          title: 'Saknar tidkod',
          description: `Avvikelse för ${getEmployeeName(deviation.employeeId, employees)} saknar tidkod`,
          employeeId: deviation.employeeId,
          deviationId: deviation.id,
          action: 'Lägg till tidkod'
        });
        stats.missingTimeCodes++;
        hasIssues = true;
      }

      if (!deviation.date) {
        issues.push({
          id: `missing-date-${deviation.id}`,
          type: 'error',
          category: 'data',
          title: 'Saknar datum',
          description: `Avvikelse för ${getEmployeeName(deviation.employeeId, employees)} saknar datum`,
          employeeId: deviation.employeeId,
          deviationId: deviation.id,
          action: 'Lägg till datum'
        });
        hasIssues = true;
      }

      if (!deviation.startTime || !deviation.endTime) {
        issues.push({
          id: `missing-time-${deviation.id}`,
          type: 'error',
          category: 'data',
          title: 'Saknar tid',
          description: `Avvikelse för ${getEmployeeName(deviation.employeeId, employees)} saknar start- eller sluttid`,
          employeeId: deviation.employeeId,
          deviationId: deviation.id,
          action: 'Lägg till tider'
        });
        hasIssues = true;
      }

      // Invalid employee reference
      const employee = employees.find(e => e.employeeId === deviation.employeeId);
      if (!employee) {
        issues.push({
          id: `invalid-employee-${deviation.id}`,
          type: 'error',
          category: 'data',
          title: 'Okänd anställd',
          description: `Anställd ${deviation.employeeId} finns inte i systemet`,
          employeeId: deviation.employeeId,
          deviationId: deviation.id,
          action: 'Kontrollera anställd'
        });
        hasIssues = true;
      }

      // Invalid time code
      if (deviation.timeCode && timeCodes.length > 0) {
        const timeCode = timeCodes.find(tc => tc.code === deviation.timeCode);
        if (!timeCode) {
          issues.push({
            id: `invalid-timecode-${deviation.id}`,
            type: 'warning',
            category: 'format',
            title: 'Okänd tidkod',
            description: `Tidkod ${deviation.timeCode} finns inte i Kontek Lön`,
            employeeId: deviation.employeeId,
            deviationId: deviation.id,
            action: 'Kontrollera tidkod'
          });
        }
      }

      if (hasIssues) {
        stats.invalidDeviations++;
        stats.dataErrors++;
      } else {
        stats.validDeviations++;
      }
    });

    // 2. BUSINESS RULES VALIDATION (Swedish payroll)
    approvedDeviations.forEach((deviation) => {
      if (!deviation.startTime || !deviation.endTime || !deviation.date) return;

      try {
        const startTime = new Date(`${deviation.date}T${deviation.startTime}`);
        const endTime = new Date(`${deviation.date}T${deviation.endTime}`);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

        // Excessive overtime warning (Swedish labor law)
        if (deviation.timeCode?.startsWith('2') && hours > 12) { // Overtime codes start with 2
          issues.push({
            id: `excessive-overtime-${deviation.id}`,
            type: 'warning',
            category: 'business',
            title: 'Mycket övertid',
            description: `${getEmployeeName(deviation.employeeId, employees)} har ${hours.toFixed(1)}h övertid (>12h kan kräva speciell hantering)`,
            employeeId: deviation.employeeId,
            deviationId: deviation.id,
            action: 'Kontrollera arbetsmiljölagen'
          });
        }

        // Weekend work validation
        const dayOfWeek = new Date(deviation.date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday = 0, Saturday = 6
          if (!deviation.timeCode?.startsWith('2')) { // Not overtime
            issues.push({
              id: `weekend-work-${deviation.id}`,
              type: 'warning',
              category: 'business',
              title: 'Helgarbete',
              description: `${getEmployeeName(deviation.employeeId, employees)} arbetar helg utan övertidskod`,
              employeeId: deviation.employeeId,
              deviationId: deviation.id,
              action: 'Kontrollera tidkod för helgarbete'
            });
          }
        }

        // Future date warning
        const today = new Date();
        const deviationDate = new Date(deviation.date);
        if (deviationDate > today) {
          issues.push({
            id: `future-date-${deviation.id}`,
            type: 'warning',
            category: 'business',
            title: 'Framtida datum',
            description: `Avvikelse för ${getEmployeeName(deviation.employeeId, employees)} har framtida datum`,
            employeeId: deviation.employeeId,
            deviationId: deviation.id,
            action: 'Kontrollera datum'
          });
        }
      } catch (error) {
        issues.push({
          id: `invalid-time-format-${deviation.id}`,
          type: 'error',
          category: 'format',
          title: 'Ogiltigt tidsformat',
          description: `Kan inte beräkna tid för ${getEmployeeName(deviation.employeeId, employees)}`,
          employeeId: deviation.employeeId,
          deviationId: deviation.id,
          action: 'Korrigera tidsformat'
        });
        stats.dataErrors++;
      }
    });

    // 3. DUPLICATE DETECTION
    const duplicateMap = new Map<string, Deviation[]>();
    
    approvedDeviations.forEach((deviation) => {
      const key = `${deviation.employeeId}-${deviation.date}-${deviation.startTime}-${deviation.endTime}`;
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(deviation);
    });

    duplicateMap.forEach((duplicates, key) => {
      if (duplicates.length > 1) {
        stats.duplicates += duplicates.length - 1; // Count extras as duplicates
        
        issues.push({
          id: `duplicate-${key}`,
          type: 'error',
          category: 'data',
          title: 'Dubblett upptäckt',
          description: `${duplicates.length} identiska avvikelser för ${getEmployeeName(duplicates[0].employeeId, employees)} på ${duplicates[0].date}`,
          employeeId: duplicates[0].employeeId,
          action: 'Ta bort dubbletter'
        });
      }
    });

    // 4. CALCULATE FINAL VALIDATION STATUS
    const hasErrors = issues.some(issue => issue.type === 'error');
    const hasWarnings = issues.some(issue => issue.type === 'warning');
    const isValid = !hasErrors && approvedDeviations.length > 0;

    // Add summary if there are issues
    if (issues.length > 0) {
      const errorCount = issues.filter(i => i.type === 'error').length;
      const warningCount = issues.filter(i => i.type === 'warning').length;
      
      if (errorCount > 0) {
        issues.unshift({
          id: 'validation-summary-errors',
          type: 'error',
          category: 'data',
          title: 'Export blockerad',
          description: `${errorCount} kritiska fel måste fixas innan export till Kontek Lön`,
          action: 'Fixa fel nedan'
        });
      } else if (warningCount > 0) {
        issues.unshift({
          id: 'validation-summary-warnings',
          type: 'warning',
          category: 'business',
          title: 'Export möjlig men varningar finns',
          description: `${warningCount} varningar upptäckta - kontrollera data innan export`,
          action: 'Granska varningar'
        });
      }
    }

    return {
      isValid,
      hasErrors,
      hasWarnings,
      issues,
      stats
    };
  }, [deviations, employees, timeCodes]);
}

// Helper function to get employee name
function getEmployeeName(employeeId: string, employees: Employee[]): string {
  const employee = employees.find(e => e.employeeId === employeeId);
  return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
}