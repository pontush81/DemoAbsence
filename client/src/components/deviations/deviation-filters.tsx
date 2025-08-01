import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export type DeviationFilters = {
  period: string;
  status: string;
  timeCode: string;
  sortBy: string;
};

interface DeviationFiltersProps {
  filters: DeviationFilters;
  onFilterChange: (filters: DeviationFilters) => void;
}

const DeviationFilters = ({ filters, onFilterChange }: DeviationFiltersProps) => {
  const { t } = useI18n();
  const [localFilters, setLocalFilters] = useState<DeviationFilters>(filters);
  
  const handleFilterChange = (key: keyof DeviationFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="filter-period" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.period')}
            </label>
            <Select
              value={localFilters.period}
              onValueChange={(value) => handleFilterChange('period', value)}
            >
              <SelectTrigger id="filter-period">
                <SelectValue placeholder={t('deviations.period')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">{t('deviations.allTime')}</SelectItem>
                <SelectItem value="current-month">{t('deviations.currentMonth')}</SelectItem>
                <SelectItem value="last-month">{t('deviations.lastMonth')}</SelectItem>
                <SelectItem value="custom">{t('deviations.customPeriod')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-status" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.status')}
            </label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder={t('deviations.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('deviations.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('deviations.pending')}</SelectItem>
                <SelectItem value="approved">{t('deviations.approved')}</SelectItem>
                <SelectItem value="rejected">{t('deviations.rejected')}</SelectItem>
                <SelectItem value="returned">{t('deviations.returned')}</SelectItem>
                <SelectItem value="draft">{t('deviations.draft')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="filter-type" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.timeCode')}
            </label>
            <Select
              value={localFilters.timeCode}
              onValueChange={(value) => handleFilterChange('timeCode', value)}
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder={t('deviations.timeCode')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('deviations.allTimeCodes')}</SelectItem>
                <SelectItem value="overtime">{t('deviations.overtime')}</SelectItem>
                <SelectItem value="sick">{t('deviations.sick')}</SelectItem>
                <SelectItem value="vab">{t('deviations.vab')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label htmlFor="filter-sortBy" className="block text-sm font-medium text-secondary mb-2">
              {t('deviations.sortBy')}
            </label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger id="filter-sortBy">
                <SelectValue placeholder={t('deviations.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">{t('deviations.newestFirst')}</SelectItem>
                <SelectItem value="date-asc">{t('deviations.oldestFirst')}</SelectItem>
                <SelectItem value="status">{t('deviations.byStatus')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleApplyFilters}
            className="bg-primary hover:bg-primary-dark text-white h-10"
          >
            {t('action.filter')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviationFilters;
