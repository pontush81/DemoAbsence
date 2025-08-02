import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import DeviationList from "@/components/deviations/deviation-list";
import DeviationForm from "@/components/deviations/deviation-form";
import DeviationDetails from "@/components/deviations/deviation-details";
import { apiService } from "@/lib/apiService";

export default function Deviations() {
  const { t } = useI18n();
  const params = useParams();
  const [location, navigate] = useLocation();
  const [view, setView] = useState<'list' | 'new' | 'edit' | 'details'>('list');
  const [deviationId, setDeviationId] = useState<number | null>(null);
  
  // Determine the view based on the route
  useEffect(() => {
    if (location === '/deviations') {
      setView('list');
      setDeviationId(null);
    } else if (location === '/deviations/new') {
      setView('new');
      setDeviationId(null);
    } else if (location.startsWith('/deviations/edit/')) {
      setView('edit');
      setDeviationId(parseInt(params.id || '0', 10));
    } else if (location.startsWith('/deviations/')) {
      setView('details');
      setDeviationId(parseInt(params.id || '0', 10));
    }
  }, [location, params]);
  
  // Fetch deviation for edit/details views
  const { data: deviation, isLoading } = useQuery({
    queryKey: ['/api/deviations', deviationId],
    queryFn: () => deviationId ? apiService.getDeviation(deviationId) : null,
    enabled: !!deviationId && (view === 'edit' || view === 'details'),
  });
  
  return (
    <section>
      {view === 'list' && (
        <>
          {/* Modern header with clear hierarchy and better UX */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">{t('deviations.title')}</h1>
              <p className="text-lg text-muted-foreground mt-1">{t('deviations.description')}</p>
              <div className="mt-2 text-sm text-gray-500">
                💡 <strong>Tips:</strong> Default-vyn visar avvikelser som behöver din åtgärd först
              </div>
            </div>
            
            {/* Primary action - prominent positioning following UX best practices */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/deviations/new">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 shadow-lg"
                >
                  ➕ Ny avvikelse
                </Button>
              </Link>
            </div>
          </div>

          {/* Enhanced deviation list with better UX */}
          <div className="space-y-6">
            <DeviationList />
          </div>
        </>
      )}
      
      {view === 'new' && (
        <DeviationForm />
      )}
      
      {view === 'edit' && deviationId && (
        <DeviationForm 
          deviationId={deviationId}
          onCancel={() => navigate('/deviations')}
        />
      )}
      
      {view === 'details' && deviationId && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{t('deviations.deviationDetails')}</h1>
            <p className="text-muted-foreground">{t('deviations.viewDeviationDescription')}</p>
          </div>
          
          <DeviationDetails 
            deviationId={deviationId}
            onBack={() => navigate('/deviations')}
          />
        </>
      )}
    </section>
  );
}
