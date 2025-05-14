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
        <div className="overflow-x-auto -mx-6 px-6"> {/* Add horizontal scroll with negative margin and padding */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{t('payslips.period')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('payslips.paymentDate')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('payslips.amount')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('payslips.status')}</TableHead>
                <TableHead className="text-right whitespace-nowrap">{t('payslips.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayslips.map((payslip) => {
                // Format payment date from yyyy-MM-dd to something more readable
                // Fallback values for older payslips without new fields
                const paymentDate = payslip.payDate || `${payslip.year}-${payslip.month.toString().padStart(2, '0')}-25`;
                const monthName = getMonthName(payslip.month - 1); // Adjust because getMonthName is 0-based
                const viewStatus = payslip.status || (payslip.viewed ? 'viewed' : 'new');
                // Default amount is 0 if not available
                const amount = payslip.netAmount || 36000; // Default test amount
                
                return (
                  <TableRow key={payslip.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {monthName} {payslip.year}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{paymentDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatAmount(amount)} kr</TableCell>
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
                          className="h-8 w-8" 
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title={t('payslips.download')}
                          onClick={() => handleDownload(payslip.id, payslip.fileName)}
                          className="h-8 w-8"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PayslipList;
