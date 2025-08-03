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
  
  // SECURITY: Only HR administrators should be able to change roles
  // Regular employees changing their own roles is a critical security risk
  const canChangeRoles = user.currentRole === 'hr'; // Only HR can change roles
  
  const handleRoleChange = (role: string) => {
    if (!canChangeRoles) {
      console.warn('🚨 SECURITY: Unauthorized role change attempt blocked', {
        currentUser: user.currentUser?.employeeId,
        currentRole: user.currentRole,
        attemptedRole: role,
        timestamp: new Date().toISOString()
      });
      // TODO: In production, log this security event to audit system
      return;
    }
    console.log('✅ AUTHORIZED: Role change by HR administrator', {
      from: user.currentRole,
      to: role,
      user: user.currentUser?.employeeId
    });
    setCurrentRole(role as UserRole);
  };
  
  const goToManagerArea = () => {
    try {
      console.log('🔍 RoleSwitcher: Navigating to manager area');
      setLocation('/manager');
    } catch (error) {
      console.error('❌ RoleSwitcher: Error navigating to manager area:', error);
      // Fallback: Use browser navigation
      window.location.href = '/manager';
    }
  };
  
  const goToHRArea = () => {
    try {
      console.log('🔍 RoleSwitcher: Navigating to HR area');
      setLocation('/manager'); // HR also uses manager page for now
    } catch (error) {
      console.error('❌ RoleSwitcher: Error navigating to HR area:', error);
      // Fallback: Use browser navigation
      window.location.href = '/manager';
    }
  };
  
  const goToPayrollArea = () => {
    try {
      console.log('🔍 RoleSwitcher: Navigating to payroll dashboard');
      setLocation('/payroll-dashboard'); // Payroll goes to payroll dashboard
    } catch (error) {
      console.error('❌ RoleSwitcher: Error navigating to payroll dashboard:', error);
      // Fallback: Use browser navigation
      window.location.href = '/payroll-dashboard';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl">{t('settings.roleSwitch') || 'Rollhantering'}</CardTitle>
            <CardDescription className="mt-1.5">
              {canChangeRoles 
                ? 'Som HR-administratör kan du ändra användarroller för systemtestning.'
                : 'Din nuvarande systemroll och behörigheter. Endast HR kan ändra roller.'
              }
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
            
            {canChangeRoles ? (
              // HR ONLY: Full role selection capabilities
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
            ) : (
              // SECURITY: Read-only view for non-HR users
              <div className="space-y-3">
                <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2 text-gray-600">
                      {user.currentRole === 'manager' ? 'supervisor_account' :
                       user.currentRole === 'hr' ? 'people' :
                       user.currentRole === 'payroll' ? 'account_balance_wallet' :
                       'person'}
                    </span>
                    <span className="font-medium text-gray-700">
                      {user.currentRole === 'manager' ? 'Chef' :
                       user.currentRole === 'hr' ? 'HR-specialist' :
                       user.currentRole === 'payroll' ? 'Löneadministratör' :
                       'Medarbetare'}
                    </span>
                  </div>
                  <span className="material-icons text-gray-400 cursor-not-allowed">lock</span>
                </div>
                
                {/* Security explanation */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <span className="material-icons text-amber-600 text-sm mt-0.5">security</span>
                    <div className="text-xs text-amber-800">
                      <p className="font-medium mb-1">Säkerhetsrestriktion</p>
                      <p>Endast HR-administratörer kan ändra användarroller. Kontakta HR-avdelningen om du behöver ändra din rollbehörighet.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              type="button"
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 relative z-10" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Manager button clicked');
                goToManagerArea();
              }}
            >
              <span className="material-icons mr-2">supervisor_account</span>
              Gå till Chefsområde
            </Button>
          )}
          {user.currentRole === 'hr' && (
            <Button 
              type="button"
              className="w-full mt-4 bg-purple-600 hover:bg-purple-700 relative z-10" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ HR button clicked');
                goToHRArea();
              }}
            >
              <span className="material-icons mr-2">people</span>
              Gå till HR-område
            </Button>
          )}
          {user.currentRole === 'payroll' && (
            <Button 
              type="button"
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 relative z-10" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Payroll button clicked');
                goToPayrollArea();
              }}
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