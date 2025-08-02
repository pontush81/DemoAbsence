import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import LeaveList from "@/components/leave/leave-list";
import LeaveForm from "@/components/leave/leave-form";
import { apiService } from "@/lib/apiService";

export default function Leave() {
  const { t } = useI18n();
  const params = useParams();
  const [location, navigate] = useLocation();
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'details'>('list');
  const [leaveId, setLeaveId] = useState<number | null>(null);
  
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
              <div className="mt-2 text-sm text-gray-500">
                🗓️ <strong>Tips:</strong> Planera din ledighet i förväg för smidig godkännandeprocess
              </div>
            </div>
            
            {/* Primary action - adapted for leave planning workflow */}
            <div className="flex flex-col sm:flex-row gap-3">
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

          {/* Enhanced leave list with planning-focused UX */}
          <div className="space-y-6">
            <LeaveList />
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
          
          {/* TODO: Add LeaveRequestDetails component */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p>Leave request details will be displayed here.</p>
            <Button 
              onClick={() => navigate('/leave')}
              className="mt-4"
            >
              {t('action.back')}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
