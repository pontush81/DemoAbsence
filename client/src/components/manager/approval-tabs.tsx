import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";
import ApprovalsList from "./approvals-list";

type TabType = 'deviations' | 'leaveRequests' | 'history';

const ApprovalTabs = () => {
  const { t } = useI18n();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('deviations');
  
  // Check URL parameters on mount to set the correct tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam && ['deviations', 'leaveRequests', 'history'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [location]);
  
  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="border-b border-gray-200 w-full bg-transparent">
        <TabsTrigger 
          value="deviations" 
          className={`
            px-4 py-2 text-sm font-medium border-b-2 -mb-px
            ${activeTab === 'deviations' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}
          `}
        >
          {t('manager.pendingDeviations')}
        </TabsTrigger>
        <TabsTrigger 
          value="leaveRequests" 
          className={`
            px-4 py-2 text-sm font-medium border-b-2 -mb-px
            ${activeTab === 'leaveRequests' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}
          `}
        >
          {t('manager.leaveRequests')}
        </TabsTrigger>
        <TabsTrigger 
          value="history" 
          className={`
            px-4 py-2 text-sm font-medium border-b-2 -mb-px
            ${activeTab === 'history' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'}
          `}
        >
          {t('manager.history')}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="deviations" className="pt-6">
        <ApprovalsList type="deviations" />
      </TabsContent>
      
      <TabsContent value="leaveRequests" className="pt-6">
        <ApprovalsList type="leaveRequests" />
      </TabsContent>
      
      <TabsContent value="history" className="pt-6">
        <ApprovalsList type="history" />
      </TabsContent>
    </Tabs>
  );
};

export default ApprovalTabs;
