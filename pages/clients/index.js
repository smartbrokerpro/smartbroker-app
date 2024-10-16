'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  Button,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction
} from '@mui/material';
import { TableRows, GridView, MoreVert, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, GroupAdd as GroupAddIcon, Bolt as BoltIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@mui/material/styles';
import LottieLoader from '@/components/LottieLoader';
import ClientCard from '@/components/ClientCard';
import PromptInput from '@/components/PromptInput';
import { useSession } from 'next-auth/react';
import CreateClientModal from '@/components/CreateClientModal';


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
  const { data: session, status } = useSession();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [updatedClientId, setUpdatedClientId] = useState([]);
  const [updatedClientIds, setUpdatedClientIds] = useState([]);
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleClientCreated = (newClient) => {
    setClients(prevClients => [...prevClients, newClient]);
    showNotification('Cliente creado exitosamente', 'success');
  };


  useEffect(() => {
    if (status === 'authenticated') {
      fetchClients();
    }
  }, [status]);

  useEffect(() => {
    if (updatedClientIds.length > 0) {
      const firstUpdatedId = updatedClientIds[0];
      const element = clientRefs.current[firstUpdatedId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [updatedClientIds]);

  const fetchClients = useCallback(async () => {
    setIsRefetching(true);
    const response = await fetch(`/api/clients?organizationId=${session.user.organization._id}&brokerId=${session.user.id}`);
    const data = await response.json();
    if (data.success) {
      // Asegúrate de convertir los ObjectIds a strings antes de la comparación
      setClients(data.data.filter(client => 
        client.organization_id.toString() === session.user.organization._id.toString() && 
        client.broker_id.toString() === session.user.id.toString()
      ));
    } else {
      console.error('Error fetching clients:', data);
    }
    setIsRefetching(false);
    setLoading(false);
}, [session]);





  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!updatePrompt.trim()) {
      setNotification({ open: true, message: 'El prompt no puede estar vacío', severity: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/gpt/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          prompt: updatePrompt,
          organizationId: session.user.organization._id,
          userId: session.user._id,
          userEmail: session.user.email,
          modelName: 'clients'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({ open: true, message: 'Operación exitosa', severity: 'success' });
        setUpdatePrompt('');

        const updatedId = result.updatedClientId || result.deletedClientId || result.createdClientId;
        if (updatedId) {
          setUpdatedClientId(updatedId);
          fetchClients();
          setTimeout(() => {
            setUpdatedClientId(null);
          }, 3000);
        } else {
          fetchClients();
        }

        const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: result.credits } });
        window.dispatchEvent(creditUpdateEvent);

      } else {
        setNotification({ open: true, message: result.error || 'Error en la operación', severity: 'error' });
      }
    } catch (error) {
      setNotification({ open: true, message: 'Error en la operación', severity: 'error' });
    }
    setIsSubmitting(false);
  };

  const handlePromptSuccess = (result) => {
    console.log('Resultado completo de la operación:', result);
    
    let updatedIds = [];
    if (result.data && Array.isArray(result.data.updatedIds)) {
      updatedIds = result.data.updatedIds;
    } else if (result.data && result.data._id) {
      updatedIds = [result.data._id];
    }
  
    console.log(`Número de IDs actualizados: ${updatedIds.length}`);
    console.log('IDs actualizados:', updatedIds);
  
    if (updatedIds.length > 0) {
      setUpdatedClientIds(updatedIds);
      fetchClients();
      setTimeout(() => {
        setUpdatedClientIds([]);
      }, 3000);
  
      showNotification(`Operación exitosa: ${updatedIds.length} cliente(s) modificado(s)`, 'success');
    } else {
      fetchClients();
      showNotification('Operación completada, pero no se modificaron clientes', 'info');
    }
  
    if (result.credits) {
      const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: result.credits } });
      window.dispatchEvent(creditUpdateEvent);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredClients = useMemo(() => clients.filter(client => {
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
  }), [clients, searchQuery]);

  const handleMenuClick = useCallback((event, client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedClient(null);
  }, []);

  const handleEdit = useCallback(() => {
    router.push(`/clients/${selectedClient._id}/edit`);
    handleMenuClose();
  }, [selectedClient, handleMenuClose, router]);

  const handleDelete = useCallback(() => {
    console.log('Eliminar cliente:', selectedClient._id);
    handleMenuClose();
  }, [selectedClient, handleMenuClose]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  
  

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <LottieLoader message="Cargando..." />
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ maxWidth: 1200, mx: 'auto', mt: 0, mb: 0, p: 4, pb: 0, display: 'flex', flexDirection: 'column', height: '96vh', position: 'relative' }}>
      <SpeedDial
        ariaLabel="Opciones de cliente"
        sx={{ position: 'fixed', top: '3vh', right: '3vw' }}
        icon={<SpeedDialIcon />}
        direction="down"
        openOnHover={false}
      >
        <SpeedDialAction
          icon={<PersonAddIcon />}
          tooltipTitle="Crear cliente"
          onClick={handleOpenCreateModal}
        />
        <SpeedDialAction
          icon={<GroupAddIcon />}
          tooltipTitle="Actualización masiva de clientes"
          onClick={() => router.push('/clients/mass-update')}
        />
        <SpeedDialAction
          icon={<BoltIcon />}
          tooltipTitle="Editor rápido de clientes"
          onClick={() => router.push('/clients/quick-editor')}
        />
      </SpeedDial>
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
            {filteredClients.slice(0, filteredClients.length).map(client => (
              <Grid item key={client._id} xs={12} sm={6} md={4}>
                <ClientCard
                  ref={el => clientRefs.current[client._id] = el}
                  client={client}
                  updatedClientIds={updatedClientIds}
                  isUpdated={updatedClientIds.includes(client._id)}
                  fallbackImage={fallbackImage}
                  organizationId={session.user.organization._id}
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
                        backgroundColor: updatedClientIds.includes(client._id) ? 'rgba(0, 255, 0, 0.2)' : 'inherit',
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
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: getStatusColor(client.status),
                            color: getStatusColor(client.status),
                            backgroundColor: 'white',
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
      <Box sx={{ position: 'sticky', bottom: '1rem', width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff', outline: '4px solid #EEEEEE', boxShadow: '-1px -1px 36px #eeeeee' }}>
        <PromptInput 
          modelName="clients" 
          onSuccess={handlePromptSuccess}
          useExternalNotification={true}
        />
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
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
      <CreateClientModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onClientCreated={handleClientCreated}
        fetchClients={fetchClients}
      />
    </Box>
  );
}