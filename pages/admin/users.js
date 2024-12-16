// pages/admin/users.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Select,
  MenuItem,
  IconButton,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import { ROLES } from '@/lib/auth/permissions/roles';
import PermissionsModal from '@/components/users/PermissionsModal';
import { Snackbar, Alert } from '@mui/material';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';

const StyledSwitch = styled(Switch)(({ theme }) => ({
    width: 64,
    height: 28,
    padding: 0,
    display: 'flex',
    '& .MuiSwitch-switchBase': {
      padding: 2,
      '&.Mui-checked': {
        transform: 'translateX(36px)',
        color: theme.palette.secondary.main,
        '& + .MuiSwitch-track': {
          backgroundColor: theme.palette.secondary.main,
          opacity: 0.5,
          border: 0,
        },
        '& .MuiSwitch-thumb': {
          backgroundColor: theme.palette.secondary.main,
          '&:before': {
            content: "'Sí'",
          },
        },
      },
      '& .MuiSwitch-thumb': {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ED4A1A',
        position: 'relative',
        '&:before': {
          content: "'No'",
          position: 'absolute',
          width: '100%',
          height: '100%',
          left: 0,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
        },
      },
    },
    '& .MuiSwitch-track': {
      borderRadius: 14,
      opacity: 0.3,
      backgroundColor: ({ checked }) => checked ? theme.palette.secondary.main : '#ED4A1A',
      boxSizing: 'border-box',
    },
  }));

export default function AdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'sales_agent'
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (session?.user?.organization?._id) {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/users?organizationId=${session.user.organization._id}`
      );
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setUsers(result.data);
    } catch (error) {
      setError(error.message);
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role: newRole,
          customPermissions: null // Reseteamos los permisos customizados
        })
      });
  
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
  
      setUsers(currentUsers => 
        currentUsers.map(user => 
          user._id === userId 
            ? { ...user, role: newRole, customPermissions: null }
            : user
        )
      );
  
      setSnackbar({
        open: true,
        message: 'Rol y permisos actualizados correctamente',
        severity: 'success'
      });
  
    } catch (error) {
      console.error('Error updating role:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el rol',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleManagePermissions = (user) => {
    setSelectedUserForPermissions(user);
    setPermissionsModalOpen(true);
  };

  const handlePermissionsSave = async (updatedPermissions) => {
    try {
      const response = await fetch(`/api/users/${selectedUserForPermissions._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPermissions)
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      setUsers(currentUsers => 
        currentUsers.map(user => 
          user._id === selectedUserForPermissions._id
            ? { ...user, ...updatedPermissions }
            : user
        )
      );
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          organizationId: session.user.organization._id
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      await fetchUsers();
      
      setNewUser({
        name: '',
        email: '',
        role: 'sales_agent'
      });
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography variant="h6">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Administración de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
        <TableHead>
            <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell> {/* Nueva columna */}
                <TableCell>Habilitado</TableCell>
            </TableRow>
            </TableHead>
          <TableBody>
            {users.map((user) => {
              const isSelf = user._id === session.user.id;
              
              if (isSelf) return null;

              return (
                    <TableRow 
                    key={user._id}
                    sx={{ 
                        opacity: user.active === false ? 0.5 : 1,
                        backgroundColor: user.active === false ? 'action.hover' : 'inherit'
                    }}
                    >
                    <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={user.role || 'sales_agent'}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      >
                        {Object.keys(ROLES).map((role) => (
                          <MenuItem key={role} value={role}>
                            {ROLES[role].description}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => {
                          setSelectedUser(user);
                          setOpenModal(true);
                        }} 
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleManagePermissions(user)} 
                        size="small"
                        color={user.customPermissions ? "warning" : "default"}
                      >
                        <SecurityIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StyledSwitch
                        checked={user.active !== false}
                        onChange={async (e) => {
                        const isActive = e.target.checked;
                        try {
                            const response = await fetch(`/api/users/${user._id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ active: isActive })
                            });

                            const result = await response.json();
                            
                            if (!result.success) {
                            throw new Error(result.error);
                            }

                            setUsers(currentUsers => 
                            currentUsers.map(u => 
                                u._id === user._id 
                                ? { ...u, active: isActive }
                                : u
                            )
                            );

                            setSnackbar({
                            open: true,
                            message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`,
                            severity: 'success'
                            });
                        } catch (error) {
                            console.error('Error updating user status:', error);
                            setSnackbar({
                            open: true,
                            message: 'Error al actualizar el estado del usuario',
                            severity: 'error'
                            });
                        }
                        }}
                        size="small"
                        title={user.active !== false ? 'Usuario habilitado' : 'Usuario deshabilitado'}
                    />
                    </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Edición */}
      <Dialog 
        open={openModal} 
        onClose={() => {
          setOpenModal(false);
          setSelectedUser(null);
        }}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={selectedUser?.name || ''}
              onChange={(e) => setSelectedUser({ 
                ...selectedUser, 
                name: e.target.value 
              })}
              fullWidth
            />
            <TextField
              label="Email"
              value={selectedUser?.email || ''}
              disabled
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenModal(false);
            setSelectedUser(null);
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={async () => {
              try {
                const response = await fetch(`/api/users/${selectedUser._id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(selectedUser)
                });

                const result = await response.json();
                
                if (!result.success) {
                  throw new Error(result.error);
                }

                setUsers(currentUsers =>
                  currentUsers.map(user =>
                    user._id === selectedUser._id
                      ? { ...user, name: selectedUser.name }
                      : user
                  )
                );
                setOpenModal(false);
                setSelectedUser(null);
              } catch (error) {
                console.error('Error updating user:', error);
              }
            }} 
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Permisos */}
      <PermissionsModal
        open={permissionsModalOpen}
        onClose={() => {
          setPermissionsModalOpen(false);
          setSelectedUserForPermissions(null);
        }}
        user={selectedUserForPermissions}
        roles={ROLES}
        onSave={handlePermissionsSave}
      />

      {/* Modal de Creación */}
      <Dialog 
        open={createModalOpen} 
        onClose={() => setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Nombre"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                {Object.keys(ROLES).map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLES[role].description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCreateModalOpen(false);
              setNewUser({
                name: '',
                email: '',
                role: 'sales_agent'
              });
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateUser}
            variant="contained"
            disabled={!newUser.name || !newUser.email}
          >
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>
        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
            <Alert 
                onClose={handleCloseSnackbar} 
                severity={snackbar.severity}
                variant="filled"
                sx={{ width: '100%' }}
            >
                {snackbar.message}
            </Alert>
        </Snackbar>
    </Box>
  );
}