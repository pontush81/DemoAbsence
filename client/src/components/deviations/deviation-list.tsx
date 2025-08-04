import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/status-badge";
import { apiService } from "@/lib/apiService";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { Deviation } from "@shared/schema";
import DeviationFilters from "./deviation-filters";
import { formatTime, formatDuration } from "@/lib/utils/date";

interface DeviationListProps {
  onSelect?: (id: number) => void;
}

const DeviationList = ({ onSelect }: DeviationListProps) => {
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const { user } = useStore();
  const employeeId = user.currentUser?.employeeId || user.currentUser?.id;
  
  // Filters - default to show items needing action first (UX best practice)
  const [filters, setFilters] = useState({
    period: 'current-month', // Show current month by default
    status: 'needs-action', // New combined filter for pending+returned+draft
    timeCode: 'all',
    sortBy: 'date-desc', // Newest first by default
  });
  
  // Fetch deviations
  const { data: deviations, isLoading, error } = useQuery({
    queryKey: ['/api/deviations', employeeId, filters],
    queryFn: () => employeeId 
      ? apiService.getDeviations(employeeId, filters)
      : Promise.resolve([]),
    enabled: !!employeeId,
  });

  // Fetch time codes for mapping
  const { data: timeCodes = [] } = useQuery({
    queryKey: ['/api/timecodes'],
    queryFn: () => apiService.getTimeCodes(),
  });

  // Helper function to get time code name
  const getTimeCodeName = (timeCodeStr: string) => {
    if (!Array.isArray(timeCodes)) return timeCodeStr;
    const timeCode = timeCodes.find(tc => tc.code === timeCodeStr);
    return timeCode ? `${timeCode.code} - ${timeCode.name}` : timeCodeStr;
  };

  // Helper function to format deviation duration
  const formatDeviationTime = (startTime: string, endTime: string) => {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
      
      // For full-day absences (8 hours = 480 minutes), show as duration
      if (diffMinutes >= 480) {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        if (minutes === 0) {
          return `${hours}h frånvaro`;
        } else {
          return `${hours}h ${minutes}min frånvaro`;
        }
      }
      
      // For shorter periods, show time range
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    } catch {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
  };
  
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };
  
  const handleRowClick = (deviation: Deviation) => {
    if (onSelect) {
      onSelect(deviation.id);
    } else {
      setLocation(`/deviations/${deviation.id}`);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div>
        {/* Status info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Laddar avvikelser som behöver åtgärd
              </h3>
              <p className="mt-1 text-sm text-blue-600">
                Vi hämtar avvikelser med status: väntande, återskickade och utkast
              </p>
            </div>
          </div>
        </div>
        
        <DeviationFilters filters={filters} onFilterChange={handleFilterChange} />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('deviations.date')}</TableHead>
                  <TableHead>{t('deviations.timeCode')}</TableHead>
                  <TableHead>{t('deviations.time')}</TableHead>
                  <TableHead>{t('deviations.status')}</TableHead>
                  <TableHead>{t('deviations.comment')}</TableHead>
                  <TableHead className="text-right">{t('deviations.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="p-6 mt-6">
        <p className="text-destructive">{t('deviations.loadError')}: {(error as Error).message}</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          {t('action.retry')}
        </Button>
      </div>
    );
  }
  
  // Render empty state
  if (deviations?.length === 0) {
    return (
      <div>
        <DeviationFilters filters={filters} onFilterChange={handleFilterChange} />
        <div className="p-6 mt-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-2">event_busy</span>
          <h3 className="text-lg font-medium">{t('deviations.noDeviations')}</h3>
          <p className="text-muted-foreground">{t('deviations.noDeviationsDescription')}</p>
          <p className="text-sm text-gray-500 mt-3">
            👆 Använd knapparna ovan för att registrera en ny avvikelse
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <DeviationFilters filters={filters} onFilterChange={handleFilterChange} />
      
      <div className="overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('deviations.date')}</TableHead>
                <TableHead>{t('deviations.timeCode')}</TableHead>
                <TableHead>{t('deviations.time')}</TableHead>
                <TableHead>{t('deviations.status')}</TableHead>
                <TableHead>{t('deviations.comment')}</TableHead>
                <TableHead className="text-right">{t('deviations.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deviations?.map((deviation) => (
                <TableRow 
                  key={deviation.id} 
                  className="hover:bg-background-dark transition-colors cursor-pointer"
                  onClick={() => handleRowClick(deviation)}
                >
                  <TableCell className="whitespace-nowrap">{deviation.date}</TableCell>
                  <TableCell className="whitespace-nowrap">{getTimeCodeName(deviation.timeCode)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDeviationTime(deviation.startTime, deviation.endTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={deviation.status as any} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate-text">
                    {deviation.comment || '-'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {deviation.status === 'draft' || deviation.status === 'returned' ? (
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary-dark mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/deviations/edit/${deviation.id}`);
                        }}
                      >
                        {t('action.edit')}
                      </Button>
                    ) : (
                      <Button 
                        variant="link" 
                        className="text-primary hover:text-primary-dark mr-3"
                      >
                        {t('action.view')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination (simplified) */}
        <div className="px-4 py-3 bg-background-dark flex items-center justify-between border-t border-border">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pagination.showing')} <span className="font-medium">1</span> {t('pagination.to')} <span className="font-medium">{deviations?.length}</span> {t('pagination.of')} <span className="font-medium">{deviations?.length}</span> {t('pagination.results')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviationList;
