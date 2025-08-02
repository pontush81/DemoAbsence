import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";
import AppShell from "./components/layout/app-shell";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Deviations from "@/pages/deviations";
import Leave from "@/pages/leave";
import Settings from "@/pages/settings";
import Payslips from "@/pages/payslips";
import Manager from "@/pages/manager";
import Attestation from "@/pages/attestation";
import PAXMLExportPage from "@/pages/paxml-export";
import SchedulesPage from "@/pages/schedules";
import PayrollDashboard from "@/pages/payroll-dashboard";
import { useEffect } from "react";
import { useStore } from "./lib/store";
import { useDemoInitialization } from "./hooks/use-demo-initialization";

function Router() {
  const { setCurrentRoute } = useStore();
  
  // Initiera demosystemet
  useDemoInitialization();
  
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(window.location.pathname);
    };
    
    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [setCurrentRoute]);
  
  return (
    <AppShell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/deviations/:id?" component={Deviations} />
        <Route path="/leave/new" component={Leave} />
        <Route path="/leave/edit/:id" component={Leave} />
        <Route path="/leave/:id" component={Leave} />
        <Route path="/leave" component={Leave} />
        <Route path="/payslips" component={Payslips} />
        <Route path="/settings" component={Settings} />
        <Route path="/manager" component={Manager} />
        <Route path="/attestation" component={Attestation} />
        <Route path="/paxml-export" component={PAXMLExportPage} />
        <Route path="/schedules" component={SchedulesPage} />
        <Route path="/payroll-dashboard" component={PayrollDashboard} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
