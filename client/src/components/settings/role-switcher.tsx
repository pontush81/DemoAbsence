import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import type { UserRole } from "@/lib/store";

const RoleSwitcher = () => {
  const { t } = useI18n();
  const { user, setCurrentRole } = useStore();
  const [, setLocation] = useLocation();
  
  const handleRoleChange = (role: string) => {
    setCurrentRole(role as UserRole);
  };
  
  const goToManagerArea = () => {
    setLocation('/manager');
  };
  
  const goToHRArea = () => {
    setLocation('/manager'); // HR also uses manager page for now
  };
  
  const goToPayrollArea = () => {
    setLocation('/payroll-dashboard'); // Payroll goes to payroll dashboard
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl">{t('settings.roleSwitch') || 'Role Settings'}</CardTitle>
            <CardDescription className="mt-1.5">
              {t('settings.roleSwitchDescription') || 'Switch between employee and manager roles to test different views.'}
            </CardDescription>
          </div>
          <Badge 
            variant="secondary"
            className={`text-md py-1.5 px-3 ${
              user.currentRole === 'manager' ? 'bg-blue-100 text-blue-800' :
              user.currentRole === 'hr' ? 'bg-purple-100 text-purple-800' :
              user.currentRole === 'payroll' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}
          >
            {user.currentRole === 'manager' ? 'Chef' :
             user.currentRole === 'hr' ? 'HR-specialist' :
             user.currentRole === 'payroll' ? 'Löneadministratör' :
             'Medarbetare'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="role-select" className="text-sm font-medium">
              {t('settings.currentRole') || 'Current Role'}
            </label>
            <Select value={user.currentRole} onValueChange={handleRoleChange}>
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue placeholder={t('settings.selectRole') || 'Select role'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">person</span>
                    Medarbetare
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">supervisor_account</span>
                    Chef
                  </div>
                </SelectItem>
                <SelectItem value="hr">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">people</span>
                    HR-specialist
                  </div>
                </SelectItem>
                <SelectItem value="payroll">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">account_balance_wallet</span>
                    Löneadministratör
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              user.currentRole === 'manager' ? 'bg-blue-500' :
              user.currentRole === 'hr' ? 'bg-purple-500' :
              user.currentRole === 'payroll' ? 'bg-orange-500' :
              'bg-green-500'
            }`}></div>
            <span className="text-sm">
              {user.currentRole === 'manager' ? 'Chefsroll aktiv' :
               user.currentRole === 'hr' ? 'HR-specialist roll aktiv' :
               user.currentRole === 'payroll' ? 'Löneadministratör roll aktiv' :
               'Medarbetarroll aktiv'}
            </span>
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">{t('settings.roleInfo') || 'Role Information'}</h4>
            <p className="text-sm text-muted-foreground">
              {user.currentRole === 'manager'
                ? 'Du kan nu godkänna avvikelser och ledighetsansökningar i Chefsektionen.'
                : user.currentRole === 'hr'
                ? 'Du kan hantera personalärenden och se översikt över alla anställda.'
                : user.currentRole === 'payroll'
                ? 'Du kan hantera löner, exportera PAXML och se löneoversikt.'
                : 'Du kan skicka in avvikelser och ledighetsansökningar för godkännande.'}
            </p>
          </div>
          
          {user.currentRole === 'manager' && (
            <Button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700" 
              onClick={goToManagerArea}
            >
              <span className="material-icons mr-2">supervisor_account</span>
              Gå till Chefsområde
            </Button>
          )}
          {user.currentRole === 'hr' && (
            <Button 
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700" 
              onClick={goToHRArea}
            >
              <span className="material-icons mr-2">people</span>
              Gå till HR-område
            </Button>
          )}
          {user.currentRole === 'payroll' && (
            <Button 
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700" 
              onClick={goToPayrollArea}
            >
              <span className="material-icons mr-2">account_balance_wallet</span>
              Gå till Löneområde
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher;