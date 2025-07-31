import { useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import ApprovalTabs from "@/components/manager/approval-tabs";

export default function Manager() {
  const { t } = useI18n();
  const { user } = useStore();
  const [, setLocation] = useLocation();
  
  const isManager = user.currentRole === 'manager';
  
  // Redirect if not a manager
  useEffect(() => {
    if (!isManager) {
      setLocation('/');
    }
  }, [isManager, setLocation]);
  
  if (!isManager) {
    return null;
  }
  
  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('manager.title')}</h1>
        <p className="text-muted-foreground">{t('manager.description')}</p>
      </div>
      
      <ApprovalTabs />
    </section>
  );
}
