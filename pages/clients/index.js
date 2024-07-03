'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Grid,
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
  CircularProgress,
  Pagination,
  Button,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { TableRows, GridView, MoreVert, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@mui/material/styles';
import LottieLoader from '@/components/LottieLoader';
import ClientCard from '@/components/ClientCard';

const fallbackImage = '/images/avatar-fallback.jpg';

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

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [updatedClientId, setUpdatedClientId] = useState(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const { collapsed } = useSidebarContext();
  const theme = useTheme();
  const router = useRouter();
  const showNotification = useNotification();
  const clientRefs = useRef({});
  const containerRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (updatedClientId) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [clients]);

  async function fetchClients() {
    setIsRefetching(true);
    const response = await fetch('/api/clients');
    const data = await response.json();
    if (data.success) {
      setClients(data.data);
    }
    setIsRefetching(false);
    setLoading(false);
  }

  async function handleUpdateClient(e) {
    e.preventDefault();
    if (!updatePrompt.trim()) {
      setNotification({ open: true, message: 'El prompt no puede estar vacío', severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/gpt/clients-gpt-handler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: updatePrompt }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Operación exitosa:', result);
        setNotification({ open: true, message: 'Operación exitosa', severity: 'success' });
        setUpdatePrompt('');

        const updatedId = result.updatedClientId || result.deletedClientId || result.createdClientId;
        if (updatedId) {
          console.log(`Updated/Deleted/Created client ID: ${updatedId}`);
          setUpdatedClientId(updatedId);
          fetchClients();
          setTimeout(() => {
            console.log(`Removing highlight for client ID: ${updatedId}`);
            setUpdatedClientId(null);
          }, 3000);
        } else {
          fetchClients();
        }
      } else {
        console.error('Error en la operación:', result);
        setNotification({ open: true, message: result.error || 'Error en la operación', severity: 'error' });
      }
    } catch (error) {
      console.error('Error en la operación:', error);
      setNotification({ open: true, message: 'Error en la operación', severity: 'error' });
    }
    setIsSubmitting(false);
  }

  function handleSearch(e) {
    setSearchQuery(e.target.value);
  }

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      (client.first_name && client.first_name.toLowerCase().includes(query)) ||
      (client.last_name && client.last_name.toLowerCase().includes(query)) ||
      (client.email && client.email.toLowerCase().includes(query)) ||
      (client.phone && client.phone.includes(query)) ||
      (client.rut && client.rut.includes(query)) ||
      (client.origin && client.origin.toLowerCase().includes(query)) ||
      (client.status && client.status.toLowerCase().includes(query))
    );
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleMenuClick = (event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleEdit = () => {
    router.push(`/clients/${selectedClient._id}/edit`);
    handleMenuClose();
  };

  const handleDelete = () => {
    console.log('Eliminar cliente:', selectedClient._id);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <LottieLoader message="Cargando..." />
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxWidth: 1200, mx: 'auto', mt: 0, mb: 0, p: 4, pb: 0, display: 'flex', flexDirection: 'column', height: '96vh', position: 'relative' }}>
      <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">Clientes</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <TextField
            variant="outlined"
            placeholder="Búsqueda rápida"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2, flex: 1, mr: 2, height: 40 }}
            InputProps={{
              style: { fontSize: '0.875rem', height: '2.5rem' },
            }}
            helperText={`${filteredClients.length} de ${clients.length} clientes encontrados`}
          />
          <Box>
            <IconButton onClick={() => setViewMode('grid')} color={viewMode === 'grid' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'grid' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
              <GridView />
            </IconButton>
            <IconButton onClick={() => setViewMode('table')} color={viewMode === 'table' ? 'primary' : 'default'} sx={{ bgcolor: viewMode === 'table' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
              <TableRows />
            </IconButton>
          </Box>
        </Box>
        {isRefetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LottieLoader message="Actualizando..." />
          </Box>
        )}
        {viewMode === 'grid' ? (
          <Grid container spacing={4}>
            {filteredClients.map(client => (
              <Grid item key={client._id} xs={12} sm={6} md={4}>
                <ClientCard
                  ref={el => clientRefs.current[client._id] = el}
                  client={client}
                  updatedClientId={updatedClientId}
                  fallbackImage={fallbackImage}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>RUT</TableCell>
                    <TableCell>Origen</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(client => (
                    <TableRow
                      key={client._id}
                      ref={el => clientRefs.current[client._id] = el}
                      sx={{
                        backgroundColor: updatedClientId === client._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
                        transition: 'background-color 0.5s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Avatar alt={`${client.first_name} ${client.last_name}`} src={fallbackImage} />
                      </TableCell>
                      <TableCell>{`${client.first_name} ${client.last_name}`}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.rut}</TableCell>
                      <TableCell>
                        <Chip label={client.origin} color="primary" variant="contained" size="small" />
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <IconButton
                          aria-label="more"
                          aria-controls="long-menu"
                          aria-haspopup="true"
                          onClick={(e) => handleMenuClick(e, client)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={Math.ceil(filteredClients.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ position: 'sticky', bottom: '4px', width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff', outline: '4px solid #EEEEEE', boxShadow: '-1px -1px 36px #eeeeee' }}>
        <form onSubmit={handleUpdateClient}>
          <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              aria-label="Crea, modifica o elimina clientes"
              placeholder="Crea, modifica o elimina clientes"
              multiline
              minRows={1}
              maxRows={6}
              variant="outlined"
              fullWidth
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleUpdateClient(e); }}
              InputProps={{
                sx: {
                  padding: '8px',
                  paddingLeft: '1rem',
                  borderRadius: '1rem',
                  fontSize: '.9rem',
                  fontFamily: 'Poppins',
                  backgroundColor: '#fff',
                  border: '1px solid #fff',
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isSubmitting}
              sx={{ minWidth: 100, ml: '6px', borderRadius: '2rem', pl: 3, pr: 3 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Realizar'}
            </Button>
          </Box>
        </form>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            borderRadius: '8px',
            boxShadow: 'none',
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
            Editar cliente
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
    </Box>
  );
}