import React, { useState, useCallback, memo, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Tooltip,
  Box
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/es';
import { useNotification } from '@/context/NotificationContext';

moment.locale('es');

// Componente memo para la celda de fecha
const DateCell = memo(({ date }) => (
  <TableCell>
    <Tooltip title={moment(date).format('DD [de] MMMM [del] YYYY')}>
      <Box>
        <Typography variant="body2">
          {moment(date).format('DD/MM/YYYY')}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {moment(date).fromNow()}
        </Typography>
      </Box>
    </Tooltip>
  </TableCell>
));

// Componente memo para los botones de contacto
const ContactButtons = memo(({ quotation }) => {
  const showNotification = useNotification();
  const [copiedStates, setCopiedStates] = useState({});

  const handleCopy = useCallback(async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      
      setCopiedStates(prev => ({
        ...prev,
        [type]: true
      }));
      
      setTimeout(() => {
        setCopiedStates(prev => {
          const newState = { ...prev };
          delete newState[type];
          return newState;
        });
      }, 2000);
      
      showNotification(`${type === 'email' ? 'Correo' : 'Teléfono'} copiado`, 'success');
    } catch (err) {
      console.error('Error al copiar:', err);
      showNotification('Error al copiar al portapapeles', 'error');
    }
  }, [showNotification]);

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
      {quotation.client?.email && (
        <Tooltip title={copiedStates['email'] ? 'Copiado!' : quotation.client.email}>
          <IconButton
            size="small"
            onClick={() => handleCopy(quotation.client.email, 'email')}
            sx={{ 
              padding: 0.5,
              color: copiedStates['email'] ? 'success.main' : 'action.active'
            }}
          >
            {copiedStates['email'] ? 
              <CheckCircleIcon fontSize="small" /> : 
              <EmailIcon fontSize="small" />
            }
          </IconButton>
        </Tooltip>
      )}
      {quotation.client?.phone && (
        <Tooltip title={copiedStates['phone'] ? 'Copiado!' : quotation.client.phone}>
          <IconButton
            size="small"
            onClick={() => handleCopy(quotation.client.phone, 'phone')}
            sx={{ 
              padding: 0.5,
              color: copiedStates['phone'] ? 'success.main' : 'action.active'
            }}
          >
            {copiedStates['phone'] ? 
              <CheckCircleIcon fontSize="small" /> : 
              <PhoneIcon fontSize="small" />
            }
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
});

const QuotationTable = memo(({
  quotations,
  onDelete,
  onEdit,
  onView
}) => {
  const showNotification = useNotification();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [orderBy, setOrderBy] = useState('quotation_id');
  const [order, setOrder] = useState('desc');

  const formatUF = useCallback((value) => Number(value).toFixed(2), []);

  const handleRequestSort = useCallback((property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [order, orderBy]);

  const getSortValue = useCallback((quotation, field) => {
    switch (field) {
      case 'quotation_id':
        return quotation.quotation_id;
      case 'quotation_date':
        return new Date(quotation.quotation_date).getTime();
      case 'client':
        return `${quotation.client?.last_name} ${quotation.client?.first_name}`.toLowerCase();
      case 'project':
        return quotation.project?.name?.toLowerCase() || '';
      case 'unit_value':
        return quotation.unit_value.value;
      case 'financing_amount':
        return quotation.financing_amount.value;
      case 'estimated_dividend':
        return quotation.estimated_dividend.value;
      default:
        return quotation[field];
    }
  }, []);

  const sortedQuotations = useMemo(() => {
    return [...quotations].sort((a, b) => {
      const aValue = getSortValue(a, orderBy);
      const bValue = getSortValue(b, orderBy);
      
      if (order === 'desc') {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });
  }, [quotations, orderBy, order, getSortValue]);

  const handleDeleteClick = useCallback((quotation) => {
    setSelectedQuotation(quotation);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuotation) return;

    try {
      const response = await fetch(`/api/quotations?id=${selectedQuotation._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        showNotification('Cotización eliminada con éxito', 'success');
        onDelete(selectedQuotation._id);
      } else {
        throw new Error(data.message || 'Error al eliminar la cotización');
      }
    } catch (error) {
      console.error('Error al eliminar la cotización:', error);
      showNotification('Error al eliminar la cotización', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedQuotation(null);
    }
  }, [selectedQuotation, onDelete, showNotification]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedQuotation(null);
  }, []);

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>
                <TableSortLabel
                  active={orderBy === 'quotation_id'}
                  direction={orderBy === 'quotation_id' ? order : 'asc'}
                  onClick={() => handleRequestSort('quotation_id')}
                >
                  #
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>
                <TableSortLabel
                  active={orderBy === 'quotation_date'}
                  direction={orderBy === 'quotation_date' ? order : 'asc'}
                  onClick={() => handleRequestSort('quotation_date')}
                >
                  Fecha
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>
                <TableSortLabel
                  active={orderBy === 'client'}
                  direction={orderBy === 'client' ? order : 'asc'}
                  onClick={() => handleRequestSort('client')}
                >
                  Cliente
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <TableSortLabel
                  active={orderBy === 'project'}
                  direction={orderBy === 'project' ? order : 'asc'}
                  onClick={() => handleRequestSort('project')}
                >
                  Proyecto
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }} align="right">
                <TableSortLabel
                  active={orderBy === 'unit_value'}
                  direction={orderBy === 'unit_value' ? order : 'asc'}
                  onClick={() => handleRequestSort('unit_value')}
                >
                  Valor UF
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }} align="right">
                <TableSortLabel
                  active={orderBy === 'financing_amount'}
                  direction={orderBy === 'financing_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('financing_amount')}
                >
                  Hipotecario
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }} align="right">
                <TableSortLabel
                  active={orderBy === 'estimated_dividend'}
                  direction={orderBy === 'estimated_dividend' ? order : 'asc'}
                  onClick={() => handleRequestSort('estimated_dividend')}
                >
                  Dividendo
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedQuotations.map((quotation) => (
              <TableRow 
                key={quotation._id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <TableCell>
                  <Typography variant="body2">
                    {quotation.quotation_id}
                  </Typography>
                </TableCell>
                <DateCell date={quotation.quotation_date} />
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {`${quotation.client?.first_name} ${quotation.client?.last_name}`}
                  </Typography>
                  <ContactButtons quotation={quotation} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {quotation.project?.name || 'Sin proyecto'}
                  </Typography>
                  {quotation.stock?.apartment && (
                    <Typography variant="caption" color="textSecondary">
                      Unidad: {quotation.stock.apartment}
                    </Typography>
                  )}
                  {quotation.project?.county_name && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      {quotation.project.county_name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {`${formatUF(quotation.unit_value.value)} ${quotation.unit_value.unit}`}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {`${formatUF(quotation.financing_amount.value)} ${quotation.financing_amount.unit}`}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {`${formatUF(quotation.estimated_dividend.value)} ${quotation.estimated_dividend.unit}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => onView(quotation._id)} size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title="Editar">
                      <IconButton onClick={() => onEdit(quotation._id)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip> */}
                    <Tooltip title="Eliminar">
                      <IconButton 
                        onClick={() => handleDeleteClick(quotation)} 
                        size="small" 
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Confirmar eliminación?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

QuotationTable.displayName = 'QuotationTable';
ContactButtons.displayName = 'ContactButtons';
DateCell.displayName = 'DateCell';

export default QuotationTable;