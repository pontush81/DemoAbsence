import React from "react";
import { useQuery } from "@tanstack/react-query";
import PAXMLExport from "@/components/paxml/paxml-export";
import { apiService } from "@/lib/apiService";
import { useStore } from "@/lib/store";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PAXMLExportPage() {
  const { user } = useStore();
  
  // Kontrollera behörighet - endast payroll och HR har tillgång
  const hasAccess = ['payroll', 'hr'].includes(user.currentRole);
  
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiService.getAllEmployees(user.currentUser?.employeeId),
    enabled: hasAccess, // Ladda endast data om användaren har behörighet
  });

  const { data: deviations = [], isLoading: deviationsLoading } = useQuery({
    queryKey: ['/api/deviations'],
    queryFn: () => apiService.getAllDeviations(),
    enabled: hasAccess, // Ladda endast data om användaren har behörighet
  });

  // Visa åtkomstnekat om användaren inte har behörighet
  if (!hasAccess) {
    return (
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">PAXML Export</h1>
            <p className="text-muted-foreground">Exportera godkända avvikelser till PAXML-format</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <span className="material-icons mr-2">block</span>
          <AlertDescription>
            Du har inte behörighet att komma åt PAXML-export. Denna funktion är endast tillgänglig för löneadministratörer och HR-personal.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  if (employeesLoading || deviationsLoading) {
    return (
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">PAXML Export</h1>
            <p className="text-muted-foreground">Exportera godkända avvikelser till PAXML-format</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <span className="material-icons animate-spin mr-2">refresh</span>
          Laddar data...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">PAXML Export</h1>
          <p className="text-muted-foreground">Exportera godkända avvikelser till PAXML-format för import i Kontek Lön</p>
        </div>
      </div>
      
      <PAXMLExport employees={employees} deviations={deviations} />
    </section>
  );
}
