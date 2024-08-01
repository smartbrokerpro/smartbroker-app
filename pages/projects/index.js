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
  Popover,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  Button,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import PromptInput from '@/components/PromptInput';
import { TableRows, GridView, MoreVert } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@mui/material/styles';
import LottieLoader from '@/components/LottieLoader';
import ProjectCard from '@/components/ProjectCard';
import { Edit as EditIcon, Delete as DeleteIcon, AddBox as EditStockIcon } from '@mui/icons-material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { NumberFormatter } from '@/utils/formatNumber';
import { useSession } from 'next-auth/react';

const fallbackImage = '/images/fallback.jpg';

const ProjectsPage = () => {
  const { data: session, status } = useSession(); 
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
  const [isRefetching, setIsRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const [promptFocused, setPromptFocused] = useState(false);
  const rowsPerPage = 10;
  const { collapsed } = useSidebarContext();
  const theme = useTheme();
  const router = useRouter();
  const showNotification = useNotification();
  const projectRefs = useRef({});
  const containerRef = useRef(null);

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Usuario autenticado, fetching proyectos...');
      fetchProjects();
    }
  }, [status]);

  useEffect(() => {
    if (updatedProjectId) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [projects]);

  useEffect(() => {
    if (updatedProjectId) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [updatedProjectId]);

  const fetchProjects = useCallback(async () => {
    console.log('Fetching proyectos para la organización:', session.user.organization._id);
    setIsRefetching(true);
    const response = await fetch(`/api/projects?organizationId=${session.user.organization._id}`);
    const data = await response.json();
    if (data.success) {
      setProjects(data.data);
      console.log('Proyectos fetch exitoso:', data.data);
    } else {
      console.error('Error fetching proyectos:', data);
    }
    setIsRefetching(false);
    setLoading(false);
  }, [session]);

  async function handleUpdateProject(e) {
    e.preventDefault();
    if (!updatePrompt.trim()) {
      setNotification({ open: true, message: 'El prompt no puede estar vacío', severity: 'error' });
      return;
    }
  
    setIsSubmitting(true);
  try {
    const response = await fetch('/api/gpt/projects', {
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
        modelName: 'projects'
      }),
    });
  
      const result = await response.json();
  
      if (response.ok) {
        setNotification({ open: true, message: 'Operación exitosa', severity: 'success' });
        setUpdatePrompt('');
  
        const updatedId = result.updatedProjectId || result.deletedProjectId || result.createdProjectId;
        if (updatedId) {
          setUpdatedProjectId(updatedId);
          fetchProjects();
          setTimeout(() => {
            setUpdatedProjectId(null);
          }, 3000);
        } else {
          fetchProjects();
        }
  
        // Disparar evento personalizado para actualizar créditos
        const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: result.credits } });
        window.dispatchEvent(creditUpdateEvent);
        
      } else {
        setNotification({ open: true, message: result.error || 'Error en la operación', severity: 'error' });
      }
    } catch (error) {
      setNotification({ open: true, message: 'Error en la operación', severity: 'error' });
    }
    setIsSubmitting(false);
  }
  
  const handlePromptSuccess = (result, updatedId) => {
    fetchProjects();
    if (updatedId) {
      setUpdatedProjectId(updatedId);
      setTimeout(() => {
        setUpdatedProjectId(null);
      }, 3000);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredProjects = useMemo(() => projects.filter(project => {
    const query = searchQuery.toLowerCase();
    return (
      (project.name && project.name.toLowerCase().includes(query)) ||
      (project.address && project.address.toLowerCase().includes(query)) ||
      (project.typologies && project.typologies.some(typology => typology.toLowerCase().includes(query))) ||
      (project.min_price && project.min_price.toString().includes(query)) ||
      (project.max_price && project.max_price.toString().includes(query)) ||
      (project.real_estate_company.name && project.real_estate_company.name.toLowerCase().includes(query)) ||
      (project.county.name && project.county.name.toLowerCase().includes(query))
    );
  }), [projects, searchQuery]);

  const handleMenuClick = useCallback((event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedProject(null);
  }, []);

  const handleEdit = useCallback(() => {
    router.push(`/projects/${selectedProject._id}/edit`);
    handleMenuClose();
  }, [selectedProject, handleMenuClose, router]);

  const handleDelete = useCallback(() => {
    console.log('Eliminar proyecto:', selectedProject._id);
    handleMenuClose();
  }, [selectedProject, handleMenuClose]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handlePromptFocus = () => {
    setPromptFocused(true);
  };

  const handlePromptBlur = () => {
    setPromptFocused(false);
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
        <Typography variant="h4" component="h1" gutterBottom color="primary">Proyectos</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <TextField
            variant="outlined"
            placeholder="Búsqueda rápida"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={handlePromptFocus}
            onBlur={handlePromptBlur}
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
            <LottieLoader message="Actualizando..." />
          </Box>
        )}
        {viewMode === 'grid' ? (
          <Grid container spacing={4}>
            {filteredProjects.slice(0, promptFocused ? 9 : filteredProjects.length).map(project => (
              <Grid item key={project._id} xs={12} sm={6} md={4}>
                <ProjectCard
                  ref={el => projectRefs.current[project._id] = el}
                  project={project}
                  updatedProjectId={updatedProjectId}
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
                    <TableCell>Proyecto</TableCell>
                    <TableCell>Inmobiliaria</TableCell>
                    <TableCell>Dirección</TableCell>
                    <TableCell>Comuna</TableCell>
                    <TableCell>Tipologías</TableCell>
                    <TableCell>Valores</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(project => (
                    <TableRow
                      key={project._id}
                      ref={el => projectRefs.current[project._id] = el}
                      sx={{
                        backgroundColor: updatedProjectId === project._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
                        transition: 'background-color 0.5s ease-in-out'
                      }}
                    >
                      <TableCell>
                        <Avatar alt={project.name} src={project.gallery[0]} />
                      </TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.real_estate_company.name}</TableCell>
                      <TableCell>{project.address}</TableCell>
                      <TableCell>{project.county.name}</TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={Math.ceil(filteredProjects.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
            Editar proyecto
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => router.push(`/projects/${selectedProject?._id}/edit-stock`)}>
          <ListItemIcon>
            <EditNoteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
            Editar stock
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
      <Box sx={{ position: 'sticky', bottom: '4px', width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff', outline: '4px solid #EEEEEE', boxShadow: '-1px -1px 36px #eeeeee' }}>
        <form onSubmit={handleUpdateProject}>
          <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              aria-label="Crea, modifica o elimina proyectos"
              placeholder="Crea, modifica o elimina proyectos"
              multiline
              minRows={1}
              maxRows={6}
              variant="outlined"
              fullWidth
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              onFocus={handlePromptFocus}
              onBlur={handlePromptBlur}
              onKeyPress={(e) => { if (e.key === 'Enter') handleUpdateProject(e); }}
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
      <Box sx={{ position: 'sticky', bottom: '84px', width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff', outline: '4px solid #EEEEEE', boxShadow: '-1px -1px 36px #eeeeee' }}>
        <PromptInput modelName="projects" onSuccess={handlePromptSuccess} />
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
    </Box>
  );
}

export default ProjectsPage;
