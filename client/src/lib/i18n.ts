import { create } from 'zustand';

type Language = 'sv' | 'en';

type Translations = {
  [key: string]: {
    sv: string;
    en: string;
  };
};

const translations: Translations = {
  // Navigation
  'nav.dashboard': {
    sv: 'Översikt',
    en: 'Dashboard',
  },
  'nav.deviations': {
    sv: 'Avvikelser',
    en: 'Deviations',
  },
  'nav.leave': {
    sv: 'Ledighet',
    en: 'Leave',
  },
  'nav.payslips': {
    sv: 'Lönespecifikationer',
    en: 'Payslips',
  },
  'nav.settings': {
    sv: 'Inställningar',
    en: 'Settings',
  },
  'nav.manager': {
    sv: 'Chefvy',
    en: 'Manager View',
  },
  'nav.attestation': {
    sv: 'Attestering',
    en: 'Attestation',
  },
  'nav.expenses': {
    sv: 'Resa & Utlägg',
    en: 'Travel & Expenses',
  },
  
  // Dashboard
  'dashboard.greeting': {
    sv: 'Hej',
    en: 'Hello',
  },
  'dashboard.workSchedule': {
    sv: 'Arbetsschema idag',
    en: 'Today\'s Schedule',
  },
  'dashboard.break': {
    sv: 'Rast',
    en: 'Break',
  },
  'dashboard.timeBalance': {
    sv: 'Tidssaldo',
    en: 'Time Balance',
  },
  'dashboard.lastMonth': {
    sv: 'Förra månaden',
    en: 'Last Month',
  },
  'dashboard.vacationBalance': {
    sv: 'Semestersaldo',
    en: 'Vacation Balance',
  },
  'dashboard.savedDays': {
    sv: 'Sparade dagar',
    en: 'Saved Days',
  },
  'dashboard.pendingApprovals': {
    sv: 'Avvikelser att godkänna',
    en: 'Pending Approvals',
  },
  'dashboard.viewAll': {
    sv: 'Visa alla',
    en: 'View All',
  },
  'dashboard.recentActivity': {
    sv: 'Senaste aktivitet',
    en: 'Recent Activity',
  },
  'dashboard.viewAllActivities': {
    sv: 'Visa alla aktiviteter',
    en: 'View All Activities',
  },
  'dashboard.quickActions': {
    sv: 'Snabbåtgärder',
    en: 'Quick Actions',
  },
  'dashboard.registerDeviation': {
    sv: 'Registrera avvikelse',
    en: 'Register Deviation',
  },
  'dashboard.applyLeave': {
    sv: 'Ansök om ledighet',
    en: 'Apply for Leave',
  },
  'dashboard.viewPayslip': {
    sv: 'Visa lönespecifikation',
    en: 'View Payslip',
  },
  'dashboard.personalInfo': {
    sv: 'Personuppgifter',
    en: 'Personal Info',
  },
  
  // Common Actions
  'action.newDeviation': {
    sv: 'Ny avvikelse',
    en: 'New Deviation',
  },
  'action.cancel': {
    sv: 'Avbryt',
    en: 'Cancel',
  },
  'action.saveDraft': {
    sv: 'Spara utkast',
    en: 'Save Draft',
  },
  'action.submit': {
    sv: 'Skicka för godkännande',
    en: 'Submit for Approval',
  },
  'action.back': {
    sv: 'Tillbaka',
    en: 'Back',
  },
  'action.approve': {
    sv: 'Godkänn',
    en: 'Approve',
  },
  'action.reject': {
    sv: 'Avslå',
    en: 'Reject',
  },
  'action.approveAll': {
    sv: 'Godkänn alla',
    en: 'Approve All',
  },
  'action.comment': {
    sv: 'Kommentera',
    en: 'Comment',
  },
  'action.remind': {
    sv: 'Påminn',
    en: 'Remind',
  },
  'action.filter': {
    sv: 'Filtrera',
    en: 'Filter',
  },
  'action.edit': {
    sv: 'Redigera',
    en: 'Edit',
  },
  'action.delete': {
    sv: 'Ta bort',
    en: 'Delete',
  },
  'action.save': {
    sv: 'Spara',
    en: 'Save',
  },
  'action.view': {
    sv: 'Visa',
    en: 'View',
  },
  
  // Deviations
  'deviations.title': {
    sv: 'Avvikelser',
    en: 'Deviations',
  },
  'deviations.description': {
    sv: 'Hantera och skapa schemaavvikelser',
    en: 'Manage and create schedule deviations',
  },
  'deviations.registerTitle': {
    sv: 'Registrera avvikelse',
    en: 'Register Deviation',
  },
  'deviations.registerDescription': {
    sv: 'Lägg till en ny avvikelse i ditt schema',
    en: 'Add a new deviation to your schedule',
  },
  'deviations.date': {
    sv: 'Datum',
    en: 'Date',
  },
  'deviations.startTime': {
    sv: 'Från tid',
    en: 'Start Time',
  },
  'deviations.endTime': {
    sv: 'Till tid',
    en: 'End Time',
  },
  'deviations.timeCode': {
    sv: 'Tidkod',
    en: 'Time Code',
  },
  'deviations.selectTimeCode': {
    sv: 'Välj tidkod',
    en: 'Select time code',
  },
  'deviations.comment': {
    sv: 'Kommentar',
    en: 'Comment',
  },
  'deviations.commentPlaceholder': {
    sv: 'Lägg till en beskrivning av avvikelsen...',
    en: 'Add a description of the deviation...',
  },
  'deviations.period': {
    sv: 'Period',
    en: 'Period',
  },
  'deviations.currentMonth': {
    sv: 'Innevarande månad',
    en: 'Current Month',
  },
  'deviations.lastMonth': {
    sv: 'Föregående månad',
    en: 'Previous Month',
  },
  'deviations.customPeriod': {
    sv: 'Anpassad period',
    en: 'Custom Period',
  },
  'deviations.status': {
    sv: 'Status',
    en: 'Status',
  },
  'deviations.allStatuses': {
    sv: 'Alla statusar',
    en: 'All Statuses',
  },
  'deviations.pending': {
    sv: 'Väntar på godkännande',
    en: 'Pending Approval',
  },
  'deviations.approved': {
    sv: 'Godkänd',
    en: 'Approved',
  },
  'deviations.rejected': {
    sv: 'Ej godkänd',
    en: 'Rejected',
  },
  'deviations.returned': {
    sv: 'Retur',
    en: 'Returned',
  },
  'deviations.draft': {
    sv: 'Utkast',
    en: 'Draft',
  },
  'deviations.allTimeCodes': {
    sv: 'Alla tidkoder',
    en: 'All Time Codes',
  },
  'deviations.overtime': {
    sv: 'Övertid',
    en: 'Overtime',
  },
  'deviations.sick': {
    sv: 'Sjukdom',
    en: 'Sick Leave',
  },
  'deviations.vab': {
    sv: 'VAB',
    en: 'Care of Child',
  },
  'deviations.time': {
    sv: 'Tid',
    en: 'Time',
  },
  'deviations.actions': {
    sv: 'Åtgärder',
    en: 'Actions',
  },
  
  // Leave requests
  'leave.title': {
    sv: 'Ledighet',
    en: 'Leave',
  },
  'leave.description': {
    sv: 'Hantera och ansök om ledighet',
    en: 'Manage and apply for leave',
  },
  'leave.applyTitle': {
    sv: 'Ansök om ledighet',
    en: 'Apply for Leave',
  },
  'leave.applyDescription': {
    sv: 'Skapa en ny ledighetsansökan',
    en: 'Create a new leave request',
  },
  'leave.leaveType': {
    sv: 'Ledighetstyp',
    en: 'Leave Type',
  },
  'leave.selectLeaveType': {
    sv: 'Välj ledighetstyp',
    en: 'Select leave type',
  },
  'leave.vacation': {
    sv: 'Semester',
    en: 'Vacation',
  },
  'leave.compLeave': {
    sv: 'Kompledighet',
    en: 'Compensatory Leave',
  },
  'leave.unpaidLeave': {
    sv: 'Tjänstledighet utan lön',
    en: 'Unpaid Leave',
  },
  'leave.parentalLeave': {
    sv: 'Föräldraledighet',
    en: 'Parental Leave',
  },
  'leave.studyLeave': {
    sv: 'Studieledighet',
    en: 'Study Leave',
  },
  'leave.startDate': {
    sv: 'Från datum',
    en: 'Start Date',
  },
  'leave.endDate': {
    sv: 'Till datum',
    en: 'End Date',
  },
  'leave.scope': {
    sv: 'Omfattning',
    en: 'Scope',
  },
  'leave.fullDay': {
    sv: 'Heldag',
    en: 'Full Day',
  },
  'leave.morning': {
    sv: 'Förmiddag',
    en: 'Morning',
  },
  'leave.afternoon': {
    sv: 'Eftermiddag',
    en: 'Afternoon',
  },
  'leave.customTime': {
    sv: 'Anpassad tid',
    en: 'Custom Time',
  },
  'leave.comment': {
    sv: 'Kommentar',
    en: 'Comment',
  },
  'leave.commentPlaceholder': {
    sv: 'Lägg till en kommentar till din ledighetsansökan...',
    en: 'Add a comment to your leave request...',
  },
  
  // Manager view
  'manager.title': {
    sv: 'Chefvy',
    en: 'Manager View',
  },
  'manager.description': {
    sv: 'Hantera avvikelser och ledighetsansökningar',
    en: 'Manage deviations and leave requests',
  },
  'manager.pendingDeviations': {
    sv: 'Avvikelser att godkänna',
    en: 'Deviations to approve',
  },
  'manager.leaveRequests': {
    sv: 'Ledighetsansökningar',
    en: 'Leave Requests',
  },
  'manager.history': {
    sv: 'Historik',
    en: 'History',
  },
  'manager.employee': {
    sv: 'Medarbetare',
    en: 'Employee',
  },
  'manager.deviationDetails': {
    sv: 'Avvikelsedetaljer',
    en: 'Deviation Details',
  },
  'manager.registered': {
    sv: 'Registrerad',
    en: 'Registered',
  },
  
  // Attestation
  'attestation.description': {
    sv: 'Hantera och attestera avvikelser och ledighetsansökningar',
    en: 'Manage and approve deviations and leave requests',
  },
  'attestation.pendingDeviations': {
    sv: 'Väntande avvikelser',
    en: 'Pending Deviations',
  },
  'attestation.pendingLeave': {
    sv: 'Väntande ledighetsansökningar',
    en: 'Pending Leave Requests',
  },
  'attestation.noDeviations': {
    sv: 'Inga avvikelser att attestera',
    en: 'No deviations to approve',
  },
  'attestation.noDeviationsDescription': {
    sv: 'Det finns inga väntande avvikelser som behöver attesteras just nu',
    en: 'There are currently no pending deviations that need approval',
  },
  'attestation.noLeave': {
    sv: 'Inga ledighetsansökningar att attestera',
    en: 'No leave requests to approve',
  },
  'attestation.noLeaveDescription': {
    sv: 'Det finns inga väntande ledighetsansökningar som behöver attesteras just nu',
    en: 'There are currently no pending leave requests that need approval',
  },
  'attestation.notAuthorized': {
    sv: 'Ej behörig',
    en: 'Not Authorized',
  },
  'attestation.managerRoleRequired': {
    sv: 'Du måste vara inloggad som chef för att kunna attestera',
    en: 'You need to be logged in as a manager to access attestation',
  },
  
  // Payslips
  'payslips.title': {
    sv: 'Lönespecifikationer',
    en: 'Payslips',
  },
  'payslips.description': {
    sv: 'Visa och ladda ner dina lönespecifikationer',
    en: 'View and download your payslips',
  },
  'payslips.year': {
    sv: 'År',
    en: 'Year',
  },
  'payslips.month': {
    sv: 'Månad',
    en: 'Month',
  },
  'payslips.download': {
    sv: 'Ladda ner',
    en: 'Download',
  },
  'payslips.noPayslips': {
    sv: 'Inga lönespecifikationer tillgängliga',
    en: 'No payslips available',
  },
  'payslips.published': {
    sv: 'Publicerad',
    en: 'Published',
  },
  
  // Settings
  'settings.title': {
    sv: 'Inställningar',
    en: 'Settings',
  },
  'settings.description': {
    sv: 'Hantera dina personuppgifter och inställningar',
    en: 'Manage your personal information and settings',
  },
  'settings.personalInfo': {
    sv: 'Personuppgifter',
    en: 'Personal Information',
  },
  'settings.contactInfo': {
    sv: 'Kontaktuppgifter',
    en: 'Contact Information',
  },
  'settings.bankInfo': {
    sv: 'Bankuppgifter',
    en: 'Bank Information',
  },
  'settings.language': {
    sv: 'Språk',
    en: 'Language',
  },
  'settings.swedish': {
    sv: 'Svenska',
    en: 'Swedish',
  },
  'settings.english': {
    sv: 'Engelska',
    en: 'English',
  },
  
  // Status messages
  'status.pending': {
    sv: 'Väntande',
    en: 'Pending',
  },
  'status.approved': {
    sv: 'Godkänd',
    en: 'Approved',
  },
  'status.rejected': {
    sv: 'Ej godkänd',
    en: 'Rejected',
  },
  'status.returned': {
    sv: 'Retur',
    en: 'Returned',
  },
  'status.draft': {
    sv: 'Utkast',
    en: 'Draft',
  },
  
  // Time values
  'time.today': {
    sv: 'Idag',
    en: 'Today',
  },
  'time.yesterday': {
    sv: 'Igår',
    en: 'Yesterday',
  },
  
  // Months
  'month.1': {
    sv: 'Januari',
    en: 'January',
  },
  'month.2': {
    sv: 'Februari',
    en: 'February',
  },
  'month.3': {
    sv: 'Mars',
    en: 'March',
  },
  'month.4': {
    sv: 'April',
    en: 'April',
  },
  'month.5': {
    sv: 'Maj',
    en: 'May',
  },
  'month.6': {
    sv: 'Juni',
    en: 'June',
  },
  'month.7': {
    sv: 'Juli',
    en: 'July',
  },
  'month.8': {
    sv: 'Augusti',
    en: 'August',
  },
  'month.9': {
    sv: 'September',
    en: 'September',
  },
  'month.10': {
    sv: 'Oktober',
    en: 'October',
  },
  'month.11': {
    sv: 'November',
    en: 'November',
  },
  'month.12': {
    sv: 'December',
    en: 'December',
  },
  
  // Auth
  'auth.logout': {
    sv: 'Logga ut',
    en: 'Logout',
  },
};

type I18nStore = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'sv',
  setLanguage: (language) => set({ language }),
  t: (key) => {
    const { language } = get();
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  },
}));
