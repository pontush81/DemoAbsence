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
  '408': 'NÄR', // Närståendevård (korrekt svenska tecken)
  '409': 'PEM', // Permission
  '410': 'PER', // Permitterad
  '411': 'ATK', // Arbetstidskonto
  '412': 'ATF', // Arbetstidsförkortning
  '413': 'SMB', // Smittbärare
  '414': 'SVE', // Svenskundervisning för invandrare
  
  // Utökade koder enligt PAXML 2.2 XSD
  '415': 'JR1', // Jour - första nivå
  '416': 'JR2', // Jour - andra nivå  
  '417': 'JR3', // Jour - tredje nivå
  '418': 'BE1', // Beredskapstid - första nivå
  '419': 'BE2', // Beredskapstid - andra nivå
  '420': 'RE1', // Restid - första nivå
  '421': 'RE2', // Restid - andra nivå
  '422': 'HLG', // Helgdag
  '423': 'SKI', // Skiftarbete
  '424': 'FLX', // Flextid
  '425': 'SCH'  // Schema
  
  '501': 'FR1', // Egen frånvaroorsak 1
  '502': 'FR2', // Egen frånvaroorsak 2
  '503': 'FR3', // Egen frånvaroorsak 3
  '504': 'FR4', // Egen frånvaroorsak 4
  '505': 'FR5', // Egen frånvaroorsak 5
  '506': 'FR6', // Egen frånvaroorsak 6
  '507': 'FR7', // Egen frånvaroorsak 7
  '508': 'FR8', // Egen frånvaroorsak 8
  '509': 'FR9', // Egen frånvaroorsak 9
  
  // Övertidskoder - nu enligt PAXML standard
  '200': 'ÖT1', // Övertid första nivå
  '210': 'ÖT2', // Övertid andra nivå
  '220': 'ÖT3', // Övertid tredje nivå
  
  // Frånvarokoder utan officiell PAXML-motsvarighet - använd fria koder
  '500': 'FR1', // Sen ankomst -> Egen frånvaroorsak 1
  '510': 'FR2', // Tidig avgång -> Egen frånvaroorsak 2
};

export interface PAXMLTransaction {
  employeeId: string;
  personnummer: string;
  date: string;
  timeCode: string;
  hours: number;
  comment?: string;
  postId?: number;
}

export interface PAXMLScheduleTransaction {
  employeeId: string;
  personnummer: string;
  date: string;
  startTime?: string;
  endTime?: string;
  hours: number;
}

export interface PAXMLSchedule {
  employeeId: string;
  personnummer: string;
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

export function convertAppScheduleToXMLSchedule(
  schedules: any[], 
  employees: any[]
): PAXMLSchedule[] {
  const schedulesByEmployee = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.employeeId]) {
      acc[schedule.employeeId] = [];
    }
    
    const employee = employees.find(e => e.employeeId === schedule.employeeId);
    if (!employee) {
      throw new Error(`Employee not found for employeeId: ${schedule.employeeId}`);
    }
    
    // Fix personnummer format: Remove dashes to get exactly 12 digits (ÅÅMMDDNNNN)
    const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
    
    const workHours = calculateHours(schedule.startTime, schedule.endTime);
    const breakHours = schedule.breakStart && schedule.breakEnd 
      ? calculateHours(schedule.breakStart, schedule.breakEnd) 
      : 0;
    const netHours = workHours - breakHours;
    
    acc[schedule.employeeId].push({
      employeeId: schedule.employeeId,
      personnummer: personnummer12,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      hours: Math.round(netHours * 100) / 100
    });
    
    return acc;
  }, {} as Record<string, PAXMLScheduleTransaction[]>);
  
  return Object.entries(schedulesByEmployee).map(([employeeId, days]): PAXMLSchedule => {
    const employee = employees.find(e => e.employeeId === employeeId)!;
    // Fix personnummer format: Remove dashes to get exactly 12 digits (ÅÅMMDDNNNN)
    const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
    return {
      employeeId,
      personnummer: personnummer12,
      days: days as PAXMLScheduleTransaction[]
    };
  });
}

export function generatePAXMLTransactions(
  deviations: any[],
  employees: any[]
): PAXMLTransaction[] {
  const approvedDeviations = deviations.filter(d => d.status === 'approved');
  
  return approvedDeviations.map((deviation, index) => {
    const employee = employees.find(e => e.employeeId === deviation.employeeId);
    if (!employee) {
      throw new Error(`Employee not found for employeeId: ${deviation.employeeId}`);
    }
    const hours = calculateHours(deviation.startTime, deviation.endTime);
    
    // Fix personnummer format: Remove dashes to get exactly 12 digits (ÅÅMMDDNNNN)
    const personnummer12 = employee.personnummer ? employee.personnummer.replace(/-/g, '') : '';
    
    return {
      employeeId: deviation.employeeId,
      personnummer: personnummer12,
      date: deviation.date,
      timeCode: mapToPAXMLCode(deviation.timeCode),
      hours: hours,
      comment: deviation.comment,
      postId: index + 1
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
    `\t\t<tidtrans${transaction.postId ? ` postid="${transaction.postId}"` : ''} anstid="${transaction.employeeId}" persnr="${transaction.personnummer}">
\t\t\t<tidkod>${transaction.timeCode}</tidkod>
\t\t\t<datum>${transaction.date}</datum>
\t\t\t<timmar>${transaction.hours.toFixed(2)}</timmar>${transaction.comment ? `
\t\t\t<info>${escapeXML(transaction.comment)}</info>` : ''}
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
    `\t\t<tidtrans${transaction.postId ? ` postid="${transaction.postId}"` : ''} anstid="${transaction.employeeId}" persnr="${transaction.personnummer}">
\t\t\t<tidkod>${transaction.timeCode}</tidkod>
\t\t\t<datum>${transaction.date}</datum>
\t\t\t<timmar>${transaction.hours.toFixed(2)}</timmar>${transaction.comment ? `
\t\t\t<info>${escapeXML(transaction.comment)}</info>` : ''}
\t\t</tidtrans>`
  ).join('\n');

  const scheduleElements = schedules.map(schedule => {
    const dayElements = schedule.days.map(day => 
      `\t\t\t<dag datum="${day.date}"${day.startTime ? ` starttid="${day.startTime}"` : ''}${day.endTime ? ` sluttid="${day.endTime}"` : ''} timmar="${day.hours.toFixed(2)}" />`
    ).join('\n');
    
    return `\t\t<schema anstid="${schedule.employeeId}" persnr="${schedule.personnummer}">
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

// Tillåtna tidkoder enligt PAXML 2.2 XSD
const VALID_PAXML_TIDKODER = [
  'SJK', 'SJK_KAR', 'SJK_LÖN', 'SJK_ERS', 'SJK_PEN', 'ASK', 'HAV', 'FPE', 'VAB', 'SMB',
  'UTB', 'MIL', 'SVE', 'NÄR', 'TJL', 'SEM', 'SEM_BET', 'SEM_SPA', 'SEM_OBE', 'SEM_FÖR',
  'KOM', 'PEM', 'PER', 'FAC', 'ATK', 'KON', 'PAP', 'ATF', 'FR1', 'FR2', 'FR3', 'FR4', 'FR5',
  'FR6', 'FR7', 'FR8', 'FR9', 'SCH', 'FLX', 'FRX', 'NVX', 'TS1', 'TS2', 'TS3', 'TS4', 'TS5',
  'TS6', 'TS7', 'TS8', 'TS9', 'TID', 'ARB', 'MER', 'ÖT1', 'ÖT2', 'ÖT3', 'ÖT4', 'ÖT5',
  'ÖK1', 'ÖK2', 'ÖK3', 'ÖK4', 'ÖK5', 'OB1', 'OB2', 'OB3', 'OB4', 'OB5', 'OS1', 'OS2',
  'OS3', 'OS4', 'OS5', 'JR1', 'JR2', 'JR3', 'JR4', 'JR5', 'JS1', 'JS2', 'JS3', 'JS4', 'JS5',
  'BE1', 'BE2', 'BE3', 'BE4', 'BE5', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'RE1', 'RE2', 'RE3',
  'RE4', 'RE5', 'HLG', 'SKI', 'LT1', 'LT2', 'LT3', 'LT4', 'LT5', 'LT6', 'LT7', 'LT8', 'LT9',
  'NV1', 'NV2', 'NV3', 'NV4', 'NV5', 'NV6', 'NV7', 'NV8', 'NV9'
];

export function validatePAXMLData(transactions: PAXMLTransaction[]): string[] {
  const errors: string[] = [];
  
  transactions.forEach((transaction, index) => {
    if (!transaction.employeeId) {
      errors.push(`Transaction ${index + 1}: Missing employeeId`);
    }
    if (!transaction.personnummer) {
      errors.push(`Transaction ${index + 1}: Missing personnummer`);
    }
    if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
      errors.push(`Transaction ${index + 1}: Invalid date format (expected YYYY-MM-DD)`);
    }
    if (!transaction.timeCode) {
      errors.push(`Transaction ${index + 1}: Missing timeCode`);
    } else if (!VALID_PAXML_TIDKODER.includes(transaction.timeCode)) {
      errors.push(`Transaction ${index + 1}: Invalid timeCode '${transaction.timeCode}' - not allowed in PAXML 2.2 XSD`);
    }
    if (transaction.hours <= 0) {
      errors.push(`Transaction ${index + 1}: Hours must be greater than 0`);
    }
    // Validate personnummer format: Exactly 12 digits (ÅÅMMDDNNNN) as per PAXML XSD
    if (transaction.personnummer && !/^\d{12}$/.test(transaction.personnummer)) {
      errors.push(`Transaction ${index + 1}: Invalid personnummer format (expected exactly 12 digits ÅÅMMDDNNNN, got: ${transaction.personnummer})`);
    }
  });
  
  return errors;
}
