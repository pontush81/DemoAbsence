'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Deviation, Employee, TimeCode } from '../types';

interface DeviationListProps {
  deviations: Deviation[];
  employees: Employee[];
  timeCodes: TimeCode[];
  onEdit?: (deviation: Deviation) => void;
  onView?: (deviation: Deviation) => void;
  onDelete?: (deviation: Deviation) => void;
}

const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    case 'returned':
      return 'info';
    case 'draft':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Godkänd';
    case 'pending':
      return 'Väntar';
    case 'rejected':
      return 'Avvisad';
    case 'returned':
      return 'Returnerad';
    case 'draft':
      return 'Utkast';
    default:
      return status;
  }
};

export default function DeviationList({
  deviations,
  employees,
  timeCodes,
  onEdit,
  onView,
  onDelete,
}: DeviationListProps) {
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.employeeId === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : employeeId;
  };

  const getTimeCodeName = (code: string) => {
    const timeCode = timeCodes.find(tc => tc.code === code);
    return timeCode ? `${code} - ${timeCode.nameSV}` : code;
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return (diffMs / (1000 * 60 * 60)).toFixed(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (deviations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inga avvikelser
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Det finns inga registrerade avvikelser att visa.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Avvikelser ({deviations.length})
        </Typography>
        
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                <TableCell>Anställd</TableCell>
                <TableCell>Tidkod</TableCell>
                <TableCell>Tid</TableCell>
                <TableCell>Timmar</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Kommentar</TableCell>
                <TableCell align="right">Åtgärder</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deviations.map((deviation) => (
                <TableRow key={deviation.id} hover>
                  <TableCell>
                    {formatDate(deviation.date)}
                  </TableCell>
                  <TableCell>
                    {getEmployeeName(deviation.employeeId)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={getTimeCodeName(deviation.timeCode)}>
                      <span>{deviation.timeCode}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {deviation.startTime.slice(0, 5)} - {deviation.endTime.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    {calculateHours(deviation.startTime, deviation.endTime)}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(deviation.status)}
                      color={getStatusColor(deviation.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={deviation.comment || 'Ingen kommentar'}>
                      <span>
                        {deviation.comment 
                          ? deviation.comment.length > 30 
                            ? `${deviation.comment.slice(0, 30)}...`
                            : deviation.comment
                          : '-'
                        }
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {onView && (
                        <Tooltip title="Visa detaljer">
                          <IconButton
                            size="small"
                            onClick={() => onView(deviation)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onEdit && deviation.status === 'draft' && (
                        <Tooltip title="Redigera">
                          <IconButton
                            size="small"
                            onClick={() => onEdit(deviation)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && deviation.status === 'draft' && (
                        <Tooltip title="Ta bort">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onDelete(deviation)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
