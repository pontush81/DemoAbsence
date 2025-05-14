import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiService } from "@/lib/apiService";
import { Payslip } from "@shared/schema";
import { getMonthName } from "@/lib/utils/date";

interface PayslipListProps {
  payslips: Payslip[];
}

const PayslipList = ({ payslips }: PayslipListProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());
  
  // Group payslips by year
  const payslipsByYear = payslips.reduce<Record<number, Payslip[]>>((acc, payslip) => {
    if (!acc[payslip.year]) {
      acc[payslip.year] = [];
    }
    acc[payslip.year].push(payslip);
    return acc;
  }, {});
  
  // Get unique years
  const years = Object.keys(payslipsByYear).map(Number).sort((a, b) => b - a);
  
  // Download payslip handler
  const handleDownload = async (payslipId: number, fileName: string) => {
    try {
      const blob = await apiService.getPayslipFile(payslipId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('payslips.downloadSuccess'),
        description: t('payslips.downloadSuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('payslips.downloadError'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <Tabs 
          value={activeYear.toString()} 
          onValueChange={(value) => setActiveYear(parseInt(value, 10))}
          className="w-full"
        >
          <TabsList className="mb-6 inline-flex">
            {years.map((year) => (
              <TabsTrigger 
                key={year} 
                value={year.toString()}
                className={`
                  px-4 py-2 text-sm font-medium 
                  ${activeYear === year 
                    ? 'bg-primary text-white' 
                    : 'bg-background hover:bg-muted'}
                `}
              >
                {year}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {years.map((year) => (
            <TabsContent key={year} value={year.toString()} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {payslipsByYear[year]
                  .sort((a, b) => b.month - a.month)
                  .map((payslip) => (
                    <Card key={payslip.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="bg-primary-light p-4 flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg">{getMonthName(payslip.month)}</h3>
                            <p className="text-sm text-muted-foreground">{payslip.year}</p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            PDF
                          </Badge>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('payslips.published')}: {new Date(payslip.published).toLocaleDateString()}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownload(payslip.id, payslip.fileName)}
                          >
                            <span className="material-icons mr-2 text-sm">download</span>
                            {t('payslips.download')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PayslipList;
