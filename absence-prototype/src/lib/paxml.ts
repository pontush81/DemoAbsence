import { Deviation, Employee } from '../types';

export const TIME_CODE_MAPPING: Record<string, string> = {
  '300': 'SJK', // Sjukdom → Sjukfrånvaro
  '400': 'VAB', // Vård av barn → Vård av barn
  '200': '200', // Övertid keeps numeric code
  '210': '210', // Övertid 2 keeps numeric code
  '220': '220', // Övertid 3 keeps numeric code
  '500': 'SEN', // Sen ankomst → custom code
  '510': 'TID', // Tidig avgång → custom code
};

export interface PAXMLTransaction {
  employeeId: string;
  date: string;
  timeCode: string;
  hours: number;
  comment?: string;
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

export function generatePAXMLTransactions(
  deviations: Deviation[],
  employees: Employee[]
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
