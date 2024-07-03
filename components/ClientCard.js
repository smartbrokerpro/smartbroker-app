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
  Avatar
} from '@mui/material';
import { useRouter } from 'next/router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

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
    // Aquí puedes agregar la lógica para eliminar el cliente
    console.log('Eliminar cliente:', client._id);
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
        <Typography
          variant="h6"
          component="h2"
          sx={{ pb: 0, mb: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {`${client.first_name} ${client.last_name}`}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          RUT: {client.rut}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {client.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">
            {client.phone}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Chip label={client.origin} color="primary" variant="contained" size="small" />
          <Chip
              label={client.status}
              sx={{
                borderWidth:'1px',
                borderStyle:'solid',
                borderColor: getStatusColor(client.status),
                color: getStatusColor(client.status),
                backgroundColor:'white',
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