import { ActivityLog } from "@shared/schema";
import { formatRelativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: ActivityLog;
}

const ActivityItem = ({ activity }: ActivityItemProps) => {
  // Determine icon and color based on activity type and action
  const getIconInfo = () => {
    switch (activity.action) {
      case 'approved':
        return { 
          icon: 'done', 
          bgColor: 'bg-primary bg-opacity-10', 
          textColor: 'text-primary' 
        };
      case 'rejected':
        return { 
          icon: 'close', 
          bgColor: 'bg-[#F44336] bg-opacity-10', 
          textColor: 'text-[#F44336]'
        };
      case 'returned':
        return { 
          icon: 'info', 
          bgColor: 'bg-[#F44336] bg-opacity-10', 
          textColor: 'text-[#F44336]'
        };
      case 'created':
        return { 
          icon: 'add_circle', 
          bgColor: 'bg-[#2196F3] bg-opacity-10', 
          textColor: 'text-[#2196F3]'
        };
      case 'pending':
      case 'pending_approval':
        return { 
          icon: 'pending_actions', 
          bgColor: 'bg-[#FFC107] bg-opacity-10', 
          textColor: 'text-[#FFC107]'
        };
      case 'published':
        return { 
          icon: 'file_download', 
          bgColor: 'bg-[#673AB7] bg-opacity-10', 
          textColor: 'text-[#673AB7]'
        };
      case 'processed':
        return { 
          icon: 'task_alt', 
          bgColor: 'bg-primary bg-opacity-10', 
          textColor: 'text-primary'
        };
      case 'escalated':
        return { 
          icon: 'priority_high', 
          bgColor: 'bg-[#F44336] bg-opacity-10', 
          textColor: 'text-[#F44336]'
        };
      case 'exported':
        return { 
          icon: 'upload', 
          bgColor: 'bg-[#FF9800] bg-opacity-10', 
          textColor: 'text-[#FF9800]'
        };
      case 'onboarded':
        return { 
          icon: 'person_add', 
          bgColor: 'bg-primary bg-opacity-10', 
          textColor: 'text-primary'
        };
      case 'policy_updated':
        return { 
          icon: 'policy', 
          bgColor: 'bg-[#673AB7] bg-opacity-10', 
          textColor: 'text-[#673AB7]'
        };
      default:
        return { 
          icon: 'info', 
          bgColor: 'bg-primary bg-opacity-10', 
          textColor: 'text-primary'
        };
    }
  };

  // Get title based on activity type and action
  const getTitle = () => {
    switch (activity.type) {
      case 'deviation':
        switch (activity.action) {
          case 'approved': return 'Övertid godkänd';
          case 'rejected': return 'Avvikelse avslagen';
          case 'returned': return 'Avvikelse korrigering krävs';
          case 'created': return 'Avvikelse registrerad';
          case 'pending_approval': return 'Väntande godkännanden';
          case 'processed': return 'Avvikelser behandlade';
          case 'escalated': return 'Avvikelse eskalerad';
          default: return 'Avvikelse uppdaterad';
        }
      case 'leave':
        switch (activity.action) {
          case 'approved': return 'Ledighet godkänd';
          case 'rejected': return 'Ledighet avslagen';
          case 'created': return 'Ledighetsansökan skickad';
          case 'policy_updated': return 'Policy uppdaterad';
          default: return 'Ledighetsansökan uppdaterad';
        }
      case 'payslip':
        switch (activity.action) {
          case 'published': return 'Lönespecar publicerade';
          default: return 'Lönespecifikation tillgänglig';
        }
      case 'payroll':
        switch (activity.action) {
          case 'exported': return 'PAXML-export slutförd';
          default: return 'Lönebearbetning';
        }
      case 'employee':
        switch (activity.action) {
          case 'onboarded': return 'Ny medarbetare';
          default: return 'Personalförändring';
        }
      default:
        return 'Aktivitet';
    }
  };

  const { icon, bgColor, textColor } = getIconInfo();
  const title = getTitle();
  const timestamp = formatRelativeTime(activity.timestamp);

  return (
    <li className="p-4 hover:bg-background-dark transition-colors">
      <div className="flex items-center">
        <div className={cn("flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center", bgColor)}>
          <span className={cn("material-icons", textColor)}>{icon}</span>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{timestamp}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate-text">{activity.description}</p>
        </div>
      </div>
    </li>
  );
};

export default ActivityItem;
