'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import { Deviation, Employee } from '../types';

export default function Dashboard() {
  const router = useRouter();
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deviationsData = await import('../../data/deviations.json');
        const employeesData = await import('../../data/employees.json');

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

  const getStatusCounts = () => {
    const counts = {
      draft: deviations.filter(d => d.status === 'draft').length,
      pending: deviations.filter(d => d.status === 'pending').length,
      approved: deviations.filter(d => d.status === 'approved').length,
      rejected: deviations.filter(d => d.status === 'rejected').length,
    };
    return counts;
  };

  const getRecentDeviations = () => {
    return deviations
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const statusCounts = getStatusCounts();
  const recentDeviations = getRecentDeviations();

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

  if (error) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Översikt över avvikelser och frånvaro
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ScheduleIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="h6">Utkast</Typography>
                </Box>
                <Typography variant="h3" color="text.secondary">
                  {statusCounts.draft}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ej inskickade
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Väntar</Typography>
                </Box>
                <Typography variant="h3" color="warning.main">
                  {statusCounts.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Väntar på godkännande
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Godkända</Typography>
                </Box>
                <Typography variant="h3" color="success.main">
                  {statusCounts.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Redo för export
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avvisade</Typography>
                </Box>
                <Typography variant="h3" color="error.main">
                  {statusCounts.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Behöver åtgärdas
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: { xs: 1, md: 2 } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Senaste avvikelser
                </Typography>
                {recentDeviations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Inga avvikelser registrerade än.
                  </Typography>
                ) : (
                  <Box>
                    {recentDeviations.map((deviation) => {
                      const employee = employees.find(e => e.employeeId === deviation.employeeId);
                      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : deviation.employeeId;
                      
                      return (
                        <Box
                          key={deviation.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 1,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Box>
                            <Typography variant="body1">
                              {employeeName} - {deviation.timeCode}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(deviation.date).toLocaleDateString('sv-SE')}
                            </Typography>
                          </Box>
                          <Chip
                            label={deviation.status === 'approved' ? 'Godkänd' : 
                                   deviation.status === 'pending' ? 'Väntar' :
                                   deviation.status === 'rejected' ? 'Avvisad' :
                                   deviation.status === 'draft' ? 'Utkast' : deviation.status}
                            color={deviation.status === 'approved' ? 'success' : 
                                   deviation.status === 'pending' ? 'warning' :
                                   deviation.status === 'rejected' ? 'error' : 'default'}
                            size="small"
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Snabbåtgärder
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/deviations')}
                    fullWidth
                  >
                    Registrera avvikelse
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<AssessmentIcon />}
                    onClick={() => router.push('/deviations')}
                    fullWidth
                  >
                    Hantera avvikelser
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => router.push('/export')}
                    fullWidth
                    disabled={statusCounts.approved === 0}
                  >
                    Exportera PAXML
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Layout>
  );
}
