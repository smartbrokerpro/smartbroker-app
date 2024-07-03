import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Autocomplete,
  Paper,
  Box,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { format } from 'date-fns';

const UF_VALUE = 37583; // Valor de UF en

const theme = createTheme({
  palette: {
    primary: {
      main: '#50A930',
    },
    secondary: {
      main: '#50A930',
    },
  },
});

function QuotationDialog({ open, onClose, stockItem, projectName }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    discount: 0,
    bonus: 0,
    downPayment: 0,
    downPaymentContribution: 0,
    downPaymentInstallments: 1,
    cuoton: 0,
    creditTerm: 30,
    annualRate: 4.5,
    storage: false,
    parking: false
  });

  const [calculatedValues, setCalculatedValues] = useState({
    amountToFinance: 0,
    estimatedDividend: 0
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (stockItem) {
      setFormData(prevState => ({
        ...prevState,
        discount: stockItem.discount || 0,
        bonus: stockItem.down_payment_bonus || 0
      }));
    }
  }, [stockItem]);

  useEffect(() => {
    calculateMortgage();
  }, [formData]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value, checked, type } = event.target;
    let newValue = type === 'checkbox' ? checked : parseFloat(value) || 0;

    if (name === 'downPaymentContribution') {
      newValue = Math.min(newValue, formData.downPayment);
    }

    if (name === 'cuoton') {
      const maxCuoton = formData.downPayment - formData.downPaymentContribution;
      newValue = Math.min(newValue, maxCuoton);
    }

    setFormData(prevState => ({
      ...prevState,
      [name]: newValue
    }));
  };

  const calculateMortgage = () => {
    const price = stockItem ? stockItem.current_list_price : 0;
    const discountedPrice = price * (1 - formData.discount / 100);
    const bonusAmount = discountedPrice * (formData.bonus / 100);
    const downPaymentAmount = discountedPrice * (formData.downPayment / 100);
    const amountToFinance = discountedPrice - bonusAmount - downPaymentAmount;

    const monthlyRate = (formData.annualRate / 100) / 12;
    const numberOfPayments = formData.creditTerm * 12;
    const estimatedDividend = amountToFinance * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setCalculatedValues({
      amountToFinance,
      estimatedDividend
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Formulario enviado', { ...formData, ...calculatedValues, selectedClient });
    onClose();
  };

  const formatNumber = (number, decimals = 2) => {
    if (number == null) return '-'; // Devuelve un guión si el número es null o undefined
    return Number(number).toLocaleString('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>COTIZACIÓN</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Proyecto:</strong> {projectName}</Typography>
                  <Typography><strong>Unidad:</strong> {stockItem?.apartment}</Typography>                  <Typography><strong>Valor Unidad:</strong> {formatNumber(stockItem?.current_list_price)} UF</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Fecha:</strong> {format(new Date(), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Valor UF:</strong> ${formatNumber(UF_VALUE, 0)}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Autocomplete
              options={clients}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
              renderInput={(params) => <TextField {...params} label="Seleccionar Cliente" fullWidth />}
              value={selectedClient}
              onChange={(event, newValue) => {
                setSelectedClient(newValue);
              }}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Descuento (%)"
                  name="discount"
                  type="number"
                  value={formData.discount}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bono (%)"
                  name="bonus"
                  type="number"
                  value={formData.bonus}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pie (%)"
                  name="downPayment"
                  type="number"
                  value={formData.downPayment}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Aporte Pie (UF)"
                  name="downPaymentContribution"
                  type="number"
                  value={formData.downPaymentContribution}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número Cuotas Pie"
                  name="downPaymentInstallments"
                  type="number"
                  value={formData.downPaymentInstallments}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cuotón (UF)"
                  name="cuoton"
                  type="number"
                  value={formData.cuoton}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plazo del Crédito (años)"
                  name="creditTerm"
                  type="number"
                  value={formData.creditTerm}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tasa Anual (%)"
                  name="annualRate"
                  type="number"
                  value={formData.annualRate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.storage}
                      onChange={handleInputChange}
                      name="storage"
                      color="secondary"
                    />
                  }
                  label="Bodega"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.parking}
                      onChange={handleInputChange}
                      name="parking"
                      color="secondary"
                    />
                  }
                  label="Estacionamiento"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Paper elevation={3} sx={{ p: 2, flex: 1, mr: 1, bgcolor: '#f0f8ff', borderRadius: '10px' }}>
                <Typography variant="h6" gutterBottom color="primary">Monto a Financiar</Typography>
                <Typography variant="h4" color="primary">{formatNumber(calculatedValues.amountToFinance)} UF</Typography>
                <Typography variant="body2">${formatNumber(calculatedValues.amountToFinance * UF_VALUE, 0)}</Typography>
              </Paper>
              <Paper elevation={3} sx={{ p: 2, flex: 1, ml: 1, bgcolor: '#f0f8ff', borderRadius: '10px' }}>
                <Typography variant="h6" gutterBottom color="primary">Dividendo Estimado</Typography>
                <Typography variant="h4" color="primary">${formatNumber(calculatedValues.estimatedDividend * UF_VALUE, 0)}</Typography>
                <Typography variant="body2">{formatNumber(calculatedValues.estimatedDividend)} UF</Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{color:'white'}}>
              Crear Cotización
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </ThemeProvider>
  );
}

export default QuotationDialog;