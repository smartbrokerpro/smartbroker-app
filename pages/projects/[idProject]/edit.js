import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Autocomplete,
  Snackbar,
  Alert,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import { ChevronLeft } from '@mui/icons-material';
import Link from 'next/link';
import slugify from 'slugify';



const MemoizedAutocomplete = React.memo(Autocomplete);

const EditProject = () => {
  const router = useRouter();
  const { idProject } = router.query;
  const { data: session } = useSession();

  // Estados
  const [project, setProject] = useState(null);
  const [regions, setRegions] = useState([]);
  const [counties, setCounties] = useState([]);
  const [realEstateCompanies, setRealEstateCompanies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedRealEstateCompany, setSelectedRealEstateCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Funciones de carga de datos
  const fetchInitialData = useCallback(async () => {
    if (!idProject || !session?.user?.organization?._id) return;

    try {
      setLoading(true);
      const [regionsData, companiesData, projectData] = await Promise.all([
        fetch('/api/regions').then(res => res.json()),
        fetch('/api/real_estate_companies').then(res => res.json()),
        fetch(`/api/projects/${idProject}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-organization-id': session.user.organization._id
          }
        }).then(res => res.json())
      ]);

      if (!regionsData.success || !companiesData.success || !projectData.success) {
        throw new Error('Error fetching data');
      }

      setRegions(regionsData.data);
      setRealEstateCompanies(companiesData.data);
      setProject(projectData.data);

      // Precargar selecciones
      const region = regionsData.data.find(r => r._id === projectData.data.region_id);
      setSelectedRegion(region || null);
      
      if (region) {
        const countiesData = await fetch(`/api/counties?region_id=${region._id}`).then(res => res.json());
        if (countiesData.success) {
          setCounties(countiesData.data);
          const county = countiesData.data.find(c => c._id === projectData.data.county_id);
          setSelectedCounty(county || null);
        }
      }
      
      const company = companiesData.data.find(c => c._id === projectData.data.real_estate_company_id);
      setSelectedRealEstateCompany(company || null);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setNotification({ open: true, message: 'Error cargando datos iniciales', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [idProject, session]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manejadores de cambio
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRegionChange = useCallback(async (event, value) => {
    setSelectedRegion(value);
    setSelectedCounty(null);
    if (value) {
      try {
        const countiesData = await fetch(`/api/counties?region_id=${value._id}`).then(res => res.json());
        if (countiesData.success) {
          setCounties(countiesData.data);
        } else {
          throw new Error('Error fetching counties');
        }
      } catch (error) {
        console.error('Error fetching counties:', error);
        setNotification({ open: true, message: 'Error cargando comunas', severity: 'error' });
      }
    } else {
      setCounties([]);
    }
    setProject(prev => ({ ...prev, region_id: value?._id, county_id: null }));
  }, []);

  const handleCountyChange = useCallback((event, value) => {
    setSelectedCounty(value);
    setProject(prev => ({ ...prev, county_id: value?._id }));
  }, []);

  const handleRealEstateCompanyChange = useCallback((event, value) => {
    setSelectedRealEstateCompany(value);
    setProject(prev => ({ ...prev, real_estate_company_id: value?._id }));
  }, []);

  // Manejo de imágenes
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!project || !project.name) {
      setNotification({ open: true, message: 'Error: Nombre del proyecto no disponible', severity: 'error' });
      return;
    }
  
    const projectSlug = slugify(project.name, { lower: true, strict: true });
    const projectFolder = `${projectSlug}_${Math.floor(Date.now() / 1000)}`;
  
    console.log('Frontend - Project Folder:', projectFolder);
  
    const uploadPromises = acceptedFiles.map(file => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
  
        console.log('Frontend - Sending file:', file.name);
  
        fetch(`/api/uploadS3?projectFolder=${encodeURIComponent(projectFolder)}`, {
          method: 'POST',
          body: formData,
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          return response.json();
        })
        .then(data => {
          console.log('Frontend - Received URL:', data.url);
          resolve(data.url);
        })
        .catch(error => {
          console.error('Frontend - Error uploading:', error);
          reject(error);
        });
      });
    });
  
    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('Frontend - All uploaded URLs:', uploadedUrls);
      setProject(prev => ({
        ...prev,
        gallery: [...(prev.gallery || []), ...uploadedUrls],
      }));
      setNotification({ open: true, message: 'Imágenes subidas con éxito', severity: 'success' });
    } catch (error) {
      console.error('Frontend - Error in onDrop:', error);
      setNotification({ open: true, message: 'Error al subir imágenes', severity: 'error' });
    }
  }, [project]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Manejo de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const projectToUpdate = {
        ...project,
        location: project.location ? `${project.location.lat}, ${project.location.lng}` : '',
        real_estate_company_name: selectedRealEstateCompany?.name,
        county_name: selectedCounty?.name,
        region_name: selectedRegion?.region
      };
      const response = await fetch(`/api/projects/${idProject}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify(projectToUpdate),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setNotification({ open: true, message: 'Proyecto actualizado con éxito', severity: 'success' });
      } else {
        throw new Error(data.error || 'Error al actualizar el proyecto');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setNotification({ open: true, message: error.message, severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Link href="/projects" passHref>
        <Button 
          startIcon={<ChevronLeft />} 
          variant="outlined" 
          color="primary"
          sx={{ mb: 3 }}
          component="a"
        >
          Volver a Proyectos
        </Button>
      </Link>
      <Typography variant="h4" gutterBottom>
        Editando proyecto: {project?.name}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Nombre del proyecto"
          name="name"
          value={project?.name || ''}
          onChange={handleInputChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Dirección"
          name="address"
          value={project?.address || ''}
          onChange={handleInputChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Ubicación (lat, lng)"
          name="location"
          value={project?.location ? `${project.location.lat}, ${project.location.lng}` : ''}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(coord => parseFloat(coord.trim()));
            setProject(prev => ({ ...prev, location: { lat, lng } }));
          }}
          helperText="Ingrese la latitud y longitud separadas por coma"
        />
        <MemoizedAutocomplete
          options={regions}
          getOptionLabel={(option) => option?.region || ''}
          value={selectedRegion}
          onChange={handleRegionChange}
          isOptionEqualToValue={(option, value) => option?._id === value?._id}
          renderInput={(params) => <TextField {...params} label="Región" margin="normal" />}
        />
        <MemoizedAutocomplete
          options={counties}
          getOptionLabel={(option) => option.name}
          value={selectedCounty}
          onChange={handleCountyChange}
          renderInput={(params) => <TextField {...params} label="Comuna" margin="normal" />}
        />
        <MemoizedAutocomplete
          options={realEstateCompanies}
          getOptionLabel={(option) => option.name}
          value={selectedRealEstateCompany}
          onChange={handleRealEstateCompanyChange}
          renderInput={(params) => <TextField {...params} label="Inmobiliaria" margin="normal" />}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          margin="normal"
          label="Condiciones Comerciales"
          name="commercialConditions"
          value={project?.commercialConditions || ''}
          onChange={handleInputChange}
        />
        
        {/* Zona de carga de imágenes */}
        <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', p: 2, mt: 2, textAlign: 'center' }}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Suelta las imágenes aquí...</p>
          ) : (
            <p>Arrastra y suelta imágenes aquí, o haz clic para seleccionar archivos</p>
          )}
        </Box>

        {/* Visualización de imágenes */}
        {project?.gallery && project.gallery.length > 0 && (
          <ImageList sx={{ width: '100%', height: 450 }} cols={3} rowHeight={164}>
            {project.gallery.map((item, index) => (
              <ImageListItem key={index}>
                <img
                  src={`${item}?w=164&h=164&fit=crop&auto=format`}
                  srcSet={`${item}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                  alt={`Gallery image ${index + 1}`}
                  loading="lazy"
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}

        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Guardar cambios
        </Button>
      </form>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert onClose={() => setNotification(prev => ({ ...prev, open: false }))} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProject;