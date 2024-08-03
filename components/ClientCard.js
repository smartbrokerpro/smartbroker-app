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
    case 'contacted':
      return '#6CD63F'; // Verde
    case 'follow_up':
      return '#FFD700'; // Amarillo
    case 'not_contacted':
      return '#FFA500'; // Naranja
    case 'unreachable':
      return '#DA3739'; // Rojo
    default:
      return '#808080'; // Gris por defecto
  }
};

const ClientCard = React.forwardRef(({ client, updatedClientId, fallbackImage }, ref) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tooltipText, setTooltipText] = useState('Copiar');
  const [icon, setIcon] = useState(<ContentCopyIcon sx={{ fontSize: 16, mr: 0.5 }} />);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/clients/${client._id}/edit`);
  };

  const handleDelete = () => {
    console.log('Eliminar cliente:', client._id);
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
    <Card
      ref={ref}
      sx={{
        bgcolor: 'background.paper',
        backgroundColor: updatedClientId === client._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
        transition: 'background-color 0.5s ease-in-out',
        mb: 3,
        position: 'relative'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Avatar
            alt={`${client.first_name} ${client.last_name}`}
            src={fallbackImage}
            sx={{ width: 56, height: 56 }}
          />
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
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
              Eliminar
            </ListItemText>
          </MenuItem>
        </Menu>

        {/* Nombre */}
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

        {/* RUT */}
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

        {/* Correo */}
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

        {/* Teléfono */}
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
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
          >
            Ver Detalles
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

export default ClientCard;
