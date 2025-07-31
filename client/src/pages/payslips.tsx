import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileTextIcon, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { apiService } from "@/lib/apiService";
import PayslipList from "@/components/payslips/payslip-list";

export default function Payslips() {
  const { t } = useI18n();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId;
  
  // Fetch payslips
  const { data: payslips, isLoading, error } = useQuery({
    queryKey: ['/api/payslips', employeeId],
    queryFn: () => employeeId 
      ? apiService.getPayslips(employeeId)
      : Promise.resolve([]),
    enabled: !!employeeId,
  });
  
  return (
    <section className="container py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">{t('payslips.title')}</h1>
      
      {isLoading ? (
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>{t('payslips.loadError')}</CardTitle>
            </div>
            <CardDescription>{(error as Error).message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
            >
              {t('action.retry')}
            </Button>
          </CardContent>
        </Card>
      ) : payslips && payslips.length > 0 ? (
        <PayslipList payslips={payslips} />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-6 w-6" />
              <CardTitle>{t('payslips.yourPayslips')}</CardTitle>
            </div>
            <CardDescription>{t('payslips.payslipsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <FileTextIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-1">{t('payslips.noPayslips')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('payslips.noPayslipsDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
