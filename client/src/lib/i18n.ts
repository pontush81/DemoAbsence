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
  'nav.payrollExport': {
    sv: 'Löneexport',
    en: 'Payroll Export',
  },
  'nav.expenses': {
    sv: 'Resa & Utlägg',
    en: 'Travel & Expenses',
  },
  'nav.schedules': {
    sv: 'Scheman',
    en: 'Schedules',
  },
  'nav.paxml': {
    sv: 'PAXML Export',
    en: 'PAXML Export',
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
  'dashboard.compensationTime': {
    sv: 'Komptid',
    en: 'Comp Time',
  },
  'dashboard.noSchedule': {
    sv: 'Inget schema för idag',
    en: 'No schedule for today',
  },
  'hours': {
    sv: 'timmar',
    en: 'hours',
  },
  'days': {
    sv: 'dagar',
    en: 'days',
  },
  'items': {
    sv: 'st',
    en: 'items',
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
  'action.retry': {
    sv: 'Försök igen',
    en: 'Retry',
  },
  'action.return': {
    sv: 'Skicka tillbaka',
    en: 'Return',
  },
  
  // Time codes
  'timecode.100': {
    sv: 'Arbetstid',
    en: 'Working time',
  },
  'timecode.200': {
    sv: 'Övertid 1',
    en: 'Overtime 1',
  },
  'timecode.201': {
    sv: 'Övertid 2',
    en: 'Overtime 2',
  },
  'timecode.300': {
    sv: 'Sjukdom',
    en: 'Sick leave',
  },
  'timecode.301': {
    sv: 'VAB',
    en: 'Care of child',
  },
  'timecode.400': {
    sv: 'Semester',
    en: 'Vacation',
  },
  'timecode.500': {
    sv: 'Kompledighet',
    en: 'Compensatory leave',
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
  'deviations.loadError': {
    sv: 'Kunde inte ladda avvikelser',
    en: 'Failed to load deviations',
  },
  'deviations.deviationDetails': {
    sv: 'Avvikelsedetaljer',
    en: 'Deviation Details',
  },
  'deviations.viewDeviationDescription': {
    sv: 'Visa detaljer för avvikelse',
    en: 'View deviation details',
  },
  'deviations.deleteSuccess': {
    sv: 'Avvikelse borttagen',
    en: 'Deviation deleted',
  },
  'deviations.deleteSuccessDescription': {
    sv: 'Avvikelsen har tagits bort',
    en: 'The deviation has been deleted',
  },
  'deviations.deleteError': {
    sv: 'Kunde inte ta bort avvikelse',
    en: 'Failed to delete deviation',
  },
  'deviations.confirmDelete': {
    sv: 'Är du säker på att du vill ta bort denna avvikelse?',
    en: 'Are you sure you want to delete this deviation?',
  },
  'deviations.notFound': {
    sv: 'Avvikelse hittades inte',
    en: 'Deviation not found',
  },
  'deviations.noDeviations': {
    sv: 'Inga avvikelser',
    en: 'No Deviations',
  },
  'deviations.noDeviationsDescription': {
    sv: 'Du har inga registrerade avvikelser för denna period.',
    en: 'You have no registered deviations for this period.',
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
  'leave.newLeaveRequest': {
    sv: 'Ny ledighetsansökan',
    en: 'New Leave Request',
  },
  'leave.allPeriods': {
    sv: 'Alla perioder',
    en: 'All Periods',
  },
  'leave.upcoming': {
    sv: 'Kommande',
    en: 'Upcoming',
  },
  'leave.past': {
    sv: 'Tidigare',
    en: 'Past',
  },
  'leave.allTypes': {
    sv: 'Alla typer',
    en: 'All Types',
  },
  'leave.period': {
    sv: 'Period',
    en: 'Period',
  },
  'leave.noLeaveRequests': {
    sv: 'Inga ledighetsansökningar',
    en: 'No Leave Requests',
  },
  'leave.noLeaveRequestsDescription': {
    sv: 'Du har inga registrerade ledighetsansökningar ännu.',
    en: 'You have no registered leave requests yet.',
  },
  'leave.loadError': {
    sv: 'Kunde inte läsa in ledighetsansökningar',
    en: 'Failed to load leave requests',
  },
  'leave.submitSuccess': {
    sv: 'Ledighetsansökan skickad',
    en: 'Leave request submitted',
  },
  'leave.submitSuccessDescription': {
    sv: 'Din ledighetsansökan har skickats för godkännande.',
    en: 'Your leave request has been submitted for approval.',
  },
  'leave.draftSaved': {
    sv: 'Utkast sparat',
    en: 'Draft saved',
  },
  'leave.draftSavedDescription': {
    sv: 'Din ledighetsansökan har sparats som utkast.',
    en: 'Your leave request has been saved as draft.',
  },
  'leave.submitError': {
    sv: 'Fel vid inskickning',
    en: 'Submission error',
  },
  'leave.updateSuccess': {
    sv: 'Ledighetsansökan uppdaterad',
    en: 'Leave request updated',
  },
  
  // Pagination
  'pagination.showing': {
    sv: 'Visar',
    en: 'Showing',
  },
  'pagination.to': {
    sv: 'till',
    en: 'to',
  },
  'pagination.of': {
    sv: 'av',
    en: 'of',
  },
  'pagination.results': {
    sv: 'resultat',
    en: 'results',
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
  'manager.comment': {
    sv: 'Kommentar från chef',
    en: 'Manager comment',
  },
  'manager.approveSuccess': {
    sv: 'Avvikelse godkänd',
    en: 'Deviation approved',
  },
  'manager.approveSuccessDescription': {
    sv: 'Avvikelsen har godkänts',
    en: 'The deviation has been approved',
  },
  'manager.approveError': {
    sv: 'Kunde inte godkänna avvikelse',
    en: 'Failed to approve deviation',
  },
  'manager.rejectSuccess': {
    sv: 'Avvikelse avslagen',
    en: 'Deviation rejected',
  },
  'manager.rejectSuccessDescription': {
    sv: 'Avvikelsen har avslagits',
    en: 'The deviation has been rejected',
  },
  'manager.rejectError': {
    sv: 'Kunde inte avslå avvikelse',
    en: 'Failed to reject deviation',
  },
  'manager.returnSuccess': {
    sv: 'Avvikelse skickad tillbaka',
    en: 'Deviation returned',
  },
  'manager.returnSuccessDescription': {
    sv: 'Avvikelsen har skickats tillbaka',
    en: 'The deviation has been returned',
  },
  'manager.returnError': {
    sv: 'Kunde inte skicka tillbaka avvikelse',
    en: 'Failed to return deviation',
  },
  'manager.enterRejectionReason': {
    sv: 'Varför avslås denna avvikelse?',
    en: 'Why is this deviation being rejected?',
  },
  'manager.enterReturnReason': {
    sv: 'Varför skickas denna avvikelse tillbaka?',
    en: 'Why is this deviation being returned?',
  },
  
  // Attestation
  'attestation.description': {
    sv: 'Hantera och attestera tidperioder och ledighetsansökningar',
    en: 'Manage and approve time periods and leave requests',
  },
  'attestation.pendingPeriods': {
    sv: 'Väntande perioder',
    en: 'Pending Periods',
  },
  'attestation.pendingLeave': {
    sv: 'Väntande ledighetsansökningar',
    en: 'Pending Leave Requests',
  },
  'attestation.noPeriods': {
    sv: 'Inga perioder att attestera',
    en: 'No periods to approve',
  },
  'attestation.noPeriodsDescription': {
    sv: 'Det finns inga väntande perioder som behöver attesteras just nu',
    en: 'There are currently no pending periods that need approval',
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
  'attestation.deviations': {
    sv: 'avvikelser',
    en: 'deviations',
  },
  'attestation.submitted': {
    sv: 'Inskickad',
    en: 'Submitted',
  },
  'attestation.viewPeriod': {
    sv: 'Visa period',
    en: 'View Period',
  },
  'attestation.sendReminder': {
    sv: 'Skicka påminnelse',
    en: 'Send Reminder',
  },
  'attestation.periodSummary': {
    sv: 'Periodöversikt',
    en: 'Period Summary',
  },
  'attestation.periodSummaryDescription': {
    sv: 'Översikt över perioden och dess registrerade avvikelser',
    en: 'Overview of the period and its registered deviations',
  },
  'attestation.submittedAt': {
    sv: 'Inskickad',
    en: 'Submitted',
  },
  'attestation.totalDeviations': {
    sv: 'Totalt antal avvikelser',
    en: 'Total deviations',
  },
  'attestation.periodDeviations': {
    sv: 'Avvikelser i perioden',
    en: 'Deviations in period',
  },
  'attestation.returnForCorrection': {
    sv: 'Skicka tillbaka för korrigering',
    en: 'Return for correction',
  },
  'attestation.approvePeriod': {
    sv: 'Godkänn period',
    en: 'Approve period',
  },
  'attestation.sendReminderDescription': {
    sv: 'Skicka en påminnelse till medarbetare om att registrera avvikelser',
    en: 'Send a reminder to employee about registering deviations',
  },
  'attestation.reminderMessage': {
    sv: 'Påminnelsemeddelande',
    en: 'Reminder message',
  },
  'attestation.reminderMessagePlaceholder': {
    sv: 'Skriv ditt påminnelsemeddelande här...',
    en: 'Write your reminder message here...',
  },
  'attestation.reminderSentSuccess': {
    sv: 'Påminnelse skickad!',
    en: 'Reminder sent successfully!',
  },
  'attestation.reminderSentError': {
    sv: 'Kunde inte skicka påminnelse',
    en: 'Failed to send reminder',
  },
  'attestation.returnPeriod': {
    sv: 'Skicka tillbaka period',
    en: 'Return period',
  },
  'attestation.returnPeriodDescription': {
    sv: 'Skicka tillbaka perioden till medarbetaren för korrigering eller komplettering',
    en: 'Return the period to the employee for correction or completion',
  },
  'attestation.returnComment': {
    sv: 'Kommentar till medarbetare',
    en: 'Comment to employee',
  },
  'attestation.returnCommentPlaceholder': {
    sv: 'Beskriv vad som behöver korrigeras eller kompletteras...',
    en: 'Describe what needs to be corrected or completed...',
  },
  'attestation.periodReturnedSuccess': {
    sv: 'Perioden har skickats tillbaka för korrigering',
    en: 'Period has been returned for correction',
  },
  'attestation.periodReturnedError': {
    sv: 'Kunde inte skicka tillbaka perioden',
    en: 'Failed to return the period',
  },
  'attestation.periodApprovedSuccess': {
    sv: 'Perioden har godkänts',
    en: 'Period has been approved',
  },
  'attestation.periodApprovedError': {
    sv: 'Kunde inte godkänna perioden',
    en: 'Failed to approve the period',
  },
  'attestation.rejectLeave': {
    sv: 'Avslå ledighetsansökan',
    en: 'Reject leave request',
  },
  'attestation.rejectLeaveDescription': {
    sv: 'Ange anledning för avslag',
    en: 'Provide reason for rejection',
  },
  'attestation.rejectReason': {
    sv: 'Avslagsanledning',
    en: 'Rejection reason',
  },
  'attestation.rejectReasonPlaceholder': {
    sv: 'Beskriv varför ledighetsansökan avslås...',
    en: 'Describe why the leave request is being rejected...',
  },
  'attestation.pauseLeave': {
    sv: 'Pausa ledighetsansökan',
    en: 'Pause leave request',
  },
  'attestation.pauseLeaveDescription': {
    sv: 'Ange anledning för pausning',
    en: 'Provide reason for pausing',
  },
  'attestation.pauseReason': {
    sv: 'Pausningsanledning',
    en: 'Pause reason',
  },
  'attestation.pauseReasonPlaceholder': {
    sv: 'Beskriv varför ledighetsansökan pausas...',
    en: 'Describe why the leave request is being paused...',
  },
  'attestation.leaveApprovedSuccess': {
    sv: 'Ledighetsansökan har godkänts',
    en: 'Leave request has been approved',
  },
  'attestation.leaveApprovedError': {
    sv: 'Kunde inte godkänna ledighetsansökan',
    en: 'Failed to approve leave request',
  },
  'attestation.leaveRejectedSuccess': {
    sv: 'Ledighetsansökan har avslagits',
    en: 'Leave request has been rejected',
  },
  'attestation.leaveRejectedError': {
    sv: 'Kunde inte avslå ledighetsansökan',
    en: 'Failed to reject leave request',
  },
  'attestation.leavePausedSuccess': {
    sv: 'Ledighetsansökan har pausats',
    en: 'Leave request has been paused',
  },
  'attestation.leavePausedError': {
    sv: 'Kunde inte pausa ledighetsansökan',
    en: 'Failed to pause leave request',
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
  'payslips.yourPayslips': {
    sv: 'Dina lönespecifikationer',
    en: 'Your Payslips',
  },
  'payslips.payslipsDescription': {
    sv: 'Här hittar du dina lönespecifikationer för de senaste månaderna.',
    en: 'Here you can find your payslips for the recent months.',
  },
  'payslips.period': {
    sv: 'Period',
    en: 'Period',
  },
  'payslips.paymentDate': {
    sv: 'Utbetalningsdatum',
    en: 'Payment Date',
  },
  'payslips.amount': {
    sv: 'Belopp',
    en: 'Amount',
  },
  'payslips.status': {
    sv: 'Status',
    en: 'Status',
  },
  'payslips.actions': {
    sv: 'Åtgärder',
    en: 'Actions',
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
  'payslips.view': {
    sv: 'Visa',
    en: 'View',
  },
  'payslips.noPayslips': {
    sv: 'Inga lönespecifikationer tillgängliga',
    en: 'No payslips available',
  },
  'payslips.noPayslipsDescription': {
    sv: 'Du har inte några lönespecifikationer tillgängliga för tillfället.',
    en: 'You don\'t have any payslips available at the moment.',
  },
  'payslips.published': {
    sv: 'Publicerad',
    en: 'Published',
  },
  'payslips.downloadSuccess': {
    sv: 'Nedladdning lyckades',
    en: 'Download successful',
  },
  'payslips.downloadSuccessDescription': {
    sv: 'Din lönespecifikation har laddats ner',
    en: 'Your payslip has been downloaded',
  },
  'payslips.downloadError': {
    sv: 'Nedladdning misslyckades',
    en: 'Download failed',
  },
  'payslips.loadError': {
    sv: 'Kunde inte ladda lönespecifikationer',
    en: 'Failed to load payslips',
  },
  'payslips.status.new': {
    sv: 'Ny',
    en: 'New',
  },
  'payslips.status.viewed': {
    sv: 'Visad',
    en: 'Viewed',
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
  'settings.role': {
    sv: 'Roll',
    en: 'Role',
  },
  'settings.roleSwitch': {
    sv: 'Rollinställningar',
    en: 'Role Settings',
  },
  'settings.roleSwitchDescription': {
    sv: 'Växla mellan medarbetar- och chefroll för att testa olika vyer.',
    en: 'Switch between employee and manager roles to test different views.',
  },
  'settings.currentRole': {
    sv: 'Nuvarande roll',
    en: 'Current Role',
  },
  'settings.selectRole': {
    sv: 'Välj roll',
    en: 'Select role',
  },
  'settings.roleInfo': {
    sv: 'Rollinformation',
    en: 'Role Information',
  },
  'settings.managerInfo': {
    sv: 'Du kan nu godkänna avvikelser och ledighetsansökningar i Chefsvyn.',
    en: 'You can now approve deviations and leave requests in the Manager section.',
  },
  'settings.employeeInfo': {
    sv: 'Du kan skicka in avvikelser och ledighetsansökningar för godkännande.',
    en: 'You can submit deviations and leave requests for approval.',
  },
  'settings.goToManager': {
    sv: 'Gå till Chefsvyn',
    en: 'Go to Manager Area',
  },
  'settings.languageUpdated': {
    sv: 'Språk uppdaterat',
    en: 'Language updated',
  },
  'settings.selectLanguage': {
    sv: 'Välj språk',
    en: 'Select Language',
  },
  'settings.languageDescription': {
    sv: 'Välj vilket språk du vill använda i applikationen.',
    en: 'Choose which language you want to use in the application.',
  },
  'settings.updateSuccess': {
    sv: 'Uppdaterat',
    en: 'Updated',
  },
  'settings.personalInfoUpdated': {
    sv: 'Personuppgifter har uppdaterats',
    en: 'Personal information has been updated',
  },
  'settings.bankInfoUpdated': {
    sv: 'Bankuppgifter har uppdaterats',
    en: 'Bank information has been updated',
  },
  'settings.updateError': {
    sv: 'Uppdateringsfel',
    en: 'Update Error',
  },
  'settings.personnummer': {
    sv: 'Personnummer',
    en: 'Personal number',
  },
  'settings.firstName': {
    sv: 'Förnamn',
    en: 'First name',
  },
  'settings.lastName': {
    sv: 'Efternamn',
    en: 'Last name',
  },
  'settings.careOfAddress': {
    sv: 'C/O adress',
    en: 'Care of address',
  },
  'settings.streetAddress': {
    sv: 'Gatuadress',
    en: 'Street address',
  },
  'settings.postalCode': {
    sv: 'Postnummer',
    en: 'Postal code',
  },
  'settings.city': {
    sv: 'Stad',
    en: 'City',
  },
  'settings.country': {
    sv: 'Land',
    en: 'Country',
  },
  'settings.phoneNumber': {
    sv: 'Telefonnummer',
    en: 'Phone number',
  },
  'settings.personalEmail': {
    sv: 'Personlig e-post',
    en: 'Personal email',
  },
  'settings.workEmail': {
    sv: 'Arbets e-post',
    en: 'Work email',
  },
  'settings.bankClearingNumber': {
    sv: 'Clearingnummer',
    en: 'Clearing number',
  },
  'settings.bankAccountNumber': {
    sv: 'Kontonummer',
    en: 'Account number',
  },
  'settings.bankCountryCode': {
    sv: 'Landskod',
    en: 'Country code',
  },
  'settings.bankBIC': {
    sv: 'BIC/SWIFT-kod',
    en: 'BIC/SWIFT code',
  },
  'settings.bankIBAN': {
    sv: 'IBAN',
    en: 'IBAN',
  },
  
  // Roles
  'roles.employee': {
    sv: 'Anställd',
    en: 'Employee',
  },
  'roles.manager': {
    sv: 'Chef',
    en: 'Manager',
  },
  'roles.employeeActive': {
    sv: 'Anställdroll aktiv',
    en: 'Employee role active',
  },
  'roles.managerActive': {
    sv: 'Chefroll aktiv',
    en: 'Manager role active',
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

  // Error messages and validation
  'validation.dateRequired': {
    sv: 'Datum krävs',
    en: 'Date is required',
  },
  'validation.startTimeRequired': {
    sv: 'Starttid krävs',
    en: 'Start time is required',
  },
  'validation.endTimeRequired': {
    sv: 'Sluttid krävs',
    en: 'End time is required',
  },
  'validation.timeCodeRequired': {
    sv: 'Tidkod krävs',
    en: 'Time code is required',
  },
  'validation.endTimeAfterStartTime': {
    sv: 'Sluttid måste vara efter starttid',
    en: 'End time must be after start time',
  },
  'validation.scopeRequired': {
    sv: 'Omfattning krävs',
    en: 'Scope is required',
  },
  'validation.startDateRequired': {
    sv: 'Startdatum krävs',
    en: 'Start date is required',
  },
  'validation.endDateRequired': {
    sv: 'Slutdatum krävs',
    en: 'End date is required',
  },
  'validation.leaveTypeRequired': {
    sv: 'Ledighetstyp krävs',
    en: 'Leave type is required',
  },
  'validation.endDateAfterStartDate': {
    sv: 'Slutdatum måste vara på eller efter startdatum',
    en: 'End date must be on or after start date',
  },
  'validation.personnummerRequired': {
    sv: 'Personnummer krävs',
    en: 'Personal number required',
  },
  'validation.firstNameRequired': {
    sv: 'Förnamn krävs',
    en: 'First name required',
  },
  'validation.lastNameRequired': {
    sv: 'Efternamn krävs',
    en: 'Last name required',
  },
  'validation.streetAddressRequired': {
    sv: 'Gatuadress krävs',
    en: 'Street address required',
  },
  'validation.postalCodeRequired': {
    sv: 'Giltigt postnummer krävs',
    en: 'Valid postal code required',
  },
  'validation.cityRequired': {
    sv: 'Stad krävs',
    en: 'City required',
  },
  'validation.countryRequired': {
    sv: 'Land krävs',
    en: 'Country required',
  },
  'validation.validEmailRequired': {
    sv: 'Giltig e-post krävs',
    en: 'Valid email required',
  },
  'validation.validWorkEmailRequired': {
    sv: 'Giltig arbets-e-post krävs',
    en: 'Valid work email required',
  },
  'validation.countryCodeRequired': {
    sv: 'Landskod krävs',
    en: 'Country code required',
  },
  'validation.validClearingNumberRequired': {
    sv: 'Giltigt clearingnummer krävs',
    en: 'Valid clearing number required',
  },
  'validation.validAccountNumberRequired': {
    sv: 'Giltigt kontonummer krävs',
    en: 'Valid account number required',
  },
  'validation.invalidTimePeriod': {
    sv: 'Ogiltig tidsperiod',
    en: 'Invalid time period',
  },
  'validation.invalidTime': {
    sv: 'Ogiltig tid',
    en: 'Invalid time',
  },

  // Toast messages
  'toast.languageChangedSwedish': {
    sv: 'Språket har ändrats till Svenska',
    en: 'Language has been changed to Swedish',
  },
  'toast.languageChangedEnglish': {
    sv: 'Språket har ändrats till Engelska',
    en: 'Language has been changed to English',
  },

  // Schedule filters
  'schedules.filterYourSchedules': {
    sv: 'Filtrera dina scheman',
    en: 'Filter your schedules',
  },
  'schedules.filterSchedules': {
    sv: 'Filtrera scheman',
    en: 'Filter schedules',
  },

  // Accessibility labels
  'accessibility.swedishFlag': {
    sv: 'Svensk flagga',
    en: 'Swedish flag',
  },
  'accessibility.englishFlag': {
    sv: 'Engelsk flagga',
    en: 'English flag',
  },
  'accessibility.toggleSidebar': {
    sv: 'Växla sidopanel',
    en: 'Toggle Sidebar',
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
