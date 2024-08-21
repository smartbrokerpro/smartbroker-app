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
import InfoBox from '@/components/InfoBox'


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
  const rowsPerPage = 10;
  const theme = useTheme();
  const stockRefs = useRef({});
  const containerRef = useRef(null);
  const [openQuotationDialog, setOpenQuotationDialog] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [openCommercialConditions, setOpenCommercialConditions] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      if (idProject) {
        fetchProject();
        fetchStock();
      }
    }
  }, [idProject, status]);

  useEffect(() => {
    if (updatedStockIds.length > 0) {
      const firstUpdatedId = updatedStockIds[0];
      const element = stockRefs.current[firstUpdatedId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [updatedStockIds, stock]);

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

  function handlePromptSuccess(result, updatedId) {
    console.log('Resultado completo de la operación:', result);
    
    if (result.error) {
      setNotification({
        open: true,
        message: result.error,
        severity: 'error'
      });
      return;
    }
  
    let updatedIds = [];
    if (result.data && result.data.updatedIds) {
      updatedIds = result.data.updatedIds;
    } else if (updatedId) {
      updatedIds = [updatedId];
    }
  
    console.log(`Número de IDs actualizados: ${updatedIds.length}`);
    console.log('IDs actualizados:', updatedIds);
  
    if (updatedIds.length > 0) {
      setUpdatedStockIds(updatedIds);
      fetchStock();
      setTimeout(() => {
        setUpdatedStockIds([]);
      }, 3000);
  
      setNotification({
        open: true,
        message: `Operación exitosa: ${updatedIds.length} elemento(s) modificado(s)`,
        severity: 'success'
      });
    } else {
      fetchStock();
      setNotification({
        open: true,
        message: 'Operación completada, pero no se modificaron elementos',
        severity: 'info'
      });
    }
  
    if (result.credits) {
      const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: result.credits } });
      window.dispatchEvent(creditUpdateEvent);
    }
  }

  function handleSearch(e) {
    setSearchQuery(e.target.value);
  }

  function filterStock(item) {
    const lowercasedQuery = searchQuery.toLowerCase();
    return (
      item.apartment.toString().toLowerCase().includes(lowercasedQuery) ||
      item.typology.toString().toLowerCase().includes(lowercasedQuery) ||
      item.orientation.toString().toLowerCase().includes(lowercasedQuery) ||
      item.current_list_price.toString().toLowerCase().includes(lowercasedQuery) ||
      item.down_payment_bonus.toString().toLowerCase().includes(lowercasedQuery) ||
      item.discount.toString().toLowerCase().includes(lowercasedQuery)
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // Opcional, para evitar decimales
    }).format(value);
  };

  const filteredStock = stock.filter(filterStock);

  function toggleRowExpand(stockId) {
    setExpandedRow(expandedRow === stockId ? null : stockId);
  }

  if (loading && firstLoad) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <LottieLoader />
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Button 
        onClick={() => router.push(`/projects`)} 
        startIcon={<ChevronLeft />} 
        variant="outlined" 
        color="primary"
      >
        Volver a Proyectos
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
        <Avatar
          src={project?.gallery?.[0] || '/images/fallback.jpg'}
          alt={project?.name}
          sx={{ width: 60, height: 60, mr: 2 }}
        />
        <Typography variant="h4" component="h1" color="primary">
          Stock del Proyecto <b>{project?.name}</b>
        </Typography>
      </Box>

      {/* Tabla resumen del proyecto */}
      <Box sx={{ my: 4 }}>
        <Grid container spacing={2}>

        {project?.deliveryDateDescr && (
          <InfoBox title="Fecha de Entrega" value={project.deliveryDateDescr} />
        )}

        {project?.deliveryType && (
          <InfoBox title="Tipo de Entrega" value={project.deliveryType} />
        )}

        {project?.downPaymentMethod && (
          <InfoBox title="Método de Pago" value={project.downPaymentMethod} />
        )}

        {project?.installments && (
          <InfoBox title="Cuotas" value={project.installments} />
        )}

        {project?.promiseSignatureType && (
          <InfoBox title="Tipo de Firma de Promesa" value={project.promiseSignatureType} />
        )}

        {project?.reservationValue && (
          <InfoBox title="Valor Reserva" value={formatCurrency(project.reservationValue)} />
        )}

        {(project?.reservationInfo || project?.reservationInfo === '') && (
          <InfoBox
            title="Información de Reserva"
            value={
              typeof project.reservationInfo === 'object' ? (
                <Button
                  variant="outlined"
                  color="primary"
                  href={project.reservationInfo.hyperlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'black', border:'none', borderBottom: '1px solid #9AD850', borderRadius: '0rem' }}
                >
                  Ir al sitio de pago
                </Button>
              ) : typeof project.reservationInfo === 'string' && project.reservationInfo.startsWith('http') ? (
                <Button
                  variant="outlined"
                  color="primary"
                  href={project.reservationInfo}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'black', borderBottom: '1px solid #9AD850', borderRadius: '0rem' }}
                >
                  Ir al sitio de pago
                </Button>
              ) : (
                project.reservationInfo
              )
            }
          />
        )}
         
        </Grid>
      </Box>




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
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Búsqueda rápida"
        value={searchQuery}
        onChange={handleSearch}
        sx={{ mb: 2 }}
        InputProps={{
          style: { fontSize: '0.875rem', height: '2.5rem' },
        }}
        helperText={`${filteredStock.length} de ${stock.length} unidades encontradas`}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Unidad</TableCell>
              <TableCell>Tipología</TableCell>
              <TableCell>Orientación</TableCell>
              <TableCell align='center'>Precio</TableCell>
              <TableCell align='center'>Bono Pie</TableCell>
              <TableCell align='center'>Descuento</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStock.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(item => (
              <React.Fragment key={item._id}>
                <TableRow
                  ref={el => stockRefs.current[item._id] = el}
                  sx={{
                    backgroundColor: updatedStockIds.includes(item._id) ? 'rgba(0, 255, 0, 0.2)' : 'inherit',
                    transition: 'background-color 0.5s ease-in-out'
                  }}
                >
                  <TableCell>{item.apartment}</TableCell>
                  <TableCell>{item.typology}</TableCell>
                  <TableCell>{item.orientation}</TableCell>
                  <TableCell align='center'><NumberFormatter value={item.current_list_price} unit={'UF'} prependUnit={false} decimals={0} appendUnit={true} /></TableCell>
                  <TableCell align='center'><NumberFormatter value={item.down_payment_bonus} unit={'%'} prependUnit={false} decimals={0} appendUnit={true} /></TableCell>
                  <TableCell align='center'><NumberFormatter value={item.discount} unit={'%'} prependUnit={false} decimals={0} appendUnit={true} /></TableCell>
                  
                  <TableCell>
                    <IconButton onClick={() => toggleRowExpand(item.apartment)}>
                      {expandedRow === item.apartment ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          color="primary"
                          variant="contained"
                          onClick={() => console.log('Editar clicked')}
                          sx={{ mr: 2 }}
                          startIcon={<Edit />}
                        >
                          Editar
                        </Button>
                        <Button
                          color="primary"
                          variant="contained"
                          onClick={() => {
                            setSelectedStockItem(item);
                            setOpenQuotationDialog(true);
                          }}
                        >
                          Cotizar
                        </Button>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Pagination
          count={Math.ceil(filteredStock.length / rowsPerPage)}
          page={page}
          onChange={(event, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>
      <Box sx={{ position: 'sticky', bottom: '4px', width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff', outline: '4px solid #EEEEEE', boxShadow: '-1px -1px 36px #eeeeee' }}>
        <PromptInput 
          modelName="stock" 
          onSuccess={handlePromptSuccess} 
          projectId={idProject}
          useExternalNotification={true}
        />
      </Box>
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

      <QuotationDialog
        open={openQuotationDialog}
        onClose={() => setOpenQuotationDialog(false)}
        stockItem={selectedStockItem}
        projectName={project ? project.name : ''}
      />
    </Box>
  );
}
