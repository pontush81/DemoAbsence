'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sv } from 'date-fns/locale/sv';
import { Employee, Deviation } from '../types';

interface PAXMLExportProps {
  employees: Employee[];
  deviations: Deviation[];
}

export default function PAXMLExport({ employees, deviations }: PAXMLExportProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    filename?: string;
  } | null>(null);

  const approvedDeviations = deviations.filter(d => d.status === 'approved');
  
  const getFilteredDeviations = () => {
    let filtered = approvedDeviations;
    
    if (selectedEmployees.length > 0) {
      filtered = filtered.filter(d => selectedEmployees.includes(d.employeeId));
    }
    
    if (startDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      filtered = filtered.filter(d => d.date >= startDateStr);
    }
    
    if (endDate) {
      const endDateStr = endDate.toISOString().split('T')[0];
      filtered = filtered.filter(d => d.date <= endDateStr);
    }
    
    return filtered;
  };

  const filteredDeviations = getFilteredDeviations();

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const exportData = {
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
      };

      const response = await fetch('/api/paxml/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `paxml-export-${new Date().toISOString().split('T')[0]}.xml`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportResult({
          success: true,
          message: `PAXML-fil exporterad framgångsrikt (${filteredDeviations.length} transaktioner)`,
          filename,
        });
      } else {
        const errorData = await response.json();
        setExportResult({
          success: false,
          message: errorData.error || 'Export misslyckades',
        });
      }
    } catch {
      setExportResult({
        success: false,
        message: 'Ett fel uppstod vid export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Box sx={{ flex: { xs: 1, md: 2 } }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                PAXML Export
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Exportera godkända avvikelser till PAXML-format för import i Kontek Lön.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Anställda (valfritt)</InputLabel>
                    <Select
                      multiple
                      value={selectedEmployees}
                      onChange={(e) => setSelectedEmployees(e.target.value as string[])}
                      label="Anställda (valfritt)"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={getEmployeeName(value)}
                              size="small"
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee.employeeId} value={employee.employeeId}>
                          {employee.firstName} {employee.lastName} ({employee.employeeId})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Från datum (valfritt)"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="Till datum (valfritt)"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={isExporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                  onClick={handleExport}
                  disabled={isExporting || filteredDeviations.length === 0}
                  fullWidth
                >
                  {isExporting ? 'Exporterar...' : `Exportera PAXML (${filteredDeviations.length} transaktioner)`}
                </Button>
              </Box>

              {exportResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity={exportResult.success ? 'success' : 'error'}
                    icon={exportResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                  >
                    {exportResult.message}
                    {exportResult.filename && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Fil: {exportResult.filename}
                      </Typography>
                    )}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exportöversikt
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Totalt godkända avvikelser:
                </Typography>
                <Typography variant="h4" color="primary">
                  {approvedDeviations.length}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Kommer att exporteras:
                </Typography>
                <Typography variant="h4" color="success.main">
                  {filteredDeviations.length}
                </Typography>
              </Box>

              {filteredDeviations.length === 0 && approvedDeviations.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Inga avvikelser matchar de valda filtren.
                </Alert>
              )}

              {approvedDeviations.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Inga godkända avvikelser finns att exportera.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
