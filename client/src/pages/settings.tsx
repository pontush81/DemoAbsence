import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import PersonalInfoForm from "@/components/settings/personal-info-form";
import BankInfoForm from "@/components/settings/bank-info-form";
import LanguageSelector from "@/components/settings/language-selector";

export default function Settings() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("personal");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Card>
        <Tabs 
          defaultValue="personal" 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <CardContent className="pt-6">
            <TabsList className="mb-8 grid grid-cols-3 gap-4">
              <TabsTrigger 
                value="personal"
                className={`
                  px-4 py-2 text-sm font-medium 
                  ${activeTab === 'personal' 
                    ? 'bg-primary text-white' 
                    : 'bg-background hover:bg-muted'}
                `}
              >
                {t('settings.personalInfo')}
              </TabsTrigger>
              <TabsTrigger 
                value="bank"
                className={`
                  px-4 py-2 text-sm font-medium 
                  ${activeTab === 'bank' 
                    ? 'bg-primary text-white' 
                    : 'bg-background hover:bg-muted'}
                `}
              >
                {t('settings.bankInfo')}
              </TabsTrigger>
              <TabsTrigger 
                value="language"
                className={`
                  px-4 py-2 text-sm font-medium 
                  ${activeTab === 'language' 
                    ? 'bg-primary text-white' 
                    : 'bg-background hover:bg-muted'}
                `}
              >
                {t('settings.language')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              <PersonalInfoForm />
            </TabsContent>
            <TabsContent value="bank" className="mt-0">
              <BankInfoForm />
            </TabsContent>
            <TabsContent value="language" className="mt-0">
              <LanguageSelector />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </section>
  );
}
