import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useFeatureFlags } from "@/lib/featureFlags";
import { useStore } from "@/lib/store";

const Sidebar = () => {
  const [location] = useLocation();
  const { t } = useI18n();
  const { isFeatureEnabled } = useFeatureFlags();
  const { user } = useStore();
  
  const showTravelExpenses = isFeatureEnabled('enableTravelExpenses');
  const isManager = user.currentRole === 'manager';
  
  const menuItems = [
    {
      href: "/",
      icon: "dashboard",
      label: t('nav.dashboard'),
      active: location === "/"
    },
    {
      href: "/deviations",
      icon: "event_note",
      label: t('nav.deviations'),
      active: location.startsWith("/deviations")
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
  
  const managerMenuItem = {
    href: "/manager",
    icon: "supervisor_account",
    label: t('nav.manager'),
    active: location === "/manager"
  };
  
  const travelExpensesMenuItem = {
    href: "#",
    icon: "receipt_long",
    label: t('nav.expenses'),
    active: false,
    disabled: true
  };
  
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-sidebar shadow-md z-10">
      <div className="flex items-center p-4 border-b border-sidebar-border">
        <img 
          src="https://pixabay.com/get/g71147032ef23548394939a9177a80ee6c469d108bf2fef71f6aae5036927c5fe34037a517d978a8abd60877a73f2bf4b4a26e41fa877986bf2d3cc41ff44950a_1280.jpg" 
          alt="Kontek Lön Logo" 
          className="h-8"
        />
        <span className="font-bold ml-2 text-sidebar-foreground">Kontek Lön</span>
      </div>
      
      <nav className="flex-grow mt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 hover:bg-sidebar-accent text-sidebar-foreground",
                    item.active && "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                  )}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
          
          {/* Manager section */}
          {isManager && (
            <li className="border-t mt-2 pt-2 border-sidebar-border">
              <Link href={managerMenuItem.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 hover:bg-sidebar-accent",
                    managerMenuItem.active && "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                  )}
                >
                  <span className="material-icons mr-3">{managerMenuItem.icon}</span>
                  {managerMenuItem.label}
                </a>
              </Link>
            </li>
          )}
          
          {/* Travel & Expenses - Feature flagged */}
          {showTravelExpenses && (
            <li className={cn(travelExpensesMenuItem.disabled && "opacity-50")}>
              <a
                href={travelExpensesMenuItem.href}
                className={cn(
                  "flex items-center px-4 py-3 hover:bg-sidebar-accent",
                  travelExpensesMenuItem.active && "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
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
      
      <div className="p-4 border-t border-sidebar-border">
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
