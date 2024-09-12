import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead,
  TableRow, 
  Paper, 
  IconButton, 
  Box,
  Typography,
  Button,
  TextField,
  TextareaAutosize,
  CircularProgress,
  TableSortLabel,
  Checkbox,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ProjectQuickEditor = () => {
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [updatedProjects, setUpdatedProjects] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [savingStates, setSavingStates] = useState({});
  const [orderBy, setOrderBy] = useState('real_estate_company_name');
  const [order, setOrder] = useState('asc');
  const [uploadingStates, setUploadingStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState({
    real_estate_company_name: true,
    gallery: true,
    commercialConditions: true,
    discount: true,
    down_payment_bonus: true,
    installments: true,
  });

  const columnTranslations = {
    real_estate_company_name: 'Inmobiliaria',
    gallery: 'Imágenes',
    commercialConditions: 'Condiciones Comerciales',
    discount: 'Descuento',
    down_payment_bonus: 'Bono Pie',
    installments: 'Cuotas'
  };

  const fetchProjects = useCallback(async (organizationId) => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects?organizationId=${organizationId}`);
      if (!response.ok) throw new Error('Error al obtener los proyectos');
      const data = await response.json();
      const projectsWithNewFields = data.data.map(project => ({
        ...project,
        commercialConditions: project.commercialConditions || '',
        real_estate_company_name: project.real_estate_company?.name || '',
        discount: project.discount || 0,
        down_payment_bonus: project.down_payment_bonus || 0,
        installments: project.installments || 0,
      }));
      setProjects(projectsWithNewFields);
      setFilteredProjects(sortProjects(projectsWithNewFields, orderBy, order));
    } catch (error) {
      console.error('Error al obtener los proyectos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderBy, order]);

  useEffect(() => {
    if (session?.user?.organization?._id && isLoading) {
      fetchProjects(session.user.organization._id);
    }
  }, [session, fetchProjects, isLoading]);

  useEffect(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.real_estate_company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(sortProjects(filtered, orderBy, order));
  }, [searchTerm, projects, orderBy, order]);

  const sortProjects = (projectsToSort, sortBy, sortOrder) => {
    return [...projectsToSort].sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
      if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const onDrop = async (acceptedFiles, projectId) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingStates(prev => ({ ...prev, [projectId]: true }));

    try {
      const project = projects.find(p => p._id === projectId);
      const response = await fetch(`/api/uploadS3?organizationName=${session.user.organization.name}&organizationId=${session.user.organization._id}&projectName=${project.name}&projectId=${projectId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al subir la imagen');

      const data = await response.json();
      
      const updatedGallery = [...(project.gallery || []), data.url];
      
      const updatedProjects = projects.map(p => 
        p._id === projectId 
          ? { ...p, gallery: updatedGallery }
          : p
      );
      setProjects(updatedProjects);
      setFilteredProjects(sortProjects(updatedProjects, orderBy, order));

      setUpdatedProjects(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          gallery: updatedGallery
        }
      }));
    } catch (error) {
      console.error('Error al subir la imagen:', error);
    } finally {
      setUploadingStates(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const deleteImage = (projectId, imageUrl) => {
    const updatedProjects = projects.map(project => 
      project._id === projectId 
        ? { ...project, gallery: project.gallery.filter(url => url !== imageUrl) }
        : project
    );
    setProjects(updatedProjects);
    setFilteredProjects(sortProjects(updatedProjects, orderBy, order));

    setUpdatedProjects(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        gallery: updatedProjects.find(p => p._id === projectId).gallery
      }
    }));
  };

  const handleInputChange = (projectId, field, value) => {
    const updatedProjects = projects.map(p => 
      p._id === projectId ? { ...p, [field]: value } : p
    );
    setProjects(updatedProjects);
    setFilteredProjects(sortProjects(updatedProjects, orderBy, order));

    setUpdatedProjects(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [field]: value
      }
    }));
  };

  const handleSave = async (projectId) => {
    if (!updatedProjects[projectId]) return;

    setSavingStates(prev => ({ ...prev, [projectId]: 'saving' }));

    const project = projects.find(p => p._id === projectId);
    const updateData = {
      ...updatedProjects[projectId],
      name: project.name,
      county_id: project.county?.id,
      county_name: project.county?.name,
      real_estate_company_id: project.real_estate_company?.id,
      real_estate_company_name: project.real_estate_company?.name,
      region_id: project.region?.id,
      region_name: project.region?.name,
      organization_id: session.user.organization._id,
      commercialConditions: project.commercialConditions,
      discount: project.discount,
      down_payment_bonus: project.down_payment_bonus,
      installments: project.installments
    };

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el proyecto');
      }

      const updatedProject = await response.json();

      setUpdatedProjects(prev => {
        const { [projectId]: _, ...rest } = prev;
        return rest;
      });

      const updatedProjects = projects.map(p => 
        p._id === projectId 
          ? { ...p, ...updatedProject.data }
          : p
      );
      setProjects(updatedProjects);
      setFilteredProjects(sortProjects(updatedProjects, orderBy, order));

      setSavingStates(prev => ({ ...prev, [projectId]: 'saved' }));
      setTimeout(() => {
        setSavingStates(prev => ({ ...prev, [projectId]: null }));
      }, 2000);

      console.log('Proyecto actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
      setSavingStates(prev => ({ ...prev, [projectId]: null }));
    }
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleColumnVisibilityChange = (column) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Editor rápido de proyectos
      </Typography>
      <Box 
        position="sticky" 
        top={0} 
        zIndex={1000} 
        p={2}
        mb={2}
        bgcolor="white"
        sx={{borderRadius:'2rem', boxShadow:'0px 3px 5px rgba(0,0,0,0.2)'}}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar proyectos o inmobiliarias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box display="flex" flexWrap="wrap" gap={2} sx={{p:2}}>
            {Object.entries(columnVisibility).map(([column, isVisible]) => (
                <FormControlLabel
                key={column}
                control={
                    <Checkbox
                    checked={isVisible}
                    onChange={() => handleColumnVisibilityChange(column)}
                    size="small"
                    color="secondary"
                    />
                }
                label={columnTranslations[column] || column}
                sx={{ '& .MuiTypography-root': { fontSize: '0.875rem' } }}
                />
            ))}
            </Box>

      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader>
            <TableHead>
                <TableRow>
                    {columnVisibility.real_estate_company_name && (
                    <TableCell sx={{ minWidth: '10%', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        <TableSortLabel
                        active={orderBy === 'real_estate_company_name'}
                        direction={orderBy === 'real_estate_company_name' ? order : 'asc'}
                        onClick={() => handleSort('real_estate_company_name')}
                        >
                        Inmobiliaria
                        </TableSortLabel>
                    </TableCell>
                    )}
                    <TableCell sx={{ minWidth: '10%', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                    <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleSort('name')}
                    >
                        Proyecto
                    </TableSortLabel>
                    </TableCell>
                    {columnVisibility.gallery && (
                    <TableCell sx={{ minWidth: '30%', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        Imágenes
                    </TableCell>
                    )}
                    {columnVisibility.commercialConditions && (
                    <TableCell sx={{ minWidth: '30%', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        Condiciones Comerciales
                    </TableCell>
                    )}
                    {columnVisibility.discount && (
                    <TableCell sx={{ minWidth: '10%', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        Descuento %
                    </TableCell>
                    )}
                    {columnVisibility.down_payment_bonus && (
                    <TableCell sx={{ minWidth: '10%', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        Bono Pie %
                    </TableCell>
                    )}
                    {columnVisibility.installments && (
                    <TableCell sx={{ minWidth: '10%', textAlign: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                        Cuotas
                    </TableCell>
                    )}
                    <TableCell sx={{ maxWidth: '5%', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>Acciones</TableCell>
                </TableRow>
                </TableHead>
            <TableBody>
            {filteredProjects.map((project) => (
                <TableRow
                key={project._id}
                sx={{
                    bgcolor: updatedProjects[project._id] ? 'rgba(108, 214, 63, 0.1)' : 'inherit',
                }}
                >
                <TableCell>{project.real_estate_company_name}</TableCell>
                <TableCell>{project.name}</TableCell>
                {columnVisibility.gallery && (
                    <TableCell>
                    <Box display="flex" flexWrap="wrap" alignItems="center">
                        {project.gallery &&
                        project.gallery.map((imageUrl, index) => (
                            <Box key={imageUrl} position="relative" m={1}>
                            <img
                                src={imageUrl}
                                alt={`Proyecto ${index}`}
                                style={{ width: 80, height: 80, objectFit: 'cover' }} // Ajuste de tamaño de imagen
                            />
                            <IconButton
                                size="small"
                                onClick={() => deleteImage(project._id, imageUrl)}
                                style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                backgroundColor: 'white',
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                            </Box>
                        ))}
                        <ImageDropzone
                        onDrop={(files) => onDrop(files, project._id)}
                        isUploading={uploadingStates[project._id]}
                        />
                    </Box>
                    </TableCell>
                )}
                {columnVisibility.commercialConditions && (
                    <TableCell>
                    <TextareaAutosize
                        minRows={3}
                        style={{ width: '100%', padding: '6px', fontSize: '14px' }} // Ajuste de padding y tamaño de fuente
                        value={project.commercialConditions}
                        onChange={(e) =>
                        handleInputChange(
                            project._id,
                            'commercialConditions',
                            e.target.value
                        )
                        }
                    />
                    </TableCell>
                )}
                {columnVisibility.discount && (
                    <TableCell sx={{ textAlign: 'center' }}>
                    <TextField
                        type="number"
                        sx={{
                        padding: '4px',
                        minWidth: '40px',
                        width: '70px',
                        textAlign: 'center',
                        }}
                        InputProps={{
                        inputProps: { min: 0, max: 99, step: 0.1, style: { textAlign: 'center' } },
                        disableUnderline: true, // Remueve el subrayado
                        // CSS para eliminar las flechas del input en navegadores
                        sx: {
                            '& input[type=number]': {
                            MozAppearance: 'textfield', // Eliminar flechas en Firefox
                            },
                            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                            {
                                WebkitAppearance: 'none', // Eliminar flechas en Chrome, Safari y Edge
                                margin: 0,
                            },
                        },
                        }}
                        value={project.discount}
                        onChange={(e) =>
                        handleInputChange(project._id, 'discount', parseFloat(e.target.value))
                        }
                    />
                    </TableCell>
                )}
                {columnVisibility.down_payment_bonus && (
                    <TableCell sx={{ textAlign: 'center' }}>
                    <TextField
                        type="number"
                        sx={{
                        padding: '4px',
                        minWidth: '40px',
                        width: '70px',
                        textAlign: 'center',
                        }}
                        InputProps={{
                        inputProps: { min: 0, max: 99, step: 0.01, style: { textAlign: 'center' } },
                        disableUnderline: true, // Remueve el subrayado
                        // CSS para eliminar las flechas del input en navegadores
                        sx: {
                            '& input[type=number]': {
                            MozAppearance: 'textfield', // Eliminar flechas en Firefox
                            },
                            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                            {
                                WebkitAppearance: 'none', // Eliminar flechas en Chrome, Safari y Edge
                                margin: 0,
                            },
                        },
                        }}
                        value={project.down_payment_bonus}
                        onChange={(e) =>
                        handleInputChange(
                            project._id,
                            'down_payment_bonus',
                            parseFloat(e.target.value)
                        )
                        }
                    />
                    </TableCell>
                )}
                {columnVisibility.installments && (
                    <TableCell sx={{ textAlign: 'center' }}>
                    <TextField
                        type="number"
                        sx={{
                        padding: '4px',
                        minWidth: '40px',
                        width: '60px',
                        textAlign: 'center',
                        }}
                        InputProps={{
                        inputProps: { min: 0, max: 99, step: 1, style: { textAlign: 'center' } },
                        disableUnderline: true, // Remueve el subrayado
                        // CSS para eliminar las flechas del input en navegadores
                        sx: {
                            '& input[type=number]': {
                            MozAppearance: 'textfield', // Eliminar flechas en Firefox
                            },
                            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                            {
                                WebkitAppearance: 'none', // Eliminar flechas en Chrome, Safari y Edge
                                margin: 0,
                            },
                        },
                        }}
                        value={project.installments}
                    
                        onChange={(e) =>
                        handleInputChange(project._id, 'installments', parseInt(e.target.value, 10))
                        }
                    />
                    </TableCell>
                )}
                <TableCell>
                    <Button
                    variant="contained"
                    onClick={() => handleSave(project._id)}
                    disabled={!updatedProjects[project._id] || savingStates[project._id] === 'saving'}
                    sx={{
                        bgcolor: updatedProjects[project._id] ? '#6CD63F' : 'rgba(0, 0, 0, 0.12)',
                        color: updatedProjects[project._id] ? 'white' : 'rgba(0, 0, 0, 0.26)',
                        '&:hover': {
                        bgcolor: updatedProjects[project._id] ? '#5BC22F' : 'rgba(0, 0, 0, 0.12)',
                        },
                        '&.Mui-disabled': {
                        bgcolor: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)',
                        },
                    }}
                    >
                    {savingStates[project._id] === 'saving' ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : savingStates[project._id] === 'saved' ? (
                        <CheckCircleIcon />
                    ) : (
                        'GUARDAR'
                    )}
                    </Button>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </TableContainer>



    </Box>
  );
};

const ImageDropzone = ({ onDrop, isUploading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Box
      {...getRootProps()}
      width={100}
      height={100}
      border={2}
      borderColor="grey.300"
      borderStyle="dotted"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor={isDragActive ? 'grey.100' : 'white'}
      position="relative"
      sx={{borderStyle:'dashed', borderColor:"grey.300", bgcolor:(isDragActive ? 'grey.100' : 'white')}}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <CircularProgress size={24} />
      ) : (
        <Typography variant="body2" color="textSecondary" textAlign="center">
          {isDragActive ? 'Suelta aquí' : 'Arrastra imágenes'}
        </Typography>
      )}
    </Box>
  );
};

export default ProjectQuickEditor;
