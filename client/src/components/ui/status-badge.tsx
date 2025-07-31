import { cn } from "@/lib/utils";

type StatusType = 'pending' | 'approved' | 'rejected' | 'returned' | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const statusMap: Record<StatusType, { bg: string; text: string; defaultLabel: string }> = {
    pending: {
      bg: 'bg-[#FFC107] bg-opacity-10',
      text: 'text-[#FFC107]',
      defaultLabel: 'Väntande'
    },
    approved: {
      bg: 'bg-[#4CAF50] bg-opacity-10',
      text: 'text-[#4CAF50]',
      defaultLabel: 'Godkänd'
    },
    rejected: {
      bg: 'bg-[#F44336] bg-opacity-10',
      text: 'text-[#F44336]',
      defaultLabel: 'Ej godkänd'
    },
    returned: {
      bg: 'bg-[#F44336] bg-opacity-10',
      text: 'text-[#F44336]',
      defaultLabel: 'Retur'
    },
    draft: {
      bg: 'bg-gray-300 bg-opacity-20',
      text: 'text-gray-500',
      defaultLabel: 'Utkast'
    }
  };

  const { bg, text, defaultLabel } = statusMap[status];

  return (
    <span 
      className={cn(
        "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
        bg,
        text,
        className
      )}
    >
      {label || defaultLabel}
    </span>
  );
};

export default StatusBadge;
