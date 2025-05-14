import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";
import type { Deviation, LeaveRequest } from "@shared/schema";

export default function AttestationPage() {
  const { t } = useI18n();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"deviations" | "leave">("deviations");

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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "deviations" | "leave")}>
        <TabsList className="mb-4">
          <TabsTrigger value="deviations">{t('attestation.pendingDeviations')}</TabsTrigger>
          <TabsTrigger value="leave">{t('attestation.pendingLeave')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deviations" className="space-y-4">
          <DeviationApprovals />
        </TabsContent>
        
        <TabsContent value="leave" className="space-y-4">
          <LeaveApprovals />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeviationApprovals() {
  const { t } = useI18n();
  
  const { data: pendingDeviations, isLoading, refetch } = useQuery<Deviation[]>({
    queryKey: ['/api/manager/deviations/pending'],
    retry: false,
  });

  const handleApprove = async (id: number) => {
    try {
      await apiRequest('/api/manager/deviations/' + id + '/approve', 'POST');
      refetch();
    } catch (error) {
      console.error("Failed to approve deviation:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest('/api/manager/deviations/' + id + '/reject', 'POST', { comment: "Rejected by manager" });
      refetch();
    } catch (error) {
      console.error("Failed to reject deviation:", error);
    }
  };

  if (isLoading) {
    return <div>Loading pending deviations...</div>;
  }

  if (!pendingDeviations || pendingDeviations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('attestation.noDeviations')}</CardTitle>
          <CardDescription>{t('attestation.noDeviationsDescription')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingDeviations.map((deviation) => (
        <Card key={deviation.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{deviation.employeeId}</CardTitle>
                <CardDescription>
                  {new Date(deviation.date).toLocaleDateString()} • {deviation.startTime} - {deviation.endTime}
                </CardDescription>
              </div>
              <Badge variant="secondary">{deviation.timeCode}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{deviation.comment}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => handleReject(deviation.id)}>
                {t('action.reject')}
              </Button>
              <Button size="sm" onClick={() => handleApprove(deviation.id)}>
                {t('action.approve')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LeaveApprovals() {
  const { t } = useI18n();
  
  const { data: pendingLeaveRequests, isLoading, refetch } = useQuery<LeaveRequest[]>({
    queryKey: ['/api/manager/leave-requests/pending'],
    retry: false,
  });

  const handleApprove = async (id: number) => {
    try {
      await apiRequest('/api/manager/leave-requests/' + id + '/approve', 'POST');
      refetch();
    } catch (error) {
      console.error("Failed to approve leave request:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest('/api/manager/leave-requests/' + id + '/reject', 'POST', { comment: "Rejected by manager" });
      refetch();
    } catch (error) {
      console.error("Failed to reject leave request:", error);
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
      {pendingLeaveRequests.map((leave) => (
        <Card key={leave.id}>
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
              <Button variant="outline" size="sm" onClick={() => handleReject(leave.id)}>
                {t('action.reject')}
              </Button>
              <Button size="sm" onClick={() => handleApprove(leave.id)}>
                {t('action.approve')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}