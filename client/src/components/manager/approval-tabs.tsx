import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import ApprovalsList from "./approvals-list";

type TabType = 'deviations' | 'leaveRequests' | 'history';

const ApprovalTabs = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('deviations');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };
  
  return (
    <Tabs defaultValue="deviations" onValueChange={handleTabChange}>
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
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <span className="material-icons text-4xl text-muted-foreground mb-2">history</span>
          <h3 className="text-lg font-medium">{t('manager.historyTitle')}</h3>
          <p className="text-muted-foreground">{t('manager.historyDescription')}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ApprovalTabs;
