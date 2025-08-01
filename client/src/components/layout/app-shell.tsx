import { ReactNode } from "react";
import { useDemoInitialization } from '@/hooks/use-demo-initialization';
import MobileHeader from "./mobile-header";
import MobileSidebar from "./mobile-sidebar";
import Sidebar from "./sidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  // Initialize demo system
  useDemoInitialization();
  
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
