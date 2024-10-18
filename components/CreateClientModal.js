import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormHelperText,
  Box,
  styled
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { format, validate } from 'rut.js';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogTitle-root': {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(2),
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '4px',
    '& fieldset': {
      borderColor: '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: '#b0b0b0',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
});

const StyledPhoneInput = styled(PhoneInput)({
  '& .form-control': {
    width: '100%',
    height: '56px',
    borderRadius: '4px',
    fontSize: '1rem',
    borderColor: '#e0e0e0',
    '&:hover': {
      borderColor: '#b0b0b0',
    },
    '&:focus': {
      borderColor: '#1976d2',
      boxShadow: 'none',
    },
  },
  '& .flag-dropdown': {
    borderTopLeftRadius: '4px',
    borderBottomLeftRadius: '4px',
  },
});

const CreateClientModal = ({ open, onClose, onClientCreated, fetchClients }) => {
  const { data: session } = useSession();
  const [clientData, setClientData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rut: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'rut') {
      const formattedRut = format(value);
      setClientData(prev => ({ ...prev, [name]: formattedRut }));
      setErrors(prev => ({ ...prev, rut: validate(formattedRut) ? '' : 'RUT inválido' }));
    } else {
      setClientData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (value) => {
    setClientData(prev => ({ ...prev, phone: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(clientData.rut)) {
      setErrors(prev => ({ ...prev, rut: 'RUT inválido' }));
      return;
    }
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...clientData,
          broker_id: session.user.id,
          organization_id: session.user.organization._id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClientCreated(data.data);
        fetchClients();
        setClientData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          rut: '',
          address: '',
          notes: '',
        });
        onClose();
      } else {
        setServerError(data.error || 'Error al crear el cliente');
      }
    } catch (error) {
      console.error('Error:', error);
      setServerError('Error al crear el cliente');
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Nuevo Cliente</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                label="Nombre"
                name="first_name"
                value={clientData.first_name}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                label="Apellido"
                name="last_name"
                value={clientData.last_name}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledTextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={clientData.email}
                onChange={handleChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StyledPhoneInput
                country={'cl'}
                value={clientData.phone}
                onChange={handlePhoneChange}
                inputProps={{
                  name: 'Teléfono',
                  required: true,
                }}
                containerStyle={{ height: '56px' }}
                inputStyle={{ height: '56px', width: '100%', borderRadius:'1rem' }}
                dropdownStyle={{ width: 'max-content' }}
                placeholder="Teléfono"
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="RUT"
                name="rut"
                value={clientData.rut}
                onChange={handleChange}
                error={!!errors.rut}
                helperText={errors.rut}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Dirección"
                name="address"
                value={clientData.address}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <StyledTextField
                fullWidth
                label="Notas"
                name="notes"
                multiline
                rows={4}
                value={clientData.notes}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          {serverError && (
            <Box mt={2}>
              <FormHelperText error>{serverError}</FormHelperText>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            CANCELAR
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!!errors.rut}
            style={{ backgroundColor: '#4caf50', color: 'white' }}
          >
            CREAR CLIENTE
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  );
};

export default CreateClientModal;