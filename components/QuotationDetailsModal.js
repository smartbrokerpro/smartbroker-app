import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import moment from 'moment';

const QuotationDetailsModal = ({ open, onClose, quotationId, organizationId, userId }) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Modal open state:', open);
    console.log('Quotation ID:', quotationId);
    console.log('Organization ID:', organizationId);
    console.log('User ID:', userId);

    if (open && quotationId && organizationId && userId) {
      console.log('Fetching quotation details...');
      fetchQuotationDetails();
    } else {
      console.log('Not fetching. Some required data is missing.');
    }
  }, [open, quotationId, organizationId, userId]);

  const fetchQuotationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Sending request to:', `/api/quotations?id=${quotationId}&organizationId=${organizationId}&userId=${userId}`);
      const response = await fetch(`/api/quotations?id=${quotationId}&organizationId=${organizationId}&userId=${userId}`);
      const data = await response.json();
      console.log('Received data:', data);
      if (data.success) {
        setQuotation(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch quotation details');
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      setError('Failed to load quotation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatUF = (value) => Number(value).toFixed(2);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Detalles de la Cotización #{quotation?.quotation_id}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : quotation ? (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">ID de Cotización</TableCell>
                    <TableCell align="right">{quotation._id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Número de Cotización</TableCell>
                    <TableCell align="right">{quotation.quotation_id}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Fecha de Cotización</TableCell>
                    <TableCell align="right">{moment(quotation.quotation_date).format('DD/MM/YYYY HH:mm:ss')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Valor UF</TableCell>
                    <TableCell align="right">{formatUF(quotation.uf_value_at_quotation.value)} {quotation.uf_value_at_quotation.unit}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Valor Unidad</TableCell>
                    <TableCell align="right">{formatUF(quotation.unit_value.value)} {quotation.unit_value.unit}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Porcentaje de Descuento</TableCell>
                    <TableCell align="right">{quotation.discount_percentage}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Porcentaje de Bonificación</TableCell>
                    <TableCell align="right">{quotation.bonus_percentage}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Porcentaje de Pie</TableCell>
                    <TableCell align="right">{quotation.down_payment_percentage}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Aporte de Pie</TableCell>
                    <TableCell align="right">{quotation.down_payment_contribution}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Cuotas de Pie</TableCell>
                    <TableCell align="right">{quotation.down_payment_installments}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Cuota Grande</TableCell>
                    <TableCell align="right">{quotation.large_installment}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Plazo de Crédito (años)</TableCell>
                    <TableCell align="right">{quotation.credit_term_years}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Tasa Anual</TableCell>
                    <TableCell align="right">{quotation.annual_rate}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Bodega</TableCell>
                    <TableCell align="right">{quotation.storage ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Estacionamiento</TableCell>
                    <TableCell align="right">{quotation.parking ? 'Sí' : 'No'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Monto Financiamiento</TableCell>
                    <TableCell align="right">{formatUF(quotation.financing_amount.value)} {quotation.financing_amount.unit}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Dividendo Estimado</TableCell>
                    <TableCell align="right">{formatUF(quotation.estimated_dividend.value)} {quotation.estimated_dividend.unit}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box mt={2}>
              <Typography variant="h6">Información del Cliente</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Nombre</TableCell>
                      <TableCell align="right">{quotation.client.first_name} {quotation.client.last_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Email</TableCell>
                      <TableCell align="right">{quotation.client.email}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Teléfono</TableCell>
                      <TableCell align="right">{quotation.client.phone}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">RUT</TableCell>
                      <TableCell align="right">{quotation.client.rut}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            <Box mt={2}>
              <Typography variant="h6">Información del Proyecto</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Nombre del Proyecto</TableCell>
                      <TableCell align="right">{quotation.project.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Dirección</TableCell>
                      <TableCell align="right">{quotation.project.address}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Comuna</TableCell>
                      <TableCell align="right">{quotation.project.county_name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Apartamento</TableCell>
                      <TableCell align="right">{quotation.stock.apartment}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Inmobiliaria</TableCell>
                      <TableCell align="right">{quotation.stock.real_estate_company_name}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        ) : (
          <Typography>No se encontraron detalles de la cotización.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetailsModal;