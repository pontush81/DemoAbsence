'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sv } from 'date-fns/locale/sv';
import { Employee, TimeCode, Deviation } from '../types';

interface DeviationFormProps {
  onSubmit: (deviation: Partial<Deviation>) => void;
  onCancel: () => void;
  initialData?: Partial<Deviation>;
  employees: Employee[];
  timeCodes: TimeCode[];
}

export default function DeviationForm({
  onSubmit,
  onCancel,
  initialData,
  employees,
  timeCodes,
}: DeviationFormProps) {
  const [formData, setFormData] = useState({
    employeeId: initialData?.employeeId || '',
    date: initialData?.date ? new Date(initialData.date) : new Date(),
    startTime: initialData?.startTime ? new Date(`1970-01-01T${initialData.startTime}`) : new Date(),
    endTime: initialData?.endTime ? new Date(`1970-01-01T${initialData.endTime}`) : new Date(),
    timeCode: initialData?.timeCode || '',
    comment: initialData?.comment || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Anställd måste väljas';
    }
    if (!formData.timeCode) {
      newErrors.timeCode = 'Tidkod måste väljas';
    }
    if (formData.startTime >= formData.endTime) {
      newErrors.time = 'Sluttid måste vara efter starttid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formatTime = (date: Date) => {
      return date.toTimeString().slice(0, 8);
    };

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    onSubmit({
      employeeId: formData.employeeId,
      date: formatDate(formData.date),
      startTime: formatTime(formData.startTime),
      endTime: formatTime(formData.endTime),
      timeCode: formData.timeCode,
      comment: formData.comment,
    });
  };

  const selectedEmployee = employees.find(e => e.employeeId === formData.employeeId);
  const selectedTimeCode = timeCodes.find(tc => tc.code === formData.timeCode);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {initialData ? 'Redigera avvikelse' : 'Registrera ny avvikelse'}
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                <FormControl fullWidth error={!!errors.employeeId}>
                  <InputLabel>Anställd</InputLabel>
                  <Select
                    value={formData.employeeId}
                    label="Anställd"
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.employeeId} value={employee.employeeId}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.employeeId && (
                    <Typography variant="caption" color="error">
                      {errors.employeeId}
                    </Typography>
                  )}
                </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                <DatePicker
                  label="Datum"
                  value={formData.date}
                  onChange={(newValue) => newValue && setFormData({ ...formData, date: newValue })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <TimePicker
                    label="Starttid"
                    value={formData.startTime}
                    onChange={(newValue) => newValue && setFormData({ ...formData, startTime: newValue })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <TimePicker
                    label="Sluttid"
                    value={formData.endTime}
                    onChange={(newValue) => newValue && setFormData({ ...formData, endTime: newValue })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <FormControl fullWidth error={!!errors.timeCode}>
                  <InputLabel>Tidkod</InputLabel>
                  <Select
                    value={formData.timeCode}
                    label="Tidkod"
                    onChange={(e) => setFormData({ ...formData, timeCode: e.target.value })}
                  >
                    {timeCodes.map((timeCode) => (
                      <MenuItem key={timeCode.code} value={timeCode.code}>
                        {timeCode.code} - {timeCode.nameSV}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.timeCode && (
                    <Typography variant="caption" color="error">
                      {errors.timeCode}
                    </Typography>
                  )}
                </FormControl>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Kommentar"
                  multiline
                  rows={3}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Ange en kommentar för avvikelsen..."
                />
              </Box>

              {errors.time && (
                <Box>
                  <Alert severity="error">{errors.time}</Alert>
                </Box>
              )}

              {selectedTimeCode?.requiresApproval && (
                <Box>
                  <Alert severity="info">
                    Denna tidkod kräver godkännande från chef.
                  </Alert>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                {initialData ? 'Uppdatera' : 'Registrera'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={onCancel}
              >
                Avbryt
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}
