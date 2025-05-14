import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { apiService } from "@/lib/apiService";
import { Payslip } from "@shared/schema";
import { getMonthName } from "@/lib/utils/date";
import { FileTextIcon, EyeIcon, DownloadIcon } from "lucide-react";

interface PayslipListProps {
  payslips: Payslip[];
}

const PayslipList = ({ payslips }: PayslipListProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  
  // Sort payslips by date (newest first)
  const sortedPayslips = [...payslips].sort((a, b) => {
    // Sort by year (descending)
    if (a.year !== b.year) return b.year - a.year;
    // Then by month (descending)
    return b.month - a.month;
  });
  
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

  // Function to format amount with thousands separator
  const formatAmount = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-6 w-6" />
          <CardTitle>{t('payslips.yourPayslips')}</CardTitle>
        </div>
        <CardDescription>{t('payslips.payslipsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('payslips.period')}</TableHead>
              <TableHead>{t('payslips.paymentDate')}</TableHead>
              <TableHead>{t('payslips.amount')}</TableHead>
              <TableHead>{t('payslips.status')}</TableHead>
              <TableHead className="text-right">{t('payslips.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPayslips.map((payslip) => {
              // Format payment date from yyyy-MM-dd to something more readable
              const paymentDate = payslip.payDate;
              const monthName = getMonthName(payslip.month - 1); // Adjust because getMonthName is 0-based
              const viewStatus = payslip.viewed ? 'viewed' : 'new';
              
              return (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {monthName} {payslip.year}
                  </TableCell>
                  <TableCell>{paymentDate}</TableCell>
                  <TableCell>{formatAmount(payslip.netAmount)} kr</TableCell>
                  <TableCell>
                    <Badge variant={viewStatus === 'new' ? 'default' : 'outline'}>
                      {viewStatus === 'new' ? t('payslips.status.new') : t('payslips.status.viewed')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title={t('payslips.view')}
                        onClick={() => handleDownload(payslip.id, payslip.fileName)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title={t('payslips.download')}
                        onClick={() => handleDownload(payslip.id, payslip.fileName)}
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PayslipList;
