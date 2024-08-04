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
import slugify from 'slugify';
import Link from 'next/link';

const MemoizedAutocomplete = React.memo(Autocomplete);

const CreateProject = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const [project, setProject] = useState({
    name: '',
    address: '',
    location: { lat: -33.4489, lng: -70.6693 },
    gallery: [],
    commercialConditions: '',
    baseImagePath: ''
  });
  const [regions, setRegions] = useState([]);
  const [counties, setCounties] = useState([]);
  const [realEstateCompanies, setRealEstateCompanies] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedRealEstateCompany, setSelectedRealEstateCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const fetchInitialData = useCallback(async () => {
    if (!session?.user?.organization?._id) return;

    try {
      setLoading(true);
      const [regionsData, companiesData] = await Promise.all([
        fetch('/api/regions').then(res => res.json()),
        fetch('/api/real_estate_companies').then(res => res.json()),
      ]);

      if (!regionsData.success || !companiesData.success) {
        throw new Error('Error fetching data');
      }

      setRegions(regionsData.data);
      setRealEstateCompanies(companiesData.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setNotification({ open: true, message: 'Error cargando datos iniciales', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

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

  const onDrop = useCallback(async (acceptedFiles) => {
    const projectSlug = slugify(project.name, { lower: true, strict: true });
    const projectFolder = `${projectSlug}_${Math.floor(Date.now() / 1000)}`;
  
    console.log('Frontend - Project Folder:', projectFolder);
  
    setProject(prev => ({
      ...prev,
      baseImagePath: projectFolder
    }));
  
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
  }, [project.name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const projectToCreate = {
        ...project,
        location: `${project.location.lat},${project.location.lng}`,
        real_estate_company_name: selectedRealEstateCompany?.name,
        county_name: selectedCounty?.name,
        region_name: selectedRegion?.region,
        organizationId: session.user.organization._id,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': session.user.organization._id
        },
        body: JSON.stringify(projectToCreate),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNotification({ 
          open: true, 
          message: 'Proyecto creado con éxito', 
          severity: 'success' 
        });
        setTimeout(() => {
          router.push('/projects');
        }, 2000);
      } else {
        throw new Error(data.error || 'Error al crear el proyecto');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setNotification({ 
        open: true, 
        message: `Error al crear el proyecto: ${error.message}`, 
        severity: 'error' 
      });
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
        Crear nuevo proyecto
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Nombre del proyecto"
          name="name"
          value={project.name}
          onChange={handleInputChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Dirección"
          name="address"
          value={project.address}
          onChange={handleInputChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Ubicación (lat, lng)"
          name="location"
          value={`${project.location.lat}, ${project.location.lng}`}
          onChange={(e) => {
            const [lat, lng] = e.target.value.split(',').map(coord => parseFloat(coord.trim()));
            setProject(prev => ({ ...prev, location: { lat: lat || -33.4489, lng: lng || -70.6693 } }));
          }}
          helperText="Coordenadas precargadas de Santiago de Chile. Modifique si es necesario."
          required
        />
        <MemoizedAutocomplete
          options={regions}
          getOptionLabel={(option) => option?.region || ''}
          value={selectedRegion}
          onChange={handleRegionChange}
          isOptionEqualToValue={(option, value) => option?._id === value?._id}
          renderInput={(params) => <TextField {...params} label="Región" margin="normal" required />}
        />
        <MemoizedAutocomplete
          options={counties}
          getOptionLabel={(option) => option.name}
          value={selectedCounty}
          onChange={handleCountyChange}
          renderInput={(params) => <TextField {...params} label="Comuna" margin="normal" required />}
        />
        <MemoizedAutocomplete
          options={realEstateCompanies}
          getOptionLabel={(option) => option.name}
          value={selectedRealEstateCompany}
          onChange={handleRealEstateCompanyChange}
          renderInput={(params) => <TextField {...params} label="Inmobiliaria" margin="normal" required />}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          margin="normal"
          label="Condiciones Comerciales"
          name="commercialConditions"
          value={project.commercialConditions}
          onChange={handleInputChange}
        />
        
        <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', p: 2, mt: 2, textAlign: 'center' }}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Suelta las imágenes aquí...</p>
          ) : (
            <p>Arrastra y suelta imágenes aquí, o haz clic para seleccionar archivos</p>
          )}
        </Box>

        {project.gallery && project.gallery.length > 0 && (
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
          Crear Proyecto
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

export default CreateProject;