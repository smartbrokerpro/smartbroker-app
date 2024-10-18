import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [ufValue, setUfValue] = useState(null);

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
    storageValue: 0,
    parking: false,
    parkingValue: 0
  });

  const [calculatedValues, setCalculatedValues] = useState({
    amountToFinance: 0,
    estimatedDividend: 0,
    minimumDownPayment: 0,
    suggestedCuoton: 0
  });

  useEffect(() => {
    const fetchUF = async () => {
      try {
        const response = await fetch("https://api.cmfchile.cl/api-sbifv3/recursos_api/uf?apikey=bace76350472a60b9a18534dfa08b18a033c78f7&formato=json");
        const data = await response.json();
        const ufString = data.UFs[0].Valor.replace(".", "").replace(",", ".");
        const uf = parseFloat(ufString);
        setUfValue(uf);
      } catch (error) {
        console.error("Error fetching UF:", error);
      }
    };

    fetchUF();
  }, []);

  useEffect(() => {
    if (session && stockItem) {
      console.log('Session:', session);
      console.log('StockItem:', stockItem);
      const organizationId = session.user.organization._id;
      const brokerId = session.user.id;
      console.log('Fetching clients with:', { organizationId, brokerId });
      fetchClients(organizationId, brokerId);
    }
  }, [session, stockItem]);

  const fetchClients = async (organizationId, brokerId) => {
    try {
      const response = await fetch(`/api/clients?organizationId=${organizationId}&brokerId=${brokerId}`);
      const data = await response.json();
      if (data.success) {
        setClients(data.data);
      } else {
        console.error('Error fetching clients:', data.error);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

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
  }, [formData, stockItem]);

  const calculateMinimumDownPayment = () => {
    const price = stockItem ? stockItem.current_list_price : 0;
    const discountedPrice = price * (1 - formData.discount / 100);
    const additionalCosts = (formData.storage ? formData.storageValue : 0) + (formData.parking ? formData.parkingValue : 0);
    const totalPrice = discountedPrice + additionalCosts;
    return (totalPrice * formData.downPayment) / 100;
  };

  const calculateSuggestedCuoton = (minimumDownPayment) => {
    const difference = minimumDownPayment - formData.downPaymentContribution;
    return Math.max(difference, 0);
  };

  const handleInputChange = (event) => {
    const { name, value, checked, type } = event.target;
    let newValue = type === 'checkbox' ? checked : parseFloat(value) || 0;

    if (name === 'downPayment' || name === 'downPaymentContribution' || name === 'storage' || name === 'parking' || name === 'storageValue' || name === 'parkingValue') {
      const minimumDownPayment = calculateMinimumDownPayment();
      const suggestedCuoton = calculateSuggestedCuoton(minimumDownPayment);
      setCalculatedValues(prev => ({ ...prev, minimumDownPayment, suggestedCuoton }));
    }

    if (name === 'cuoton') {
      const minimumDownPayment = calculateMinimumDownPayment();
      const maxCuoton = Math.max(minimumDownPayment - formData.downPaymentContribution, 0);
      newValue = Math.min(Math.max(newValue, 0), maxCuoton);
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
    const minimumDownPayment = calculateMinimumDownPayment();
    const downPaymentAmount = Math.max(formData.downPaymentContribution + formData.cuoton, minimumDownPayment);
    const additionalCosts = (formData.storage ? formData.storageValue : 0) + (formData.parking ? formData.parkingValue : 0);
    const amountToFinance = discountedPrice - bonusAmount - downPaymentAmount + additionalCosts;

    const monthlyRate = (formData.annualRate / 100) / 12;
    const numberOfPayments = formData.creditTerm * 12;
    const estimatedDividend = amountToFinance * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    const suggestedCuoton = calculateSuggestedCuoton(minimumDownPayment);

    setCalculatedValues(prev => ({
      ...prev,
      amountToFinance,
      estimatedDividend,
      minimumDownPayment,
      suggestedCuoton
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const quotationData = {
      organization_id: stockItem.organization_id,
      project_id: stockItem.project_id,
      stock_id: stockItem._id,
      client_id: selectedClient ? selectedClient._id : null,
      user_id: session?.user?.id,
      quotation_date: new Date(),
      uf_value_at_quotation: ufValue,
      unit_value: stockItem ? stockItem.current_list_price : 0,
      discount_percentage: formData.discount,
      bonus_percentage: formData.bonus,
      down_payment_percentage: formData.downPayment,
      down_payment_contribution: formData.downPaymentContribution,
      down_payment_installments: formData.downPaymentInstallments,
      large_installment: formData.cuoton,
      credit_term_years: formData.creditTerm,
      annual_rate: formData.annualRate,
      storage: formData.storage,
      storageValue: formData.storage ? formData.storageValue : null,
      parking: formData.parking,
      parkingValue: formData.parking ? formData.parkingValue : null,
      financing_amount: calculatedValues.amountToFinance,
      estimated_dividend: calculatedValues.estimatedDividend,
      created_at: new Date(),
      updated_at: new Date()
    };
  
    console.log('Quotation data being sent:', JSON.stringify(quotationData, null, 2));
  
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      });
  
      const result = await response.json();
  
      if (result.success) {
        console.log('Quotation created successfully:', result.data);
      } else {
        console.error('Failed to create quotation:', result.message);
      }
    } catch (error) {
      console.error('Error submitting quotation:', error);
    }
  
    onClose();
  };

  const formatNumber = (number, decimals = 2) => {
    if (number == null) return '-';
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
                  <Typography><strong>Unidad:</strong> {stockItem?.apartment}</Typography>
                  <Typography><strong>Valor Unidad:</strong> {formatNumber(stockItem?.current_list_price)} UF</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Fecha:</strong> {format(new Date(), 'dd/MM/yyyy')}</Typography>
                  <Typography><strong>Valor UF:</strong> ${formatNumber(ufValue, 0)}</Typography>
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
                <TextField fullWidth label="Descuento (%)" name="discount" type="number" value={formData.discount} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Bono (%)" name="bonus" type="number" value={formData.bonus} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Pie (%)" name="downPayment" type="number" value={formData.downPayment} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Aporte Pie (UF)"
                  name="downPaymentContribution"
                  type="number"
                  value={formData.downPaymentContribution}
                  onChange={handleInputChange}
                  helperText={`Mínimo: ${formatNumber(calculatedValues.minimumDownPayment)} UF`}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Número Cuotas Pie" name="downPaymentInstallments" type="number" value={formData.downPaymentInstallments} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cuotón (UF)"
                  name="cuoton"
                  type="number"
                  value={formData.cuoton}
                  onChange={handleInputChange}
                  helperText={`Valor sugerido: ${formatNumber(calculatedValues.suggestedCuoton)} UF`}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Plazo del Crédito (años)" name="creditTerm" type="number" value={formData.creditTerm} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Tasa Anual (%)" name="annualRate" type="number" value={formData.annualRate} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={formData.storage} onChange={handleInputChange} name="storage" color="secondary" />}
                  label="Bodega"
                />
                {formData.storage && (
                  <TextField
                    fullWidth
                    label="Valor Bodega (UF)"
                    name="storageValue"
                    type="number"
                    value={formData.storageValue}
                    onChange={handleInputChange}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox checked={formData.parking} onChange={handleInputChange} name="parking" color="secondary" />}
                  label="Estacionamiento"
                />
                {formData.parking && (
                  <TextField
                    fullWidth
                    label="Valor Estacionamiento (UF)"
                    name="parkingValue"
                    type="number"
                    value={formData.parkingValue}
                    onChange={handleInputChange}
                    sx={{ mt: 1 }}
                  />
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Paper elevation={3} sx={{ p: 2, flex: 1, mr: 1, bgcolor: '#f0f8ff', borderRadius: '10px' }}>
                <Typography variant="h6" gutterBottom color="primary">Monto a Financiar</Typography>
                <Typography variant="h4" color="primary">{formatNumber(calculatedValues.amountToFinance)} UF</Typography>
                <Typography variant="body2">${formatNumber(calculatedValues.amountToFinance * ufValue, 0)}</Typography>
              </Paper>
              <Paper elevation={3} sx={{ p: 2, flex: 1, ml: 1, bgcolor: '#f0f8ff', borderRadius: '10px' }}>
                <Typography variant="h6" gutterBottom color="primary">Dividendo Estimado</Typography>
                <Typography variant="h4" color="primary">${formatNumber(calculatedValues.estimatedDividend * ufValue, 0)}</Typography>
                <Typography variant="body2">{formatNumber(calculatedValues.estimatedDividend)} UF</Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ color: 'white' }}>
              Crear Cotización
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </ThemeProvider>
  );
}

export default QuotationDialog;