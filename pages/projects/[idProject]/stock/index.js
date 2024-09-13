'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  Pagination,
  Button,
  Collapse,
  CircularProgress,
  Avatar,
  Grid,
  Card,
  CardContent,
  TableSortLabel,
} from '@mui/material';
import { ExpandMore, ExpandLess, ChevronLeft, Edit, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material/styles';
import { NumberFormatter } from '@/utils/formatNumber';
import LottieLoader from '@/components/LottieLoader';
import QuotationDialog from '@/components/QuotationDialog';
import { useSession } from 'next-auth/react';
import PromptInput from '@/components/PromptInput'; // Importa el componente PromptInput
import fitty from 'fitty';
import InfoBox from '@/components/InfoBox';

export default function StockPage() {
  const router = useRouter();
  const { idProject } = router.query;
  const { data: session, status } = useSession();
  const [stock, setStock] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [updatedStockIds, setUpdatedStockIds] = useState([]);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('apartment');
  const rowsPerPage = 10;
  const theme = useTheme();
  const stockRefs = useRef({});
  const containerRef = useRef(null);
  const [openQuotationDialog, setOpenQuotationDialog] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [openCommercialConditions, setOpenCommercialConditions] = useState(true); // El botón empieza abierto

  useEffect(() => {
    if (status === 'authenticated') {
      if (idProject) {
        fetchProject();
        fetchStock();
      }
    }
  }, [idProject, status]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/details/${idProject}?organizationId=${session.user.organization._id}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.data);
      } else {
        console.error('Error fetching project details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
    setLoading(false);
  }

  async function fetchStock() {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${idProject}/stock?organizationId=${session.user.organization._id}`);
      const data = await response.json();
      if (data.success) {
        setStock(data.data);
      } else {
        setStock([]);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
    setLoading(false);
    setFirstLoad(false);
  }

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredStock = stock.filter(item =>
    item.apartment.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.typology.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.orientation.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.current_list_price.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.downpayment.toString().toLowerCase().includes(searchQuery.toLowerCase()) || // Cambio realizado aquí
    item.discount.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStock = filteredStock.sort((a, b) => {
    const valueA = a[orderBy] ? String(a[orderBy]) : '';
    const valueB = b[orderBy] ? String(b[orderBy]) : '';
  
    if (orderBy === 'apartment' || orderBy === 'typology' || orderBy === 'orientation') {
      return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else {
      return order === 'asc' ? a[orderBy] - b[orderBy] : b[orderBy] - a[orderBy];
    }
  });
  
  function toggleRowExpand(stockId) {
    setExpandedRow(expandedRow === stockId ? null : stockId);
  }

  return (
    <Box ref={containerRef} sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      {/* Botón para volver */}
      <Button onClick={() => router.push(`/projects`)} startIcon={<ChevronLeft />} variant="outlined" color="primary">
        Volver a Proyectos
      </Button>

      {/* Título del proyecto */}
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
        <Avatar
          src={project?.gallery?.[0] || '/images/fallback.jpg'}
          alt={project?.name}
          sx={{ width: 60, height: 60, mr: 2 }}
        />
        
        <Typography variant="h4" component="h1" color="primary">
          Stock del Proyecto <b>{project?.name}</b> - <small>{project?.realEstateCompanyName}</small>
        </Typography>
        
      </Box>

      {/* Cajas de información */}
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2}>

          {project?.downpayment && (
            <InfoBox title="Bono" value={project.downpayment + "%"} />
          )}

          {project?.deliveryDateDescr && (
            <InfoBox title="Fecha de Entrega" value={project.deliveryDateDescr} />
          )}

          {project?.deliveryType && (
            <InfoBox title="Tipo de Entrega" value={project.deliveryType} />
          )}

          {project?.downPaymentMethod && (
            <InfoBox title="Método de Pago" value={project.downPaymentMethod} />
          )}

          {project?.installments !== undefined && project?.installments !== null && (
            <InfoBox title="Cuotas" value={project.installments} hideIfZero={true} />
          )}

          {project?.promiseSignatureType && (
            <InfoBox title="Tipo de Firma de Promesa" value={project?.promiseSignatureType} />
          )}
          
          {project?.reservationValue && !isNaN(Number(project?.reservationValue)) && (
            <InfoBox 
              title="Valor Reserva" 
              value={NumberFormatter({ value: parseFloat(project?.reservationValue), unit: '$' })} 
            />
          )}

          {project?.county_name && (
            <InfoBox title="Comuna" value={project?.county_name} />
          )}

          {(project?.reservationInfo || project?.reservationInfo === '') && (
            <InfoBox
              title="Información de Reserva"
              value={
                project.reservationInfo.hyperlink && project.reservationInfo.hyperlink.trim() !== '' ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    href={
                      (() => {
                        const cleanLink = project.reservationInfo.hyperlink.replace(/['"]/g, '').trim(); // Elimina comillas dobles y simples
                        return cleanLink.startsWith('http') ? cleanLink : `https://${cleanLink}`;
                      })()
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'black', border: 'none', borderBottom: '1px solid #9AD850', borderRadius: '0rem' }}
                  >
                    Ir al sitio de pago
                  </Button>
                ) : (
                  project.reservationInfo.text
                )
              }
            />
          )}

        </Grid>
      </Box>

      {/* Condiciones comerciales */}
      <Box sx={{ mb: 2 }}>
        <Button
          onClick={() => setOpenCommercialConditions(!openCommercialConditions)}
          endIcon={openCommercialConditions ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          sx={{ textTransform: 'none' }}
        >
          <Typography variant="body2">CONDICIONES COMERCIALES</Typography>
        </Button>
        <Collapse in={openCommercialConditions}>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {project?.commercialConditions || 'No hay condiciones comerciales disponibles.'}
          </Typography>
        </Collapse>
      </Box>

      {/* Búsqueda rápida */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Búsqueda rápida"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          style: { fontSize: '0.875rem', height: '2.5rem' },
        }}
        helperText={`${filteredStock.length} de ${stock.length} unidades encontradas`}
      />

      {/* Tabla de stock */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'apartment'}
                  direction={orderBy === 'apartment' ? order : 'asc'}
                  onClick={() => handleRequestSort('apartment')}
                >
                  Unidad
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'typology'}
                  direction={orderBy === 'typology' ? order : 'asc'}
                  onClick={() => handleRequestSort('typology')}
                >
                  Tipología
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'orientation'}
                  direction={orderBy === 'orientation' ? order : 'asc'}
                  onClick={() => handleRequestSort('orientation')}
                >
                  Orientación
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'current_list_price'}
                  direction={orderBy === 'current_list_price' ? order : 'asc'}
                  onClick={() => handleRequestSort('current_list_price')}
                >
                  Precio
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'downpayment'} // Cambio realizado aquí
                  direction={orderBy === 'downpayment' ? order : 'asc'} // Cambio realizado aquí
                  onClick={() => handleRequestSort('downpayment')} // Cambio realizado aquí
                >
                  Bono {/* Cambio realizado aquí */}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'discount'}
                  direction={orderBy === 'discount' ? order : 'asc'}
                  onClick={() => handleRequestSort('discount')}
                >
                  Descuento
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === 'total_surface'}
                  direction={orderBy === 'total_surface' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_surface')}
                >
                  Superficie Total
                </TableSortLabel>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStock.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(item => (
              <React.Fragment key={item._id}>
                <TableRow
                  ref={el => (stockRefs.current[item._id] = el)}
                  sx={{
                    backgroundColor: updatedStockIds.includes(item._id) ? 'rgba(0, 255, 0, 0.2)' : 'inherit',
                    transition: 'background-color 0.5s ease-in-out',
                  }}
                >
                  <TableCell>{item.apartment}</TableCell>
                  <TableCell>{item.typology}</TableCell>
                  <TableCell>{item.orientation}</TableCell>
                  <TableCell align="center">
                    <NumberFormatter value={item.current_list_price} unit={'UF'} prependUnit={false} decimals={0} appendUnit={true} />
                  </TableCell>
                  <TableCell align="center">
                    <NumberFormatter value={item.downpayment} unit={'%'} prependUnit={false} decimals={0} appendUnit={true} /> {/* Cambio realizado aquí */}
                  </TableCell>
                  <TableCell align="center">
                    <NumberFormatter value={item.discount} unit={'%'} prependUnit={false} decimals={0} appendUnit={true} />
                  </TableCell>
                  <TableCell align="center">{item.total_surface && Number(item.total_surface).toFixed(2)} m²</TableCell>
                  <TableCell>
                    <IconButton onClick={() => toggleRowExpand(item.apartment)}>
                      {expandedRow === item.apartment ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRow === item.apartment} timeout="auto" unmountOnExit>
                      <Box sx={{ display: 'flex', margin: 1 }}>
                        <Box sx={{ flex: 2 }}>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell>Role</TableCell>
                                <TableCell>{item.role}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Modelo</TableCell>
                                <TableCell>{item.model}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Superficie interior</TableCell>
                                <TableCell>{item.interior_surface} m²</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Superficie terraza</TableCell>
                                <TableCell>{item.terrace_surface} m²</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Superficie total</TableCell>
                                <TableCell>{item.total_surface} m²</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Renta</TableCell>
                                <TableCell>{item.rent}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Estado</TableCell>
                                <TableCell>{item.status_id}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src="/images/plan.jpg" alt="Plan" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                        </Box>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Pagination
          count={Math.ceil(filteredStock.length / rowsPerPage)}
          page={page}
          onChange={(event, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>

      {/* Notificación */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Diálogo de Cotización */}
      <QuotationDialog
        open={openQuotationDialog}
        onClose={() => setOpenQuotationDialog(false)}
        stockItem={selectedStockItem}
        projectName={project ? project.name : ''}
      />
    </Box>
  );
}
