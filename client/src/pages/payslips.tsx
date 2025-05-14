import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('payslips.title')}</h1>
        <p className="text-muted-foreground">{t('payslips.description')}</p>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-md" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-destructive mb-4">
            {t('payslips.loadError')}: {(error as Error).message}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            {t('action.retry')}
          </Button>
        </div>
      ) : payslips && payslips.length > 0 ? (
        <PayslipList payslips={payslips} />
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-2">description</span>
          <h3 className="text-lg font-medium">{t('payslips.noPayslips')}</h3>
          <p className="text-muted-foreground">
            {t('payslips.noPayslipsDescription')}
          </p>
        </div>
      )}
    </section>
  );
}
