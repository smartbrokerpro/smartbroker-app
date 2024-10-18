import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useRouter } from 'next/router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const getStatusColor = (status) => {
  switch (status) {
    case 'contactado':
      return '#6CD63F';
    case 'hacer seguimiento':
      return '#FFD700';
    case 'no contactado':
      return '#FFA500';
    case 'inubicable':
      return '#DA3739';
    default:
      return '#808080';
  }
};

const ClientCard = React.forwardRef(({ client, updatedClientIds, updatedClientId, fallbackImage, onDelete, organizationId }, ref) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tooltipText, setTooltipText] = useState('Copiar');
  const [icon, setIcon] = useState(<ContentCopyIcon sx={{ fontSize: 16, mr: 0.5 }} />);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isUpdated = Array.isArray(updatedClientIds) 
    ? updatedClientIds.includes(client._id)
    : updatedClientId === client._id;

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/clients/${client._id}/edit`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/clients/${client._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });
  
      if (response.ok) {
        console.log('Cliente eliminado exitosamente');
        setDeleteDialogOpen(false);
        onDelete(client._id);
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar el cliente:', errorData);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setTooltipText('Copiado');
    setIcon(<CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />);
    setTimeout(() => {
      setTooltipText('Copiar');
      setIcon(<ContentCopyIcon sx={{ fontSize: 16, mr: 0.5 }} />);
    }, 2000);
  };

  return (
    <>
      <Card
        ref={ref}
        sx={{
          bgcolor: 'background.paper',
          backgroundColor: isUpdated ? 'rgba(0, 255, 0, 0.2)' : 'white',
          transition: 'background-color 0.5s ease-in-out',
          mb: 3,
          position: 'relative'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mb: 1 }}>
              <Tooltip
                title={
                  <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {icon}{tooltipText}
                  </Box>
                }
                arrow
                placement="top"
                classes={{ popper: 'MuiTooltip-copied' }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                  onClick={() => handleCopy(`${client.first_name} ${client.last_name}`)}
                >
                  {`${client.first_name} ${client.last_name}`}
                </Typography>
              </Tooltip>
            </Box>
            <IconButton
              aria-label="more"
              aria-controls="long-menu"
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              style: {
                borderRadius: '8px'
              }
            }}
          >
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
                Editar
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

          <Box sx={{ mb: 1 }}>
            <Tooltip
              title={
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {icon}{tooltipText}
                </Box>
              }
              arrow
              placement="top"
              classes={{ popper: 'MuiTooltip-copied' }}
            >
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => handleCopy(client.rut)}
              >
                RUT: {client.rut}
              </Typography>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Tooltip
              title={
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {icon}{tooltipText}
                </Box>
              }
              arrow
              placement="top"
              classes={{ popper: 'MuiTooltip-copied' }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleCopy(client.email)}
              >
                <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {client.email}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 1 }}>
            <Tooltip
              title={
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {icon}{tooltipText}
                </Box>
              }
              arrow
              placement="top"
              classes={{ popper: 'MuiTooltip-copied' }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleCopy(client.phone)}
              >
                <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {client.phone}
                </Typography>
              </Box>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, display:'none' }}>
            <Chip label={client.origin} color="primary" variant="contained" size="small" />
            <Chip
              label={client.status}
              sx={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: getStatusColor(client.status),
                color: getStatusColor(client.status),
                backgroundColor: 'white',
                fontWeight: 300,
              }}
              size="small"
            />
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Contactado: {new Date(client.contact_date).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              color="primary"
              variant="contained"
              onClick={() => router.push(`/clients/${client._id}/details`)}
              disabled={true}
            >
              Ver Procesos
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Estás seguro de que quieres eliminar este cliente?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Esta acción no se puede deshacer. Todos los datos asociados a {client.first_name} {client.last_name} serán eliminados permanentemente.
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

export default ClientCard;