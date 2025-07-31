'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import Layout from '../../components/Layout';
import PAXMLExport from '../../components/PAXMLExport';
import { Deviation, Employee } from '../../types';

export default function ExportPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deviationsData = await import('../../../data/deviations.json');
        const employeesData = await import('../../../data/employees.json');

        setDeviations(deviationsData.default as unknown as Deviation[]);
        setEmployees(employeesData.default as unknown as Employee[]);
      } catch (err) {
        setError('Kunde inte ladda data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          PAXML Export
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Exportera godkända avvikelser till PAXML-format för import i Kontek Lön
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <PAXMLExport employees={employees} deviations={deviations} />
      </Container>
    </Layout>
  );
}
