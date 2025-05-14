import { ReactNode, useEffect } from "react";
import { getCurrentEmployee } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import MobileHeader from "./mobile-header";
import MobileSidebar from "./mobile-sidebar";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const { setCurrentUser, setCurrentRole } = useStore();
  
  // Load the current user on mount (simulated with mock data)
  useEffect(() => {
    const currentEmployee = getCurrentEmployee();
    setCurrentUser(currentEmployee);
    setCurrentRole(currentEmployee.role as 'employee' | 'manager');
  }, [setCurrentUser, setCurrentRole]);
  
  return (
    <div id="app-shell" className="flex h-screen overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
