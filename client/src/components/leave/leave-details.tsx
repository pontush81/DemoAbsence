import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatusBadge from "@/components/ui/status-badge";
import { apiService } from "@/lib/apiService";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";

interface LeaveDetailsProps {
  leaveId: number;
  onBack: () => void;
}

const LeaveDetails = ({ leaveId, onBack }: LeaveDetailsProps) => {
  const { t } = useI18n();
  const { user } = useStore();

  // Fetch leave request details
  const { data: leaveRequest, isLoading, error } = useQuery({
    queryKey: ['/api/leave-requests', leaveId],
    queryFn: () => apiService.getLeaveRequest(leaveId),
    enabled: !!leaveId,
  });

  // Fetch employee info to show names instead of IDs
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiService.getAllEmployees(user.currentUser?.employeeId),
  });

  // Helper function to get employee name
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e: any) => 
      (e.employeeId === employeeId) || (e.employee_id === employeeId)
    );
    const firstName = (employee as any)?.firstName || (employee as any)?.first_name;
    const lastName = (employee as any)?.lastName || (employee as any)?.last_name;
    return firstName && lastName 
      ? `${firstName} ${lastName}` 
      : employeeId;
  };

  // Function to get translated leave type
  const getLeaveTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'vacation': t('leave.vacation'),
      'comp-leave': t('leave.compLeave'),
      'unpaid-leave': t('leave.unpaidLeave'),
      'parental-leave': t('leave.parentalLeave'),
      'study-leave': t('leave.studyLeave')
    };
    return typeMap[type] || type;
  };

  // Function to get smart duration label instead of just "Heldag"
  const getDurationLabel = (leaveRequest: LeaveRequest) => {
    const scope = leaveRequest.scope || 'full-day';
    
    // For non-full-day leaves, show the traditional scope
    if (scope !== 'full-day') {
      const scopeMap: Record<string, string> = {
        'morning': t('leave.morning'),
        'afternoon': t('leave.afternoon'),
        'custom': t('leave.customTime')
      };
      return scopeMap[scope] || scope;
    }
    
    // For full-day leaves, calculate and show duration intelligently
    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end day
    
    if (daysDiff === 1) {
      return '1 dag';
    } else if (daysDiff === 5) {
      return '1 vecka (5 dagar)';
    } else if (daysDiff === 10) {
      return '2 veckor (10 dagar)';
    } else if (daysDiff === 15) {
      return '3 veckor (15 dagar)';
    } else if (daysDiff === 20) {
      return '4 veckor (20 dagar)';
    } else if (daysDiff === 25) {
      return '5 veckor (25 dagar)';
    } else if (daysDiff > 20) {
      const weeks = Math.floor(daysDiff / 5);
      return `${weeks} veckor (${daysDiff} dagar)`;
    } else {
      return `${daysDiff} dagar`;
    }
  };

  // Helper function to format dates safely
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return '-';
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('sv-SE');
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !leaveRequest) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Ett fel uppstod när ledighetsdetaljerna skulle hämtas.
            </AlertDescription>
          </Alert>
          <Button onClick={onBack} className="mt-4">
            {t('action.back')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('leave.leaveDetails')}</span>
            <StatusBadge status={leaveRequest.status as any} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('leave.period')}
              </label>
              <p className="text-lg font-semibold">
                {leaveRequest.startDate === leaveRequest.endDate 
                  ? formatDate(leaveRequest.startDate)
                  : `${formatDate(leaveRequest.startDate)} - ${formatDate(leaveRequest.endDate)}`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('leave.leaveType')}
              </label>
              <p className="text-lg font-semibold">
                {getLeaveTypeLabel(leaveRequest.leaveType)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('leave.scope')}
              </label>
              <p className="text-lg font-semibold">
                {getDurationLabel(leaveRequest)}
              </p>
            </div>

            {leaveRequest.scope === 'custom' && leaveRequest.customStartTime && leaveRequest.customEndTime && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Anpassad tid
                </label>
                <p className="text-lg font-semibold">
                  {leaveRequest.customStartTime} - {leaveRequest.customEndTime}
                </p>
              </div>
            )}
          </div>

          {/* Comment from employee */}
          {leaveRequest.comment && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                {t('leave.comment')}
              </label>
              <p className="bg-gray-50 p-3 rounded-lg">
                {leaveRequest.comment}
              </p>
            </div>
          )}

          {/* Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaveRequest.submitted && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t('leave.submittedAt')}
                </label>
                <p className="font-semibold">
                  {formatTimestamp(leaveRequest.submitted)}
                </p>
              </div>
            )}

            {leaveRequest.approvedBy && leaveRequest.approvedAt && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('leave.approvedBy')}
                  </label>
                  <p className="font-semibold text-green-700">
                    {getEmployeeName(leaveRequest.approvedBy)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('leave.decisionDate')}
                  </label>
                  <p className="font-semibold">
                    {formatTimestamp(leaveRequest.approvedAt)}
                  </p>
                </div>
              </>
            )}

            {leaveRequest.rejectedBy && leaveRequest.rejectedAt && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('leave.rejectedBy')}
                  </label>
                  <p className="font-semibold text-red-700">
                    {getEmployeeName(leaveRequest.rejectedBy)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {t('leave.decisionDate')}
                  </label>
                  <p className="font-semibold">
                    {formatTimestamp(leaveRequest.rejectedAt)}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Manager Comment (Rejection Reason) - Most Important! */}
          {leaveRequest.managerComment && (
            <Alert className={leaveRequest.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-sm">
                    {leaveRequest.status === 'rejected' ? t('leave.rejectionReason') : 'Kommentar från chef:'}
                  </div>
                  <div className="text-sm leading-relaxed">
                    {leaveRequest.managerComment}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button onClick={onBack} variant="outline">
          <span className="material-icons mr-2 text-lg">arrow_back</span>
          {t('action.back')}
        </Button>
      </div>
    </div>
  );
};

export default LeaveDetails;