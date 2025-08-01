import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/lib/store";

interface RoleDropdownProps {
  variant?: "compact" | "full";
  className?: string;
}

const RoleDropdown = ({ variant = "compact", className = "" }: RoleDropdownProps) => {
  const { user, setCurrentRole } = useStore();
  const { t } = useI18n();

  const roles = [
    { 
      value: 'employee' as UserRole, 
      label: 'Medarbetare',
      description: 'Visa endast egna uppgifter',
      icon: 'person',
      color: 'bg-green-100 text-green-800'
    },
    { 
      value: 'manager' as UserRole, 
      label: 'Chef',
      description: 'Godkänn ansökningar från medarbetare', 
      icon: 'supervisor_account',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      value: 'hr' as UserRole, 
      label: 'HR-specialist',
      description: 'Hantera personalärenden',
      icon: 'people',
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      value: 'payroll' as UserRole, 
      label: 'Löneadministratör',
      description: 'Hantera löner och PAXML-export',
      icon: 'account_balance_wallet',
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  // Filtrera roller baserat på vad användaren har tillgång till
  // Fallback till alla roller om availableRoles inte finns (för bakåtkompatibilitet)
  const userAvailableRoles = user.availableRoles || ['employee', 'manager', 'hr', 'payroll'];
  const availableRoleData = roles.filter(role => 
    userAvailableRoles.includes(role.value)
  );

  const currentRoleData = roles.find(role => role.value === user.currentRole);

  const handleRoleChange = (role: UserRole) => {
    console.log('Role change clicked:', role);
    setCurrentRole(role);
  };

  const handleDropdownOpen = () => {
    console.log('Dropdown clicked/opened');
  };

  return (
    <DropdownMenu onOpenChange={(open) => console.log('Dropdown state:', open)}>
      <DropdownMenuTrigger asChild>
        <button 
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:bg-muted/80 transition-colors ${currentRoleData?.color} ${className}`}
          onClick={handleDropdownOpen}
        >
          {variant === "full" && (
            <span className="material-icons text-sm mr-1">{currentRoleData?.icon}</span>
          )}
          {currentRoleData?.label}
          <span className="material-icons text-sm ml-1">expand_more</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          Växla roll {user.isDemoMode ? '(Demo)' : '(Produktion)'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoleData.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleChange(role.value)}
            className={`cursor-pointer ${user.currentRole === role.value ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center w-full">
              <span className="material-icons text-sm mr-2">{role.icon}</span>
              <div>
                <div className="font-medium">{role.label}</div>
                {variant === "full" && (
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                )}
              </div>
              {user.currentRole === role.value && (
                <span className="material-icons text-sm ml-auto text-primary">check</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleDropdown;