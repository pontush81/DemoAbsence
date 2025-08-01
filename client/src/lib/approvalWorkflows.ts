import type { TimeCode } from '@shared/schema';

export type ApprovalType = 'pre_approval' | 'post_approval' | 'attestation' | 'flexible';

export interface WorkflowInfo {
  type: ApprovalType;
  title: string;
  description: string;
  canCreateInAdvance: boolean;
  canCreateRetroactively: boolean;
  requiresManagerApproval: boolean;
  icon: string;
  color: string;
}

/**
 * Get workflow information based on time code
 */
export function getWorkflowInfo(timeCode: TimeCode): WorkflowInfo {
  const approvalType = timeCode.approvalType as ApprovalType || 'attestation';
  
  switch (approvalType) {
    case 'pre_approval':
      return {
        type: 'pre_approval',
        title: 'Förhandsgodkännande',
        description: 'Måste ansökas och godkännas innan ledigheten tas',
        canCreateInAdvance: true,
        canCreateRetroactively: false,
        requiresManagerApproval: true,
        icon: 'event_available',
        color: 'bg-blue-100 text-blue-800'
      };
      
    case 'post_approval':
      return {
        type: 'post_approval',
        title: 'Efterhandsgodkännande',
        description: 'Kan registreras i efterhand men måste godkännas innan månadsstäng',
        canCreateInAdvance: true,
        canCreateRetroactively: true,
        requiresManagerApproval: true,
        icon: 'schedule',
        color: 'bg-orange-100 text-orange-800'
      };
      
    case 'attestation':
      return {
        type: 'attestation',
        title: 'Attestering',
        description: 'Registreras i efterhand och attesteras av chef',
        canCreateInAdvance: false,
        canCreateRetroactively: true,
        requiresManagerApproval: true,
        icon: 'fact_check',
        color: 'bg-green-100 text-green-800'
      };
      
    case 'flexible':
      return {
        type: 'flexible',
        title: 'Flexibel hantering',
        description: 'Kan hanteras både innan och efter beroende på situation',
        canCreateInAdvance: true,
        canCreateRetroactively: true,
        requiresManagerApproval: true,
        icon: 'swap_horiz',
        color: 'bg-purple-100 text-purple-800'
      };
      
    default:
      return {
        type: 'attestation',
        title: 'Standard attestering',
        description: 'Standard process för attestering',
        canCreateInAdvance: false,
        canCreateRetroactively: true,
        requiresManagerApproval: true,
        icon: 'task_alt',
        color: 'bg-gray-100 text-gray-800'
      };
  }
}

/**
 * Check if a time code allows retroactive creation
 */
export function canCreateRetroactively(timeCode: TimeCode): boolean {
  const workflow = getWorkflowInfo(timeCode);
  return workflow.canCreateRetroactively;
}

/**
 * Check if a time code allows advance creation
 */
export function canCreateInAdvance(timeCode: TimeCode): boolean {
  const workflow = getWorkflowInfo(timeCode);
  return workflow.canCreateInAdvance;
}

/**
 * Get user-friendly text for manager actions based on workflow type
 */
export function getManagerActionText(approvalType: ApprovalType): {
  approveText: string;
  rejectText: string;
  tabTitle: string;
} {
  switch (approvalType) {
    case 'pre_approval':
      return {
        approveText: 'Godkänn ansökan',
        rejectText: 'Avslå ansökan',
        tabTitle: 'Ansökningar att godkänna'
      };
      
    case 'post_approval':
      return {
        approveText: 'Godkänn i efterhand',
        rejectText: 'Avslå registrering',
        tabTitle: 'Ledighet att godkänna'
      };
      
    case 'attestation':
      return {
        approveText: 'Attestera',
        rejectText: 'Returnera för korrigering',
        tabTitle: 'Frånvaro att attestera'
      };
      
    case 'flexible':
      return {
        approveText: 'Godkänn',
        rejectText: 'Avslå',
        tabTitle: 'Att hantera'
      };
      
    default:
      return {
        approveText: 'Godkänn',
        rejectText: 'Avslå',
        tabTitle: 'Att granska'
      };
  }
}

/**
 * Get status text for different workflow types
 */
export function getStatusText(status: string, approvalType: ApprovalType): string {
  if (status === 'pending') {
    switch (approvalType) {
      case 'pre_approval':
        return 'Väntar på godkännande';
      case 'post_approval':
        return 'Väntar på efterhandsgodkännande';
      case 'attestation':
        return 'Väntar på attestering';
      case 'flexible':
        return 'Väntar på hantering';
      default:
        return 'Väntar på granskning';
    }
  }
  
  // Standard status text för andra statusar
  switch (status) {
    case 'approved':
      return 'Godkänd';
    case 'rejected':
      return 'Avvisad';
    case 'draft':
      return 'Utkast';
    case 'returned':
      return 'Returnerad';
    default:
      return status;
  }
}