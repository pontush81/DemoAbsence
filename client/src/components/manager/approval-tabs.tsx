import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ApprovalsList from "./approvals-list";

const ApprovalTabs = () => {
  const { t } = useI18n();
  
  return (
    <div className="space-y-8">
      {/* Pending Deviations Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {t('manager.pendingDeviations')}
            </CardTitle>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <span className="material-icons text-sm mr-1">pending_actions</span>
              Behöver godkännande
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Avvikelser som medarbetare skickat in och väntar på ditt godkännande
          </p>
        </CardHeader>
        <CardContent>
          <ApprovalsList type="deviations" />
        </CardContent>
      </Card>

      {/* Pending Leave Requests Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {t('manager.leaveRequests')}
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <span className="material-icons text-sm mr-1">event_available</span>
              Väntar på svar
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Ledighets- och semesteransökningar från dina medarbetare
          </p>
        </CardHeader>
        <CardContent>
          <ApprovalsList type="leaveRequests" />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* History Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {t('manager.history')}
            </CardTitle>
            <Badge variant="outline" className="text-gray-600">
              <span className="material-icons text-sm mr-1">history</span>
              Tidigare hanterade
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tidigare godkända och avvisade ansökningar
          </p>
        </CardHeader>
        <CardContent>
          <ApprovalsList type="history" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalTabs;
