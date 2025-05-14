import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatusCard from "@/components/dashboard/status-card";
import ActivityItem from "@/components/dashboard/activity-item";
import QuickActionCard from "@/components/dashboard/quick-action-card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiService } from "@/lib/apiService";
import { formatDateWithDay, formatTime, formatDuration } from "@/lib/utils/date";
import { mockActivityLogs } from "@/lib/mockData";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  const currentUser = user.currentUser;
  const isManager = user.currentRole === 'manager';
  
  // Get current date and format it
  const currentDate = new Date();
  const formattedDate = formatDateWithDay(currentDate);
  
  // Fetch schedule
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['/api/schedules', employeeId, currentDate.toISOString().split('T')[0]],
    queryFn: () => employeeId
      ? apiService.getEmployeeSchedule(employeeId, currentDate.toISOString().split('T')[0])
      : Promise.resolve([]),
    enabled: !!employeeId,
  });
  
  // Fetch time balance
  const { data: timeBalance, isLoading: isLoadingTimeBalance } = useQuery({
    queryKey: ['/api/time-balances', employeeId],
    queryFn: () => employeeId
      ? apiService.getTimeBalance(employeeId)
      : Promise.resolve(null),
    enabled: !!employeeId,
  });
  
  // Fetch pending approvals (for manager)
  const { data: pendingDeviations, isLoading: isLoadingPendingDeviations } = useQuery({
    queryKey: ['/api/manager/deviations/pending'],
    queryFn: () => apiService.getPendingDeviations(),
    enabled: isManager,
  });
  
  // Get today's schedule
  const todaySchedule = schedule && schedule.length > 0 ? schedule[0] : null;
  
  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t('dashboard.greeting')}, {currentUser?.firstName || ''}!
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/deviations/new">
            <Button className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded font-medium shadow-sm transition-colors">
              <span className="material-icons mr-2">add</span>
              {t('action.newDeviation')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Work Schedule Card */}
        <StatusCard
          title={t('dashboard.workSchedule')}
          value={
            isLoadingSchedule ? (
              <Skeleton className="h-6 w-36" />
            ) : todaySchedule ? (
              `${formatTime(todaySchedule.startTime)} - ${formatTime(todaySchedule.endTime)}`
            ) : (
              t('dashboard.noSchedule')
            )
          }
          icon="schedule"
          footer={
            isLoadingSchedule ? (
              <Skeleton className="h-4 w-32" />
            ) : todaySchedule?.breakStart && todaySchedule?.breakEnd ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.break')}: {formatTime(todaySchedule.breakStart)} - {formatTime(todaySchedule.breakEnd)}
              </p>
            ) : null
          }
        />

        {/* Time Balance Card */}
        <StatusCard
          title={t('dashboard.timeBalance')}
          value={
            isLoadingTimeBalance ? (
              <Skeleton className="h-6 w-24" />
            ) : timeBalance ? (
              formatDuration(timeBalance.timeBalance)
            ) : (
              "0"
            )
          }
          icon="hourglass_top"
          footer={
            isLoadingTimeBalance ? (
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.lastMonth')}:</span>
                <span>+2.5 {t('hours')}</span>
              </div>
            )
          }
        />

        {/* Vacation Balance Card */}
        <StatusCard
          title={t('dashboard.vacationBalance')}
          value={
            isLoadingTimeBalance ? (
              <Skeleton className="h-6 w-24" />
            ) : timeBalance ? (
              `${timeBalance.vacationDays} ${t('days')}`
            ) : (
              "0 " + t('days')
            )
          }
          icon="beach_access"
          footer={
            isLoadingTimeBalance ? (
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ) : timeBalance?.savedVacationDays ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('dashboard.savedDays')}:</span>
                <span>
                  {Object.values(timeBalance.savedVacationDays).reduce((a, b) => a + (b as number), 0)} {t('days')}
                </span>
              </div>
            ) : null
          }
        />

        {/* Pending Approvals Card (only for managers) */}
        {isManager && (
          <StatusCard
            title={t('dashboard.pendingApprovals')}
            value={
              isLoadingPendingDeviations ? (
                <Skeleton className="h-6 w-24" />
              ) : pendingDeviations ? (
                `${pendingDeviations.length} ${t('items')}`
              ) : (
                "0 " + t('items')
              )
            }
            icon="pending_actions"
            className="bg-[#FFC107] bg-opacity-5"
            footer={
              <Link href="/manager">
                <a className="text-sm text-primary flex items-center">
                  {t('dashboard.viewAll')}
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </a>
              </Link>
            }
          />
        )}
      </div>

      {/* Recent Activity Section */}
      <h2 className="text-xl font-bold mb-4">{t('dashboard.recentActivity')}</h2>
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <ul className="divide-y divide-gray-200">
          {mockActivityLogs.slice(0, 3).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
        <CardContent className="px-4 py-3 bg-background-dark">
          <Link href="#">
            <a className="text-sm text-primary font-medium flex items-center justify-center">
              {t('dashboard.viewAllActivities')}
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </a>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions Section */}
      <h2 className="text-xl font-bold mt-8 mb-4">{t('dashboard.quickActions')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          icon="event_note"
          label={t('dashboard.registerDeviation')}
          href="/deviations/new"
        />
        <QuickActionCard
          icon="free_cancellation"
          label={t('dashboard.applyLeave')}
          href="/leave/new"
        />
        <QuickActionCard
          icon="receipt"
          label={t('dashboard.viewPayslip')}
          href="/payslips"
        />
        <QuickActionCard
          icon="person"
          label={t('dashboard.personalInfo')}
          href="/settings"
        />
      </div>
    </section>
  );
}
