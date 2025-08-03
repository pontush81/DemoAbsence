import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import LeaveList from "@/components/leave/leave-list";
import LeaveForm from "@/components/leave/leave-form";
import LeaveDetails from "@/components/leave/leave-details";
import LeaveCalendar from "@/components/leave/leave-calendar";
import { apiService } from "@/lib/apiService";

export default function Leave() {
  const { t } = useI18n();
  const params = useParams();
  const [location, navigate] = useLocation();
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'details'>('list');
  const [leaveId, setLeaveId] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<'calendar' | 'list'>('calendar'); // Default to calendar (UX best practice)
  
  // Determine the view based on the route
  useEffect(() => {
    if (location === '/leave') {
      setView('list');
      setLeaveId(null);
    } else if (location === '/leave/new') {
      setView('new');
      setLeaveId(null);
    } else if (location.startsWith('/leave/edit/')) {
      setView('edit');
      setLeaveId(parseInt(params.id || '0', 10));
    } else if (location.startsWith('/leave/')) {
      setView('details');
      setLeaveId(parseInt(params.id || '0', 10));
    }
  }, [location, params]);
  
  // Fetch leave request for edit/details views
  const { data: leaveRequest, isLoading } = useQuery({
    queryKey: ['/api/leave-requests', leaveId],
    queryFn: () => leaveId ? apiService.getLeaveRequest(leaveId) : null,
    enabled: !!leaveId && (view === 'edit' || view === 'details'),
  });
  
  return (
    <section>
      {view === 'list' && (
        <>
          {/* Modern header with planning-focused hierarchy (konsekvent grundstruktur) */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">{t('leave.title')}</h1>
              <p className="text-lg text-muted-foreground mt-1">{t('leave.description')}</p>
            </div>
            
            {/* Primary action + View toggle - adapted for leave planning workflow */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* View Toggle - Following Perplexity's UX best practice */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={displayMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('calendar')}
                  className="flex items-center gap-2"
                >
                  📅 Kalender
                </Button>
                <Button
                  variant={displayMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('list')}
                  className="flex items-center gap-2"
                >
                  📋 Lista
                </Button>
              </div>
              
              <Link href="/leave/new">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 shadow-lg"
                >
                  📅 Ansök om ledighet
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced leave display with calendar/list toggle - Following UX best practices */}
          <div className="space-y-6">
            {displayMode === 'calendar' ? (
              <LeaveCalendar />
            ) : (
              <LeaveList />
            )}
          </div>
        </>
      )}
      
      {view === 'new' && (
        <LeaveForm />
      )}
      
      {view === 'edit' && leaveId && (
        <LeaveForm 
          leaveRequestId={leaveId}
          onCancel={() => navigate('/leave')}
        />
      )}
      
      {view === 'details' && leaveId && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t('leave.leaveDetails')}</h1>
            <p className="text-muted-foreground">{t('leave.viewLeaveDescription')}</p>
          </div>
          
          <LeaveDetails 
            leaveId={leaveId}
            onBack={() => navigate('/leave')}
          />
        </>
      )}
    </section>
  );
}
