// components/EditCompanyModal.js
import React from 'react';
import {
  Box,
  Typography,
  Modal,
  TextField,
  Button,
  Grid,
  Divider
} from '@mui/material';
import DocumentsSection from './DocumentsSection';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

const EditCompanyModal = ({ 
  open, 
  onClose, 
  company,
  editFormData,
  handleInputChange,
  handleSubmit,
  saving,
  showSnackbar
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="edit-company-modal"
    >
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h2" gutterBottom>
          Editar Empresa
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Nombre"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Dirección"
                name="address"
                value={editFormData.address}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={editFormData.phone}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={editFormData.email}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Responsable"
                name="contact_person"
                value={editFormData.contact_person}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={editFormData.website}
                onChange={handleInputChange}
                margin="normal"
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12}>
                <DocumentsSection 
                company={company}
                showSnackbar={showSnackbar}
                />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  onClick={onClose} 
                  color="inherit"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
        
      </Box>
    </Modal>
  );
};

export default EditCompanyModal;