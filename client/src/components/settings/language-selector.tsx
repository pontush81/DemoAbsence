import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const LanguageSelector = () => {
  const { t, language, setLanguage } = useI18n();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<'sv' | 'en'>(language);
  
  const handleLanguageChange = (value: 'sv' | 'en') => {
    setSelectedLanguage(value);
  };
  
  const handleSave = () => {
    setLanguage(selectedLanguage);
    toast({
      title: t('settings.languageUpdated'),
      description: selectedLanguage === 'sv' 
        ? t('toast.languageChangedSwedish')
        : t('toast.languageChangedEnglish'),
    });
  };
  
  return (
    <div>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">{t('settings.selectLanguage')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('settings.languageDescription')}
            </p>
          </div>
          
          <RadioGroup 
            value={selectedLanguage} 
            onValueChange={(value) => handleLanguageChange(value as 'sv' | 'en')}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sv" id="sv" />
              <Label htmlFor="sv" className="flex items-center">
                <span role="img" aria-label={t('accessibility.swedishFlag')} className="mr-2">
                  🇸🇪
                </span>
                {t('settings.swedish')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en" className="flex items-center">
                <span role="img" aria-label={t('accessibility.englishFlag')} className="mr-2">
                  🇬🇧
                </span>
                {t('settings.english')}
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            onClick={handleSave}
            className="mt-6 bg-accent hover:bg-accent-dark text-white"
          >
            <span className="material-icons mr-2">save</span>
            {t('action.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSelector;
