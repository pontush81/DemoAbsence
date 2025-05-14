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
            variant={user.currentRole === 'manager' ? 'secondary' : 'default'}
            className="text-md py-1.5 px-3"
          >
            {user.currentRole === 'manager' ? 'Chef' : 'Anställd'}
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
                <SelectItem value="employee">{t('roles.employee') || 'Employee'}</SelectItem>
                <SelectItem value="manager">{t('roles.manager') || 'Manager'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${user.currentRole === 'manager' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <span className="text-sm">
              {user.currentRole === 'manager' 
                ? (t('roles.managerActive') || 'Manager role active') 
                : (t('roles.employeeActive') || 'Employee role active')}
            </span>
          </div>
          
          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">{t('settings.roleInfo') || 'Role Information'}</h4>
            <p className="text-sm text-muted-foreground">
              {user.currentRole === 'manager'
                ? (t('settings.managerInfo') || 'You can now approve deviations and leave requests in the Manager section.')
                : (t('settings.employeeInfo') || 'You can submit deviations and leave requests for approval.')}
            </p>
          </div>
          
          {user.currentRole === 'manager' && (
            <Button 
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700" 
              onClick={goToManagerArea}
            >
              <span className="material-icons mr-2">supervisor_account</span>
              {t('settings.goToManager') || 'Go to Manager Area'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher;