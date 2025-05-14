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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t('deviations.title')}</h1>
              <p className="text-muted-foreground">{t('deviations.description')}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/deviations/new">
                <Button className="inline-flex items-center bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded font-medium shadow-sm transition-colors">
                  <span className="material-icons mr-2">add</span>
                  {t('action.newDeviation')}
                </Button>
              </Link>
            </div>
          </div>
          
          <DeviationList />
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
