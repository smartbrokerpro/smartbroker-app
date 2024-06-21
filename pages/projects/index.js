// /pages/projects/index.js

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
  TextField
} from '@mui/material';
import { useRouter } from 'next/router';

const fallbackImage = '/images/fallback.jpg'; // Asegúrate de que la ruta sea correcta y la imagen exista en esa ruta

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const response = await fetch('/api/projects');
    const data = await response.json();
    if (data.success) {
      setProjects(data.data);
    }
    setLoading(false);
  }

  async function handleUpdateProject() {
    try {
      const response = await fetch('/api/gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: updatePrompt }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Update successful:', result);
        fetchProjects(); // Refetch projects to update the list
      } else {
        console.error('Update failed:', result);
      }
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">Projects</Typography>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Escribe tu solicitud para actualizar un proyecto"
        value={updatePrompt}
        onChange={(e) => setUpdatePrompt(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleUpdateProject}>
        Actualizar Proyecto
      </Button>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {projects.map(project => (
          <Grid item key={project._id} xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
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
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Chip label={project.name} color="primary" size="small" />
                  <Typography
                    variant="body2"
                    sx={{ ml: 1, color: theme.palette.text.secondary }}
                  >
                    {project.address}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.palette.text.primary }}
                >
                  {project.name}
                </Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                  {project.location?.lat && `Latitud: ${project.location.lat}`}
                  {project.location?.lng && `Longitud: ${project.location.lng}`}
                </Typography>
                <Button color="primary" variant="contained" sx={{ my: 2 }} onClick={() => router.push(`/projects/${project._id}/stock`)}>
                  Ver Stock
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
