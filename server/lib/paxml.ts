export const TIME_CODE_MAPPING: Record<string, string> = {
  '300': 'SJK', // Sjukdom
  '301': 'HAV', // Havandeskap
  '302': 'FPE', // Föräldraledig
  '303': 'PAP', // Pappaledig
  '400': 'VAB', // Vård av barn
  '401': 'KON', // Kontaktdagar
  '402': 'MIL', // Repövning
  '403': 'UTB', // Utbildning (semestergrundande)
  '100': 'SEM', // Semester
  '404': 'TJL', // Tjänstledig
  '405': 'ASK', // Arbetsskada
  '406': 'FAC', // Facklig verksamhet
  '407': 'KOM', // Kompledig
  '408': 'NÄR', // Närståendevård
  '409': 'PEM', // Permission
  '410': 'PER', // Permitterad
  '411': 'ATK', // Arbetstidskonto
  '412': 'ATF', // Arbetstidsförkortning
  '413': 'SMB', // Smittbärare
  '414': 'SVE', // Svenskundervisning för invandrare
  
  '501': 'FR1', // Egen frånvaroorsak 1
  '502': 'FR2', // Egen frånvaroorsak 2
  '503': 'FR3', // Egen frånvaroorsak 3
  '504': 'FR4', // Egen frånvaroorsak 4
  '505': 'FR5', // Egen frånvaroorsak 5
  '506': 'FR6', // Egen frånvaroorsak 6
  '507': 'FR7', // Egen frånvaroorsak 7
  '508': 'FR8', // Egen frånvaroorsak 8
  '509': 'FR9', // Egen frånvaroorsak 9
  
  '200': '200', // Övertid
  '210': '210', // Övertid 2
  '220': '220', // Övertid 3
  
  '500': 'SEN', // Sen ankomst
  '510': 'TID', // Tidig avgång
};

export interface PAXMLTransaction {
  employeeId: string;
  date: string;
  timeCode: string;
  hours: number;
  comment?: string;
}

export interface PAXMLScheduleTransaction {
  employeeId: string;
  date: string;
  hours: number;
}

export interface PAXMLSchedule {
  employeeId: string;
  days: PAXMLScheduleTransaction[];
}

export function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

export function mapToPAXMLCode(internalCode: string): string {
  return TIME_CODE_MAPPING[internalCode] || internalCode;
}

export function convertXMLScheduleToAppSchedule(xmlSchedule: PAXMLSchedule): any[] {
  return xmlSchedule.days.map(day => {
    const hours = day.hours;
    let startTime = '08:00:00';
    let endTime = '17:00:00';
    let breakStart = '12:00:00';
    let breakEnd = '13:00:00';
    
    if (hours !== 8) {
      const startHour = 8;
      const breakDuration = 1;
      const workHours = hours;
      const endHour = startHour + workHours + breakDuration;
      
      if (endHour <= 24) {
        endTime = `${endHour.toString().padStart(2, '0')}:00:00`;
      } else {
        endTime = '17:00:00';
        startTime = `${Math.max(8, 17 - workHours - breakDuration).toString().padStart(2, '0')}:00:00`;
      }
    }
    
    return {
      employeeId: day.employeeId,
      date: day.date,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      status: 'scheduled'
    };
  });
}

export function convertAppScheduleToXMLSchedule(schedules: any[]): PAXMLSchedule[] {
  const schedulesByEmployee = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.employeeId]) {
      acc[schedule.employeeId] = [];
    }
    
    const workHours = calculateHours(schedule.startTime, schedule.endTime);
    const breakHours = schedule.breakStart && schedule.breakEnd 
      ? calculateHours(schedule.breakStart, schedule.breakEnd) 
      : 0;
    const netHours = workHours - breakHours;
    
    acc[schedule.employeeId].push({
      employeeId: schedule.employeeId,
      date: schedule.date,
      hours: Math.round(netHours * 100) / 100
    });
    
    return acc;
  }, {} as Record<string, PAXMLScheduleTransaction[]>);
  
  return Object.entries(schedulesByEmployee).map(([employeeId, days]): PAXMLSchedule => ({
    employeeId,
    days: days as PAXMLScheduleTransaction[]
  }));
}

export function generatePAXMLTransactions(
  deviations: any[],
  employees: any[]
): PAXMLTransaction[] {
  const approvedDeviations = deviations.filter(d => d.status === 'approved');
  
  return approvedDeviations.map(deviation => {
    const employee = employees.find(e => e.employeeId === deviation.employeeId);
    const hours = calculateHours(deviation.startTime, deviation.endTime);
    
    return {
      employeeId: deviation.employeeId,
      date: deviation.date,
      timeCode: mapToPAXMLCode(deviation.timeCode),
      hours: hours,
      comment: deviation.comment
    };
  });
}

export function generatePAXMLXML(transactions: PAXMLTransaction[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="utf-8"?>';
  const paXmlOpen = '<paxml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.paxml.se/2.2/paxml.xsd">';
  const paXmlClose = '</paxml>';
  
  const headerSection = `\t<header>
\t\t<format>LÖNIN</format>
\t\t<version>2.2</version>
\t</header>`;

  const transactionElements = transactions.map(transaction => 
    `\t\t<tidtrans anstid="${transaction.employeeId}">
\t\t\t<tidkod>${transaction.timeCode}</tidkod>
\t\t\t<datum>${transaction.date}</datum>
\t\t\t<timmar>${transaction.hours.toFixed(2)}</timmar>${transaction.comment ? `
\t\t\t<kommentar>${escapeXML(transaction.comment)}</kommentar>` : ''}
\t\t</tidtrans>`
  ).join('\n');

  return `${xmlHeader}
${paXmlOpen}
${headerSection}
\t<tidtransaktioner>
${transactionElements}
\t</tidtransaktioner>
${paXmlClose}`;
}

export function generatePAXMLXMLWithSchedules(
  transactions: PAXMLTransaction[], 
  schedules: PAXMLSchedule[]
): string {
  const xmlHeader = '<?xml version="1.0" encoding="utf-8"?>';
  const paXmlOpen = '<paxml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.paxml.se/2.2/paxml.xsd">';
  const paXmlClose = '</paxml>';
  
  const headerSection = `\t<header>
\t\t<format>LÖNIN</format>
\t\t<version>2.2</version>
\t</header>`;

  const transactionElements = transactions.map(transaction => 
    `\t\t<tidtrans anstid="${transaction.employeeId}">
\t\t\t<tidkod>${transaction.timeCode}</tidkod>
\t\t\t<datum>${transaction.date}</datum>
\t\t\t<timmar>${transaction.hours.toFixed(2)}</timmar>${transaction.comment ? `
\t\t\t<kommentar>${escapeXML(transaction.comment)}</kommentar>` : ''}
\t\t</tidtrans>`
  ).join('\n');

  const scheduleElements = schedules.map(schedule => {
    const dayElements = schedule.days.map(day => 
      `\t\t\t<dag datum="${day.date}" timmar="${day.hours.toFixed(2)}" />`
    ).join('\n');
    
    return `\t\t<schema anstid="${schedule.employeeId}">
${dayElements}
\t\t</schema>`;
  }).join('\n');

  const tidtransaktionerSection = transactions.length > 0 ? `\t<tidtransaktioner>
${transactionElements}
\t</tidtransaktioner>` : '';

  const schematransaktionerSection = schedules.length > 0 ? `\t<schematransaktioner>
${scheduleElements}
\t</schematransaktioner>` : '';

  return `${xmlHeader}
${paXmlOpen}
${headerSection}${tidtransaktionerSection ? `
${tidtransaktionerSection}` : ''}${schematransaktionerSection ? `
${schematransaktionerSection}` : ''}
${paXmlClose}`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validatePAXMLData(transactions: PAXMLTransaction[]): string[] {
  const errors: string[] = [];
  
  transactions.forEach((transaction, index) => {
    if (!transaction.employeeId) {
      errors.push(`Transaction ${index + 1}: Missing employeeId`);
    }
    if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      errors.push(`Transaction ${index + 1}: Invalid date format (expected YYYY-MM-DD)`);
    }
    if (!transaction.timeCode) {
      errors.push(`Transaction ${index + 1}: Missing timeCode`);
    }
    if (transaction.hours <= 0) {
      errors.push(`Transaction ${index + 1}: Hours must be greater than 0`);
    }
  });
  
  return errors;
}
