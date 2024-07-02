'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Autocomplete
} from '@mui/material';
import { useDropzone } from 'react-dropzone';

const EditProject = () => {
  const router = useRouter();
  const { idProject } = router.query;
  const [project, setProject] = useState(null);
  const [regions, setRegions] = useState([]);
  const [counties, setCounties] = useState([]);
  const [realEstateCompanies, setRealEstateCompanies] = useState([]);
  const [filteredCounties, setFilteredCounties] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [selectedRealEstateCompany, setSelectedRealEstateCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (idProject) {
      fetchProject();
    }
  }, [idProject]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${idProject}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.data.project);
        setRegions(data.data.regions);
        setCounties(data.data.counties);
        setRealEstateCompanies(data.data.realEstateCompanies);
        setSelectedRegion(data.data.regions.find(region => region._id === data.data.project.region_id));
        setSelectedCounty(data.data.counties.find(county => county._id === data.data.project.county_id));
        setSelectedRealEstateCompany(data.data.realEstateCompanies.find(company => company._id === data.data.project.real_estate_company_id));
      } else {
        setNotification({ open: true, message: data.error, severity: 'error' });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setNotification({ open: true, message: 'Error fetching project data', severity: 'error' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRegion) {
      const countiesForRegion = counties.filter(county => county.region_id === selectedRegion._id);
      setFilteredCounties(countiesForRegion);
    } else {
      setFilteredCounties([]);
    }
  }, [selectedRegion]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProject((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = (event, value) => {
    setSelectedRegion(value);
    setProject((prev) => ({ ...prev, region_id: value?._id }));
  };

  const handleCountyChange = (event, value) => {
    setSelectedCounty(value);
    setProject((prev) => ({ ...prev, county_id: value?._id }));
  };

  const handleRealEstateCompanyChange = (event, value) => {
    setSelectedRealEstateCompany(value);
    setProject((prev) => ({ ...prev, real_estate_company_id: value?._id }));
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploadS3', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProject((prev) => ({
          ...prev,
          gallery: [...(prev.gallery || []), data.url],
        }));
        setNotification({ open: true, message: 'Image uploaded successfully', severity: 'success' });
      } else {
        setNotification({ open: true, message: 'Error uploading image', severity: 'error' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setNotification({ open: true, message: 'Error uploading image', severity: 'error' });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${idProject}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      const result = await response.json();

      if (response.ok) {
        setNotification({ open: true, message: 'Project updated successfully', severity: 'success' });
      } else {
        setNotification({ open: true, message: result.error || 'Error updating project', severity: 'error' });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setNotification({ open: true, message: 'Error updating project', severity: 'error' });
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Edit Project
      </Typography>
      {project && (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            name="name"
            value={project.name || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Address"
            name="address"
            value={project.address || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <Autocomplete
            options={regions}
            getOptionLabel={(option) => option.region}
            value={selectedRegion}
            onChange={handleRegionChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Region"
                margin="normal"
                fullWidth
              />
            )}
          />
          <Autocomplete
            options={filteredCounties}
            getOptionLabel={(option) => option.name}
            value={selectedCounty}
            onChange={handleCountyChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="County"
                margin="normal"
                fullWidth
              />
            )}
          />
          <Autocomplete
            options={realEstateCompanies}
            getOptionLabel={(option) => option.name}
            value={selectedRealEstateCompany}
            onChange={handleRealEstateCompanyChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Real Estate Company"
                margin="normal"
                fullWidth
              />
            )}
          />
          <TextField
            label="Image URL"
            name="image"
            value={project.image || ''}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
          />
          <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', p: 2, textAlign: 'center', mt: 2 }}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </Box>
          {project.gallery && project.gallery.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Gallery</Typography>
              {project.gallery.map((url, index) => (
                <img key={index} src={url} alt={`Gallery Image ${index}`} style={{ width: '100%', marginTop: 10 }} />
              ))}
            </Box>
          )}
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </form>
      )}
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
};

export default EditProject;
