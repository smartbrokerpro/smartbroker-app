'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  useTheme,
  Button,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
 TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  Popover,
  MenuItem,
} from '@mui/material';
import { TableRows, GridView, MoreVert } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';

const fallbackImage = '/images/fallback.jpg'; // Asegúrate de que la ruta sea correcta y la imagen exista en esa ruta

const formatNumber = (value, decimals) => {
  if (value == null) return 'N/A'; // Manejar valores nulos o indefinidos
  const cleanedValue = value.toString().replace(/,/g, ''); // Asegurarse de que el valor sea una cadena antes de reemplazar
  const numberValue = parseFloat(cleanedValue);
  const formattedValue = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numberValue);
  return formattedValue;
};

const NumberFormatter = ({ value, decimals = 2 }) => {
  const formattedValue = formatNumber(value, decimals);
  return <>{formattedValue}</>;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [updatedProjectId, setUpdatedProjectId] = useState(null);
  const [isRefetching, setIsRefetching] = useState(false); // Nuevo estado para manejar el refetch
  const { collapsed } = useSidebarContext();
  const theme = useTheme();
  const router = useRouter();
  const showNotification = useNotification();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsRefetching(true);
    const response = await fetch('/api/projects');
    const data = await response.json();
    if (data.success) {
      setProjects(data.data);
    }
    setIsRefetching(false);
    setLoading(false);
  }

  async function handleUpdateProject() {
    if (!updatePrompt.trim()) {
      setNotification({ open: true, message: 'El prompt no puede estar vacío', severity: 'error' });
      return;
    }
  
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/gpt/gpt-handler', {
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
  
        const updatedId = result.updatedProjectId || result.deletedProjectId || result.createdProjectId;
        if (updatedId) {
          console.log(`Updated/Deleted/Created project ID: ${updatedId}`);
          setUpdatedProjectId(updatedId);
          fetchProjects(); // Refetch projects to update the list
          setTimeout(() => {
            console.log(`Removing highlight for project ID: ${updatedId}`);
            setUpdatedProjectId(null);
          }, 3000);
        } else {
          fetchProjects(); // Refetch projects even if no specific ID is returned
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

  const filteredProjects = projects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      (project.name && project.name.toLowerCase().includes(query)) ||
      (project.address && project.address.toLowerCase().includes(query)) ||
      (project.typologies && project.typologies.some(typology => typology.toLowerCase().includes(query))) ||
      (project.min_price && project.min_price.toString().includes(query)) ||
      (project.max_price && project.max_price.toString().includes(query))
    );
  });

  const handleMenuClick = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">Proyectos</Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Búsqueda rápida"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2, flex: 1, mr: 2, height: 40 }}
            InputProps={{
              style: { fontSize: '0.875rem', height: '2.5rem' },
            }}
            helperText={`${filteredProjects.length} de ${projects.length} proyectos encontrados`}
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
            <CircularProgress size={24} />
          </Box>
        )}

        {viewMode === 'grid' ? (
          <Grid container spacing={4}>
            {filteredProjects.map(project => (
              <Grid item key={project._id} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    bgcolor: theme.palette.background.paper,
                    backgroundColor: updatedProjectId === project._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
                    transition: 'background-color 0.5s ease-in-out',
                    mb: 3
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundImage: `url(${fallbackImage})`,
                    }}
                    title={project.name}
                  />
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.palette.text.primary }}
                    >
                      {project.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.palette.text.secondary }}
                    >
                      {project.address}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {project.typologies.map((typology, index) => (
                        <Chip key={index} label={typology} color="primary" variant="outlined" size="small" />
                      ))}
                    </Box>
                    <Chip
                      label={
                        <>
                          <NumberFormatter value={project.min_price} decimals={0} /> - <NumberFormatter value={project.max_price} decimals={0} /> UF
                        </>
                      }
                      color="secondary"
                    />
                    <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button color="primary" variant="contained" onClick={() => router.push(`/projects/${project._id}/stock`)}>
                        Ver Stock
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Tipologías</TableCell>
                  <TableCell>Precios</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map(project => (
                  <TableRow
                    key={project._id}
                    sx={{
                      backgroundColor: updatedProjectId === project._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
                      transition: 'background-color 0.5s ease-in-out'
                    }}
                  >
                    <TableCell>
                      <Avatar alt={project.name} src={fallbackImage} />
                    </TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.address}</TableCell>
                    <TableCell>
                      {project.typologies.map((typology, index) => (
                        <Chip key={index} label={typology} color="primary" variant="outlined" size="small" />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          <>
                            <NumberFormatter value={project.min_price} decimals={0} /> - <NumberFormatter value={project.max_price} decimals={0} /> UF
                          </>
                        }
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="more"
                        aria-controls="long-menu"
                        aria-haspopup="true"
                        onClick={(e) => handleMenuClick(e, project)}
                      >
                        <MoreVert />
                      </IconButton>
                      <Popover
                        id="long-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'left',
                        }}
                        sx={{
                          '& .MuiPaper-root': {
                            boxShadow: 'none',
                            borderRadius: '1rem',
                          },
                        }}
                      >
                        <MenuItem onClick={() => {
                          router.push(`/projects/${selectedProject?._id}/stock`);
                          handleMenuClose();
                        }}>
                          Ver Stock
                        </MenuItem>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: collapsed ? '60px' : '240px',
          right: 0,
          backgroundColor: '#0E0F10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          zIndex: 1000,
          transition: 'left 0.3s ease',
        }}
      >
        <TextField
          variant="outlined"
          placeholder="Escribe tu solicitud para actualizar un proyecto"
          value={updatePrompt}
          onChange={(e) => setUpdatePrompt(e.target.value)}
          sx={{
            width: '70%',
            marginRight: '1rem',
            input: { color: 'white' },
            fieldset: { borderColor: '#ccc', borderRadius: '1rem' },
            '&:hover fieldset': { borderColor: '#ccc !important' },
          }}
          InputProps={{
            style: { color: 'white' },
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdateProject}
                  disabled={isSubmitting || !updatePrompt.trim()}
                  sx={{
                    width: isSubmitting ? 'auto' : '100px',
                    transition: 'width 0.3s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Ejecutar'}
                </Button>
              </InputAdornment>
            ),
          }}
        />
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
    </div>
  );
}
