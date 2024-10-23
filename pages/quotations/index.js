import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  TextField,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Pagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import { TableRows, GridView, MoreVert, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@mui/material/styles';
import LottieLoader from '@/components/LottieLoader';
import QuotationCard from '@/components/QuotationCard';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import 'moment/locale/es';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import QuotationDetailsModal from '/components/QuotationDetailsModal';


moment.locale('es');

export default function QuotationsPage() {
  const { data: session, status } = useSession();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [updatedQuotationIds, setUpdatedQuotationIds] = useState([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const rowsPerPage = 10;
  const { collapsed } = useSidebarContext();
  const theme = useTheme();
  const router = useRouter();
  const showNotification = useNotification();
  const quotationRefs = useRef({});
  const containerRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderBy, setOrderBy] = useState('quotation_id');
  const [order, setOrder] = useState('desc');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const handleViewDetails = useCallback((quotationId) => {
    setSelectedQuotationId(quotationId);
    setDetailsModalOpen(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setDetailsModalOpen(false);
    setSelectedQuotationId(null);
  }, []);

  const formatUF = (value) => {
    return Number(value).toFixed(2);
  };

  const fetchQuotations = useCallback(async () => {
    if (!session?.user?.id || !session?.user?.organization?._id) return;

    setIsRefetching(true);
    try {
      const response = await fetch(`/api/quotations?userId=${session.user.id}&organizationId=${session.user.organization._id}&page=${page}&limit=${rowsPerPage}`);
      const data = await response.json();
      if (data.success) {
        setQuotations(data.data);
        setTotalPages(Math.ceil(data.total / rowsPerPage));
      } else {
        console.error('Error fetching quotations:', data);
        showNotification('Error al cargar las cotizaciones', 'error');
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showNotification('Error al cargar las cotizaciones', 'error');
    }
    setIsRefetching(false);
    setLoading(false);
  }, [session, page, rowsPerPage, showNotification]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchQuotations();
    }
  }, [status, fetchQuotations]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredQuotations = useMemo(() => quotations.filter(quotation => {
    const query = searchQuery.toLowerCase();
    const searchableFields = [
      quotation.quotation_id?.toString(),
      quotation.client?.first_name?.toLowerCase(),
      quotation.client?.last_name?.toLowerCase(),
      quotation.client?.rut?.toLowerCase(),
      quotation.project?.name?.toLowerCase(),
      quotation.project?.county_name?.toLowerCase(),
      quotation.stock?.apartment?.toString(),
      quotation.unit_value?.value?.toString(),
      quotation.financing_amount?.value?.toString(),
      quotation.estimated_dividend?.value?.toString(),
      moment(quotation.quotation_date).format('DD/MM/YYYY'),
      quotation.real_estate_company_name?.toLowerCase(),
      formatUF(quotation.unit_value?.value),
      formatUF(quotation.financing_amount?.value),
      formatUF(quotation.estimated_dividend?.value)
    ];

    return searchableFields.some(field => field?.includes(query));
  }), [quotations, searchQuery]);

  const sortedQuotations = useMemo(() => {
    const comparator = (a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      // Manejar propiedades anidadas
      if (orderBy.includes('.')) {
        const props = orderBy.split('.');
        aValue = props.reduce((obj, prop) => obj?.[prop], a);
        bValue = props.reduce((obj, prop) => obj?.[prop], b);
      }

      // Convertir a minúsculas si son strings para una comparación insensible a mayúsculas
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (bValue < aValue) {
        return order === 'asc' ? 1 : -1;
      }
      if (bValue > aValue) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    };
    
    return [...filteredQuotations].sort(comparator);
  }, [filteredQuotations, order, orderBy]);

  const handleMenuClick = useCallback((event, quotation) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuotation(quotation);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedQuotation(null);
  }, []);

  const handleEdit = useCallback(() => {
    router.push(`/quotations/${selectedQuotation._id}/edit`);
    handleMenuClose();
  }, [selectedQuotation, handleMenuClose, router]);

  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuotation) return;

    try {
      const response = await fetch(`/api/quotations?id=${selectedQuotation._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setQuotations(prevQuotations => prevQuotations.filter(q => q._id !== selectedQuotation._id));
        showNotification('Cotización eliminada con éxito', 'success');
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
  }, [selectedQuotation, showNotification]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedQuotation(null);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <LottieLoader message="Cargando..." />
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxWidth: 1200, mx: 'auto', mt: 0, mb: 0, p: 4, pb: 0, display: 'flex', flexDirection: 'column', height: '96vh', position: 'relative' }}>
      <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">Cotizaciones</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <TextField
            variant="outlined"
            placeholder="Búsqueda rápida"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2, flex: 1, mr: 2, height: 40 }}
            InputProps={{
              style: { fontSize: '0.875rem', height: '2.5rem' },
            }}
            helperText={`${filteredQuotations.length} de ${quotations.length} cotizaciones encontradas`}
          />
          <Box>
            <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'grid' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
              <GridView />
            </IconButton>
            <IconButton onClick={() => setViewMode('table')} color={viewMode === 'table' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'table' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
              <TableRows />
            </IconButton>
          </Box>
        </Box>
        {isRefetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LottieLoader message="Actualizando..." />
          </Box>
        )}
        {viewMode === 'grid' ? (
          <Grid container spacing={4}>
            {sortedQuotations.slice(0, sortedQuotations.length).map(quotation => (
              <Grid item key={quotation._id} xs={12} sm={6} md={4}>
                <QuotationCard
                  ref={el => quotationRefs.current[quotation._id] = el}
                  quotation={quotation}
                  updatedQuotationIds={updatedQuotationIds}
                  isUpdated={updatedQuotationIds.includes(quotation._id)}
                  onDelete={handleMenuClick}
                  onViewDetails={() => handleViewDetails(quotation._id)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'quotation_id'}
                        direction={orderBy === 'quotation_id' ? order : 'asc'}
                        onClick={() => handleRequestSort('quotation_id')}
                      >
                        Cotización
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'quotation_date'}
                        direction={orderBy === 'quotation_date' ? order : 'asc'}
                        onClick={() => handleRequestSort('quotation_date')}
                      >
                        Fecha
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'project?.name'}
                        direction={orderBy === 'project?.name' ? order : 'asc'}
                        onClick={() => handleRequestSort('project?.name')}
                      >
                        Proyecto
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'project?.county_name'}
                        direction={orderBy === 'project?.county_name' ? order : 'asc'}
                        onClick={() => handleRequestSort('project?.county_name')}
                      >
                        Comuna
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'stock.apartment'}
                        direction={orderBy === 'stock.apartment' ? order : 'asc'}
                        onClick={() => handleRequestSort('stock.apartment')}
                      >
                        Unidad
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'client?.last_name'}
                        direction={orderBy === 'client?.last_name' ? order : 'asc'}
                        onClick={() => handleRequestSort('client?.last_name')}
                      >
                        Cliente
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'unit_value.value'}
                        direction={orderBy === 'unit_value.value' ? order : 'asc'}
                        onClick={() => handleRequestSort('unit_value.value')}
                      >
                        Valor Unidad
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'financing_amount.value'}
                        direction={orderBy === 'financing_amount.value' ? order : 'asc'}
                        onClick={() => handleRequestSort('financing_amount.value')}
                      >
                        Hipotecario
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'estimated_dividend.value'}
                        direction={orderBy === 'estimated_dividend.value' ? order : 'asc'}
                        onClick={() => handleRequestSort('estimated_dividend.value')}
                      >
                        Dividendo
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Estacionamiento</TableCell>
                    <TableCell>Bodega</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedQuotations.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(quotation => (
                    <TableRow
                      key={quotation._id}
                      ref={el => quotationRefs.current[quotation._id] = el}
                      sx={{
                        backgroundColor: updatedQuotationIds.includes(quotation._id) ? 'rgba(0, 255, 0, 0.2)' : 'inherit',
                        transition: 'background-color 0.5s ease-in-out'
                      }}
                    >
                      <TableCell>{`#${quotation.quotation_id}`}</TableCell>
                      <TableCell>{moment(quotation.quotation_date).format('DD/MM/YYYY')}</TableCell>
                      <TableCell>{quotation.project?.name}</TableCell>
                      <TableCell>{quotation.project?.county_name || '-'}</TableCell>
                      <TableCell>{quotation.stock?.apartment}</TableCell>
                      <TableCell>{`${quotation.client?.first_name} ${quotation.client?.last_name}`}</TableCell>
                      <TableCell>{`${formatUF(quotation.unit_value.value)} ${quotation.unit_value.unit}`}</TableCell>
                      <TableCell>{`${formatUF(quotation.financing_amount.value)} ${quotation.financing_amount.unit}`}</TableCell>
                      <TableCell>{`${formatUF(quotation.estimated_dividend.value)} ${quotation.estimated_dividend.unit}`}</TableCell>
                      <TableCell>{quotation.parking ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{quotation.storage ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewDetails(quotation._id)}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          aria-label="more"
                          aria-controls="long-menu"
                          aria-haspopup="true"
                          onClick={(e) => handleMenuClick(e, quotation)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            borderRadius: '8px',
            boxShadow: 'none',
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
            Editar cotización
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
            Eliminar
          </ListItemText>
        </MenuItem>
      </Menu>
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"¿Confirmar eliminación?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar esta cotización? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      <QuotationDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        quotationId={selectedQuotationId}
        organizationId={session?.user?.organization?._id}
        userId={session?.user?.id}
      />
    </Box>
  );
}