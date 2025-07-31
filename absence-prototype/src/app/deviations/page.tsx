'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import DeviationForm from '../../components/DeviationForm';
import DeviationList from '../../components/DeviationList';
import { Deviation, Employee, TimeCode } from '../../types';
import deviationsData from '../../../data/deviations.json';
import employeesData from '../../../data/employees.json';
import timeCodesData from '../../../data/timecodes.json';

export default function DeviationsPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeCodes, setTimeCodes] = useState<TimeCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeviation, setEditingDeviation] = useState<Deviation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    timeCode: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDeviations(deviationsData as unknown as Deviation[]);
      setEmployees(employeesData as unknown as Employee[]);
      setTimeCodes(timeCodesData as unknown as TimeCode[]);
    } catch (err) {
      setError('Kunde inte ladda data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeviation = async (deviationData: Partial<Deviation>) => {
    try {
      const method = editingDeviation ? 'PUT' : 'POST';
      const url = editingDeviation 
        ? `/api/deviations/${editingDeviation.id}`
        : '/api/deviations';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...deviationData,
          id: editingDeviation?.id,
          status: editingDeviation?.status || 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save deviation');
      }

      await fetchData();
      setShowForm(false);
      setEditingDeviation(null);
    } catch (err) {
      setError('Kunde inte spara avvikelse');
    }
  };

  const handleEditDeviation = (deviation: Deviation) => {
    setEditingDeviation(deviation);
    setShowForm(true);
  };

  const handleDeleteDeviation = async (deviation: Deviation) => {
    if (!confirm('Är du säker på att du vill ta bort denna avvikelse?')) {
      return;
    }

    try {
      const response = await fetch(`/api/deviations/${deviation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deviation');
      }

      await fetchData();
    } catch (err) {
      setError('Kunde inte ta bort avvikelse');
    }
  };

  const handleViewDeviation = (deviation: Deviation) => {
    setEditingDeviation(deviation);
    setShowForm(true);
  };

  const getFilteredDeviations = () => {
    return deviations.filter(deviation => {
      if (filters.employeeId && deviation.employeeId !== filters.employeeId) {
        return false;
      }
      if (filters.status && deviation.status !== filters.status) {
        return false;
      }
      if (filters.timeCode && deviation.timeCode !== filters.timeCode) {
        return false;
      }
      return true;
    });
  };

  const filteredDeviations = getFilteredDeviations();

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Avvikelser
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Hantera frånvaro och avvikelser
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(true)}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingDeviation(null);
                setShowForm(true);
              }}
            >
              Ny avvikelse
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <DeviationList
          deviations={filteredDeviations}
          employees={employees}
          timeCodes={timeCodes}
          onEdit={handleEditDeviation}
          onView={handleViewDeviation}
          onDelete={handleDeleteDeviation}
        />

        <Dialog
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingDeviation(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingDeviation ? 'Redigera avvikelse' : 'Registrera ny avvikelse'}
          </DialogTitle>
          <DialogContent>
            <DeviationForm
              onSubmit={handleSubmitDeviation}
              onCancel={() => {
                setShowForm(false);
                setEditingDeviation(null);
              }}
              initialData={editingDeviation || undefined}
              employees={employees}
              timeCodes={timeCodes}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={showFilters}
          onClose={() => setShowFilters(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Filtrera avvikelser</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Anställd</InputLabel>
                <Select
                  value={filters.employeeId}
                  label="Anställd"
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                >
                  <MenuItem value="">Alla anställda</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.employeeId} value={employee.employeeId}>
                      {employee.firstName} {employee.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">Alla statusar</MenuItem>
                  <MenuItem value="draft">Utkast</MenuItem>
                  <MenuItem value="pending">Väntar</MenuItem>
                  <MenuItem value="approved">Godkänd</MenuItem>
                  <MenuItem value="rejected">Avvisad</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Tidkod</InputLabel>
                <Select
                  value={filters.timeCode}
                  label="Tidkod"
                  onChange={(e) => setFilters({ ...filters, timeCode: e.target.value })}
                >
                  <MenuItem value="">Alla tidkoder</MenuItem>
                  {timeCodes.map((timeCode) => (
                    <MenuItem key={timeCode.code} value={timeCode.code}>
                      {timeCode.code} - {timeCode.nameSV}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilters({ employeeId: '', status: '', timeCode: '' })}>
              Rensa
            </Button>
            <Button onClick={() => setShowFilters(false)} variant="contained">
              Stäng
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
}
