import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useFeatureFlags } from "@/lib/featureFlags";
import { useStore } from "@/lib/store";

const MobileSidebar = () => {
  const { t } = useI18n();
  const { isFeatureEnabled } = useFeatureFlags();
  const { user, navigation, setMobileSidebarOpen } = useStore();
  
  const currentRoute = navigation.currentRoute;
  const showTravelExpenses = isFeatureEnabled('enableTravelExpenses');
  const isManager = user.currentRole === 'manager';
  
  const closeSidebar = () => {
    setMobileSidebarOpen(false);
  };
  
  const menuItems = [
    {
      href: "/",
      icon: "dashboard",
      label: t('nav.dashboard'),
      active: currentRoute === "/"
    },
    {
      href: "/deviations",
      icon: "event_note",
      label: t('nav.deviations'),
      active: currentRoute.startsWith("/deviations")
    },
    {
      href: "/leave",
      icon: "free_cancellation",
      label: t('nav.leave'),
      active: currentRoute === "/leave"
    },
    {
      href: "/payslips",
      icon: "receipt",
      label: t('nav.payslips'),
      active: currentRoute === "/payslips"
    },
    {
      href: "/schedules",
      icon: "schedule",
      label: t('nav.schedules'),
      active: currentRoute === "/schedules"
    },
    {
      href: "/settings",
      icon: "settings",
      label: t('nav.settings'),
      active: currentRoute === "/settings"
    }
  ];
  
  const managerMenuItems = [
    {
      href: "/manager",
      icon: "supervisor_account",
      label: t('nav.manager'),
      active: currentRoute === "/manager"
    },
    {
      href: "/attestation",
      icon: "fact_check",
      label: t('nav.attestation'),
      active: currentRoute === "/attestation"
    },
    {
      href: "/paxml-export",
      icon: "file_download",
      label: t('nav.payrollExport'),
      active: currentRoute === "/paxml-export"
    }
  ];
  
  const travelExpensesMenuItem = {
    href: "#",
    icon: "receipt_long",
    label: t('nav.expenses'),
    active: false,
    disabled: true
  };
  
  return (
    <>
      {/* Overlay when sidebar is open */}
      {navigation.isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Mobile Sidebar */}
      <aside 
        id="mobile-sidebar" 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden",
          navigation.isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary rounded flex items-center justify-center mr-2">
            <span className="material-icons text-white text-sm">business</span>
          </div>
          <span className="font-bold text-sidebar-foreground">Kontek Tid</span>
        </div>
        <button 
          id="close-sidebar" 
          className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={closeSidebar}
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <nav className="mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sidebar-foreground",
                  item.active && "text-primary border-l-4 border-primary"
                )}
                onClick={closeSidebar}
              >
                <span className="material-icons mr-3">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
          
          {/* Manager section */}
          {isManager && (
            <>
              <li className="border-t mt-2 pt-2 border-sidebar-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                  {t('nav.managerFunctions')}
                </div>
              </li>
              {managerMenuItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sidebar-foreground",
                      item.active && "text-primary border-l-4 border-primary"
                    )}
                    onClick={closeSidebar}
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
                onClick={(e) => {
                  if (travelExpensesMenuItem.disabled) {
                    e.preventDefault();
                  } else {
                    closeSidebar();
                  }
                }}
              >
                <span className="material-icons mr-3">{travelExpensesMenuItem.icon}</span>
                {travelExpensesMenuItem.label}
              </a>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
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
    </>
  );
};

export default MobileSidebar;
