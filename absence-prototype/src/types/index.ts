export interface Employee {
  id: number;
  employeeId: string;
  personnummer: string;
  firstName: string;
  lastName: string;
  careOfAddress?: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  workEmail?: string;
  preferredEmail: string;
  status: string;
  role: string;
  bankClearingNumber?: string;
  bankAccountNumber?: string;
  bankBIC?: string;
  bankCountryCode?: string;
  bankIBAN?: string;
  department?: string;
  position?: string;
  manager?: string;
  scheduleTemplate?: string;
}

export interface Deviation {
  id: number;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  timeCode: string;
  comment?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned';
  managerComment?: string;
  lastUpdated: string;
  submitted?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export interface TimeCode {
  id: number;
  code: string;
  name: string;
  nameSV: string;
  nameEN: string;
  category: string;
  requiresApproval: boolean;
  approvalType?: string; // "pre_approval", "post_approval", "attestation", "flexible"
}

export interface LeaveRequest {
  id: number;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  scope: string;
  customStartTime?: string;
  customEndTime?: string;
  comment?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paused';
  managerComment?: string;
  lastUpdated: string;
  submitted?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  pausedBy?: string;
  pausedAt?: string;
  pauseReason?: string;
}

export interface PAXMLTransaction {
  employeeId: string;
  date: string;
  timeCode: string;
  hours: number;
  comment?: string;
}
