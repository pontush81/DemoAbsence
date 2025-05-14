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
import { useEffect } from "react";
import { useStore } from "./lib/store";

function Router() {
  const { setCurrentRoute } = useStore();
  
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
        <Route path="/leave" component={Leave} />
        <Route path="/payslips" component={Payslips} />
        <Route path="/settings" component={Settings} />
        <Route path="/manager" component={Manager} />
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
