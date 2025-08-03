import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useFeatureFlags } from "@/lib/featureFlags";
import { useStore } from "@/lib/store";
import UserSwitcher from "./user-switcher";

const Sidebar = () => {
  const [location] = useLocation();
  const { t } = useI18n();
  const { isFeatureEnabled } = useFeatureFlags();
  const { user } = useStore();
  
  const showTravelExpenses = isFeatureEnabled('enableTravelExpenses');
  const isManager = user.currentRole === 'manager';
  const isHR = user.currentRole === 'hr';
  const isHRManager = user.currentRole === 'hr-manager';
  const isPayrollAdmin = user.currentRole === 'payroll-admin';
  const isPayrollManager = user.currentRole === 'payroll-manager';
  const isFinanceController = user.currentRole === 'finance-controller';
  const isEmployee = user.currentRole === 'employee';
  
  // Rollväxling hanteras nu via persona-växlaren
  
  // Roles that can access manager functions
  const canAccessManagerFunctions = isManager || isHR || isHRManager || isPayrollAdmin || isPayrollManager;
  
  // 🔒 PAYROLL EXPORT - HIGHLY RESTRICTED per GDPR and Swedish law
  // Only specific payroll roles + HR-manager (if they have payroll responsibility)
  const canAccessPayrollExport = isPayrollAdmin || isPayrollManager || isHRManager;
  
  const menuItems = [
    {
      href: "/",
      icon: "dashboard",
      label: t('nav.dashboard'),
      active: location === "/"
    },
    {
      href: "/new-deviation",
      icon: "event_note",
      label: t('nav.deviations'),
      active: location.startsWith("/deviations") || location === "/new-deviation"
    },
    {
      href: "/leave",
      icon: "free_cancellation",
      label: t('nav.leave'),
      active: location === "/leave"
    },
    {
      href: "/payslips",
      icon: "receipt",
      label: t('nav.payslips'),
      active: location === "/payslips"
    },

    {
      href: "/settings",
      icon: "settings",
      label: t('nav.settings'),
      active: location === "/settings"
    }
  ];
  
  // Role-specific menu items
  const managerMenuItems = [
    ...(isManager || isHR ? [{
      href: "/manager",
      icon: "supervisor_account",
      label: t('nav.manager'),
      active: location === "/manager"
    }] : []),
    ...(isManager || isHR ? [{
      href: "/attestation",
      icon: "fact_check",
      label: t('nav.attestation'),
      active: location === "/attestation"
    }] : []),
    ...(canAccessPayrollExport ? [{
      href: "/paxml-export",
      icon: "file_download",
      label: t('nav.payrollExport'),
      active: location === "/paxml-export"
    }] : [])
  ];

  // HR-specific items - REMOVED HR Översikt as it has no corresponding page
  const hrMenuItems: any[] = [];

  // Payroll-specific items  
  const payrollMenuItems = (isPayrollAdmin || isPayrollManager) ? [
    {
      href: "/payroll-dashboard", 
      icon: "account_balance_wallet",
      label: "Löneoversikt",
      active: location === "/payroll-dashboard"
    }
  ] : [];
  
  const travelExpensesMenuItem = {
    href: "#",
    icon: "receipt_long",
    label: t('nav.expenses'),
    active: false,
    disabled: true
  };
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md z-10">
      <div className="flex flex-col p-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-2">
            <span className="material-icons text-white text-sm">business</span>
          </div>
          <span className="font-bold text-sidebar-foreground">Kontek Tid</span>
        </div>
        <div className="mt-3">
          <span className="text-xs font-medium text-muted-foreground">Demo-läge aktivt</span>
        </div>
      </div>
      
      <nav className="flex-grow mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sidebar-foreground",
                  item.active && "text-primary border-l-4 border-primary"
                )}
              >
                <span className="material-icons mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
          
          {/* Role-specific sections */}
          {canAccessManagerFunctions && (managerMenuItems.length > 0 || hrMenuItems.length > 0 || payrollMenuItems.length > 0) && (
            <>
              <li className="border-t mt-2 pt-2 border-sidebar-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  {isHR || isHRManager ? 'HR-funktioner' : (isPayrollAdmin || isPayrollManager) ? 'Lönefunktioner' : t('nav.managerFunctions')}
                </div>
              </li>
              
              {/* Manager/HR functions */}
              {managerMenuItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground",
                      item.active && "text-primary border-l-4 border-primary"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
              
              {/* HR-specific functions */}
              {hrMenuItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground",
                      item.active && "text-primary border-l-4 border-primary"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
              
              {/* Payroll-specific functions */}
              {payrollMenuItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground",
                      item.active && "text-primary border-l-4 border-primary"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </>
          )}
          
          {/* Travel & Expenses - Feature flagged */}
          {showTravelExpenses && (
            <li className={cn(travelExpensesMenuItem.disabled && "opacity-50")}>
              <a
                href={travelExpensesMenuItem.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sidebar-foreground",
                  travelExpensesMenuItem.active && "text-primary border-l-4 border-primary"
                )}
                onClick={(e) => travelExpensesMenuItem.disabled && e.preventDefault()}
              >
                <span className="material-icons mr-3">{travelExpensesMenuItem.icon}</span>
                {travelExpensesMenuItem.label}
              </a>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {/* Demo Persona Switcher */}
        <div className="mb-3">
          <UserSwitcher />
        </div>
        
        <div className="flex items-center">
          <button className="flex items-center text-sm text-secondary-light">
            <span className="material-icons mr-2">translate</span>
            Svenska
          </button>
          <div className="border-l mx-3 h-6 border-sidebar-border"></div>
          <button className="flex items-center text-sm text-secondary-light">
            <span className="material-icons mr-2">logout</span>
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
