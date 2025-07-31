import React from "react";
import { useQuery } from "@tanstack/react-query";
import PAXMLExport from "@/components/paxml/paxml-export";
import { apiService } from "@/lib/apiService";

export default function PAXMLExportPage() {
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    queryFn: () => apiService.getAllEmployees(),
  });

  const { data: deviations = [], isLoading: deviationsLoading } = useQuery({
    queryKey: ['/api/deviations'],
    queryFn: () => apiService.getAllDeviations(),
  });

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
