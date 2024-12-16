// pages/profile/[id].js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  TextField,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import { ROLES } from '@/lib/auth/permissions/roles';
import EditIcon from '@mui/icons-material/Edit';
import slugify from 'slugify';

export default function UserProfile() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleCancelEdit = () => {
    setName(session?.user?.name || '');
    setIsEditing(false);
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || !session?.user?.organization) return;

    setIsSavingAvatar(true);
    try {
      const organizationName = slugify(session.user.organization.name, { lower: true, strict: true });
      const organizationId = session.user.organization._id;

      const formData = new FormData();
      formData.append('file', file);

      const queryParams = new URLSearchParams({
        organizationName,
        organizationId,
        type: 'avatars'
      }).toString();

      const response = await fetch(`/api/uploadS3?${queryParams}`, {
        method: 'POST',
        headers: {
          'x-organization-id': session.user.organization._id
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir imagen');
      }

      const data = await response.json();
      
      const updateResponse = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify({ image: data.url })
      });

      if (!updateResponse.ok) {
        throw new Error('Error al actualizar avatar en la base de datos');
      }

      await update();

      setNotification({
        open: true,
        message: 'Avatar actualizado exitosamente',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error:', error);
      setNotification({
        open: true,
        message: error.message || 'Error al actualizar el avatar',
        severity: 'error'
      });
    } finally {
      setIsSavingAvatar(false);
    }
};

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar nombre');
      }

      await update();
      setIsEditing(false);
      setNotification({
        open: true,
        message: 'Nombre actualizado exitosamente',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error:', error);
      setNotification({
        open: true,
        message: error.message || 'Error al actualizar el nombre',
        severity: 'error'
      });
    } finally {
      setIsSavingName(false);
    }
};

  if (status === "loading") {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    router.push('/auth/sign-in');
    return null;
  }

  return (
    <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Box {...getRootProps()} sx={{ position: 'relative', cursor: isSavingAvatar ? 'wait' : 'pointer' }}>
            <input {...getInputProps()} disabled={isSavingAvatar} />
            <Avatar 
              src={session.user.image} 
              alt={session.user.name}
              sx={{ 
                width: 100, 
                height: 100, 
                fontSize:'14px',
                mr: 0,
                opacity: isSavingAvatar ? 0.6 : 1,
                '&:hover': {
                  opacity: isSavingAvatar ? 0.6 : 0.7,
                  '&::after': {
                    content: `"${isSavingAvatar ? 'Guardando...' : 'Cambiar'}"`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white'
                  }
                }
              }}
            />
            {isSavingAvatar && (
              <CircularProgress 
                size={24}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px'
                }}
              />
            )}
          </Box>
          <Box sx={{ml:2}}>
          {isEditing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="small"
                fullWidth
                disabled={isSavingName}
              />
              <Button 
                variant="contained" 
                size="small"
                onClick={handleSaveName}
                disabled={isSavingName}
                sx={{fontSize:'11px', width:'120px'}}
              >
                {isSavingName ? 'Guardando' : 'Guardar'}
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleCancelEdit}
                disabled={isSavingName}
                sx={{fontSize:'11px', width:'120px'}}
              >
                Cancelar
              </Button>
            </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4">
                  {session.user.name}
                </Typography>
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon />
                </IconButton>
              </Box>
            )}
            <Typography variant="body1" color="textSecondary">
              {session.user.email}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{py:2}}>
              <CardContent sx={{pt:0}}>
                <Typography variant="h6" gutterBottom color="primary">
                  Información de Usuario
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Rol
                  </Typography>
                  <Typography variant="body1">
                    {ROLES[session.user.role]?.description || session.user.role}
                  </Typography>
                </Box>
                {session.user.organization?.domain && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Dominio
                    </Typography>
                    <Typography variant="body1">
                      {session.user.organization.domain}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estado
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: session.user.active === false ? 'error.main' : 'success.main'
                    }}
                  >
                    {session.user.active === false ? 'Inactivo' : 'Activo'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{py:2}}>
              <CardContent sx={{pt:0}}>
                <Typography variant="h6" gutterBottom color="primary">
                <Avatar 
                  src={session.user.organization?.logo} 
                  alt={session.user.organization?.name}/>{session.user.organization?.name}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1">
                    {session.user.organization?.address}
                  </Typography>
                </Box>
                
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}