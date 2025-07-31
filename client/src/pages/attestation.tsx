import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";
import type { Deviation, LeaveRequest, Employee } from "@shared/schema";
import { CalendarIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, SendIcon } from "lucide-react";

type Period = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  submittedAt: string;
  deviationsCount: number;
};

type PeriodWithDeviations = Period & {
  deviations: Deviation[];
};

export default function AttestationPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"periods" | "leave">("periods");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodWithDeviations | null>(null);
  const [returnComment, setReturnComment] = useState("");
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  // Redirect if user is not a manager
  if (user.currentRole !== 'manager') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('nav.attestation')}</CardTitle>
            <CardDescription>{t('attestation.notAuthorized')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('attestation.managerRoleRequired')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">{t('nav.attestation')}</h1>
        <p className="text-muted-foreground mt-1">{t('attestation.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "periods" | "leave")}>
        <TabsList className="mb-4">
          <TabsTrigger value="periods">{t('attestation.pendingPeriods')}</TabsTrigger>
          <TabsTrigger value="leave">{t('attestation.pendingLeave')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="periods" className="space-y-4">
          {selectedPeriod ? (
            <PeriodDetails 
              period={selectedPeriod} 
              onBack={() => setSelectedPeriod(null)} 
              onReturn={() => setShowReturnDialog(true)}
            />
          ) : (
            <PeriodApprovals 
              onViewPeriod={setSelectedPeriod} 
              onSendReminder={(employeeId) => {
                setSelectedEmployee(employeeId);
                setShowReminderDialog(true);
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="leave" className="space-y-4">
          <LeaveApprovals />
        </TabsContent>
      </Tabs>

      {/* Return Period Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('attestation.returnPeriod')}</DialogTitle>
            <DialogDescription>
              {t('attestation.returnPeriodDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="returnComment">{t('attestation.returnComment')}</Label>
            <Textarea
              id="returnComment"
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              placeholder={t('attestation.returnCommentPlaceholder')}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReturnDialog(false)}
            >
              {t('action.cancel')}
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedPeriod) return;
                
                try {
                  await apiRequest(`/api/manager/periods/${selectedPeriod.id}/return`, 'POST', {
                    comment: returnComment
                  });
                  toast({
                    description: t('attestation.periodReturnedSuccess'),
                  });
                  setShowReturnDialog(false);
                  setSelectedPeriod(null);
                  setReturnComment("");
                } catch (error) {
                  console.error("Failed to return period:", error);
                  toast({
                    variant: "destructive",
                    description: t('attestation.periodReturnedError'),
                  });
                }
              }}
            >
              {t('attestation.returnPeriod')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('attestation.sendReminder')}</DialogTitle>
            <DialogDescription>
              {t('attestation.sendReminderDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reminderMessage">{t('attestation.reminderMessage')}</Label>
            <Textarea
              id="reminderMessage"
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder={t('attestation.reminderMessagePlaceholder')}
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowReminderDialog(false)}
            >
              {t('action.cancel')}
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedEmployee) return;
                
                try {
                  await apiRequest(`/api/manager/employees/${selectedEmployee}/remind`, 'POST', {
                    message: reminderMessage
                  });
                  toast({
                    description: t('attestation.reminderSentSuccess'),
                  });
                  setShowReminderDialog(false);
                  setSelectedEmployee(null);
                  setReminderMessage("");
                } catch (error) {
                  console.error("Failed to send reminder:", error);
                  toast({
                    variant: "destructive",
                    description: t('attestation.reminderSentError'),
                  });
                }
              }}
            >
              {t('attestation.sendReminder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PeriodApprovals({ onViewPeriod, onSendReminder }: { 
  onViewPeriod: (period: PeriodWithDeviations) => void,
  onSendReminder: (employeeId: string) => void 
}) {
  const { t } = useI18n();
  
  // Mock data for now - will be replaced with real API call
  const mockPeriods: Period[] = [
    {
      id: "1",
      employeeId: "E001",
      employeeName: "Anna Andersson",
      month: 4, // May
      year: 2023,
      status: 'pending',
      submittedAt: "2023-05-31T15:30:00Z",
      deviationsCount: 5,
    },
    {
      id: "2",
      employeeId: "E002",
      employeeName: "Björn Bengtsson",
      month: 4, // May
      year: 2023,
      status: 'pending',
      submittedAt: "2023-05-30T11:45:00Z",
      deviationsCount: 2,
    }
  ];
  
  const { data: pendingPeriods, isLoading } = useQuery<Period[]>({
    queryKey: ['/api/manager/periods/pending'],
    // Will fetch from real API once it's implemented
    initialData: mockPeriods,
    retry: false,
  });

  const handleViewPeriod = async (period: Period) => {
    // Fetch period details including all deviations
    try {
      // This would normally be fetched from API
      const mockDeviations: Deviation[] = [
        {
          id: 1,
          employeeId: period.employeeId,
          date: `2023-${period.month + 1}-15`,
          startTime: "08:00",
          endTime: "16:30",
          timeCode: "OT1",
          status: "pending",
          comment: "Worked late to finish project",
          lastUpdated: new Date(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          managerComment: null
        },
        {
          id: 2,
          employeeId: period.employeeId,
          date: `2023-${period.month + 1}-22`,
          startTime: "07:30",
          endTime: "18:00",
          timeCode: "OT2",
          status: "pending",
          comment: "Client meeting ran late",
          lastUpdated: new Date(),
          approvedBy: null,
          approvedAt: null,
          rejectedBy: null,
          rejectedAt: null,
          managerComment: null
        }
      ];
      
      const periodWithDeviations: PeriodWithDeviations = {
        ...period,
        deviations: mockDeviations
      };
      
      onViewPeriod(periodWithDeviations);
    } catch (error) {
      console.error("Failed to fetch period details:", error);
    }
  };

  if (isLoading) {
    return <div>Loading pending periods...</div>;
  }

  if (!pendingPeriods || pendingPeriods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('attestation.noPeriods')}</CardTitle>
          <CardDescription>{t('attestation.noPeriodsDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="space-y-4">
      {pendingPeriods.map((period) => (
        <Card key={period.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{period.employeeName}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {getMonthName(period.month)} {period.year}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {period.deviationsCount} {t('attestation.deviations')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{t('attestation.submitted')}:</span> {new Date(period.submittedAt).toLocaleDateString()}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSendReminder(period.employeeId)}
            >
              <SendIcon className="h-4 w-4 mr-2" />
              {t('attestation.sendReminder')}
            </Button>
            <Button 
              size="sm"
              onClick={() => handleViewPeriod(period)}
            >
              {t('attestation.viewPeriod')}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PeriodDetails({ period, onBack, onReturn }: {
  period: PeriodWithDeviations,
  onBack: () => void,
  onReturn: () => void
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const getMonthName = (month: number) => {
    const date = new Date(2000, month, 1);
    return date.toLocaleString('default', { month: 'long' });
  };
  
  const handleApprovePeriod = async () => {
    try {
      await apiRequest(`/api/manager/periods/${period.id}/approve`, 'POST');
      toast({
        description: t('attestation.periodApprovedSuccess'),
      });
      onBack();
    } catch (error) {
      console.error("Failed to approve period:", error);
      toast({
        variant: "destructive",
        description: t('attestation.periodApprovedError'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="flex items-center gap-1 p-0 h-auto"
          onClick={onBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('action.back')}
        </Button>
        <h2 className="text-xl font-semibold">
          {period.employeeName} - {getMonthName(period.month)} {period.year}
        </h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('attestation.periodSummary')}</CardTitle>
          <CardDescription>
            {t('attestation.periodSummaryDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('attestation.submittedAt')}</p>
              <p>{new Date(period.submittedAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('attestation.totalDeviations')}</p>
              <p>{period.deviationsCount}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={onReturn}
          >
            {t('attestation.returnForCorrection')}
          </Button>
          <Button 
            onClick={handleApprovePeriod}
          >
            {t('attestation.approvePeriod')}
          </Button>
        </CardFooter>
      </Card>
      
      <h3 className="text-lg font-semibold mt-6 mb-2">{t('attestation.periodDeviations')}</h3>
      <div className="space-y-4">
        {period.deviations.map((deviation) => (
          <Card key={deviation.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {new Date(deviation.date).toLocaleDateString()}
                  </CardTitle>
                  <CardDescription>
                    {deviation.startTime} - {deviation.endTime}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{deviation.timeCode}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <p className="text-sm text-muted-foreground">{deviation.comment}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function LeaveApprovals() {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const { data: pendingLeaveRequests, isLoading, refetch } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/manager/leave-requests/pending'],
    retry: false,
  });

  const handleApprove = async (id: number) => {
    try {
      await apiRequest('/api/manager/leave-requests/' + id + '/approve', 'POST');
      toast({
        description: t('attestation.leaveApprovedSuccess'),
      });
      refetch();
    } catch (error) {
      console.error("Failed to approve leave request:", error);
      toast({
        variant: "destructive",
        description: t('attestation.leaveApprovedError'),
      });
    }
  };

  const handleReject = async (id: number, comment: string) => {
    try {
      await apiRequest('/api/manager/leave-requests/' + id + '/reject', 'POST', { comment });
      toast({
        description: t('attestation.leaveRejectedSuccess'),
      });
      refetch();
    } catch (error) {
      console.error("Failed to reject leave request:", error);
      toast({
        variant: "destructive",
        description: t('attestation.leaveRejectedError'),
      });
    }
  };

  const handlePause = async (id: number, comment: string) => {
    try {
      await apiRequest('/api/manager/leave-requests/' + id + '/pause', 'POST', { comment });
      toast({
        description: t('attestation.leavePausedSuccess'),
      });
      refetch();
    } catch (error) {
      console.error("Failed to pause leave request:", error);
      toast({
        variant: "destructive",
        description: t('attestation.leavePausedError'),
      });
    }
  };

  if (isLoading) {
    return <div>Loading pending leave requests...</div>;
  }

  if (!pendingLeaveRequests || pendingLeaveRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('attestation.noLeave')}</CardTitle>
          <CardDescription>{t('attestation.noLeaveDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingLeaveRequests?.map((leave) => (
        <LeaveRequestCard 
          key={leave.id}
          leave={leave}
          onApprove={handleApprove}
          onReject={handleReject}
          onPause={handlePause}
        />
      ))}
    </div>
  );
}

function LeaveRequestCard({ leave, onApprove, onReject, onPause }: {
  leave: LeaveRequest,
  onApprove: (id: number) => void,
  onReject: (id: number, comment: string) => void,
  onPause: (id: number, comment: string) => void
}) {
  const { t } = useI18n();
  const [rejectReason, setRejectReason] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{leave.employeeId}</CardTitle>
            <CardDescription>
              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant="secondary">{leave.leaveType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{leave.comment}</p>
        </div>
        <div className="flex gap-2 justify-end">
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <XCircleIcon className="h-4 w-4 mr-2" />
                {t('action.reject')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('attestation.rejectLeave')}</DialogTitle>
                <DialogDescription>{t('attestation.rejectLeaveDescription')}</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="rejectReason">{t('attestation.rejectReason')}</Label>
                <Textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('attestation.rejectReasonPlaceholder')}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                  {t('action.cancel')}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (rejectReason.trim()) {
                      onReject(leave.id, rejectReason);
                      setShowRejectDialog(false);
                      setRejectReason("");
                    }
                  }}
                >
                  {t('action.reject')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <AlertCircleIcon className="h-4 w-4 mr-2" />
                {t('action.pause')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('attestation.pauseLeave')}</DialogTitle>
                <DialogDescription>{t('attestation.pauseLeaveDescription')}</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="pauseReason">{t('attestation.pauseReason')}</Label>
                <Textarea
                  id="pauseReason"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder={t('attestation.pauseReasonPlaceholder')}
                  className="mt-2"
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
                  {t('action.cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    if (pauseReason.trim()) {
                      onPause(leave.id, pauseReason);
                      setShowPauseDialog(false);
                      setPauseReason("");
                    }
                  }}
                >
                  {t('action.pause')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" onClick={() => onApprove(leave.id)}>
            <CheckCircleIcon className="h-4 w-4 mr-2" />
            {t('action.approve')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}