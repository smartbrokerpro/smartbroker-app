'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const fallbackImage = '/images/fallback.jpg'; // Asegúrate de que la ruta sea correcta y la imagen exista en esa ruta

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatePrompt, setUpdatePrompt] = useState('');
  const [previewUpdate, setPreviewUpdate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.error || 'Error fetching projects');
      }
    } catch (error) {
      setError('Error fetching projects');
    }
    setLoading(false);
  }

  async function handlePreviewUpdate() {
    setError(null);
    setErrorDetails(null);
    setShowErrorDetails(false);
    try {
      const response = await fetch('/api/gpt-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: updatePrompt }),
      });

      const result = await response.json();

      if (response.ok) {
        setPreviewUpdate(result);
        setExplanation(result.explanation);
        setShowConfirmation(true);
      } else {
        setError(result.error || 'Error generating preview');
        setErrorDetails(result.gptResponse || null);
      }
    } catch (error) {
      setError('Error generating preview');
      setErrorDetails(error.message);
    }
  }

  async function handleConfirmUpdate() {
    setError(null);
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
        setError(result.error || 'Update failed');
      }
      setShowConfirmation(false);
      setPreviewUpdate(null);
    } catch (error) {
      setError('Error updating project');
    }
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
      <Button variant="contained" color="primary" onClick={handlePreviewUpdate} sx={{ mr: 2 }}>
        Previsualizar Cambios
      </Button>
      {error && (
        <Box>
          <Alert severity="error" sx={{ mt: 2, mb: 1 }}>{error}</Alert>
          {errorDetails && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button size="small" onClick={() => setShowErrorDetails(!showErrorDetails)} startIcon={<ExpandMoreIcon />}>
                Ver detalles técnicos
              </Button>
              <Collapse in={showErrorDetails}>
                <Alert severity="error" sx={{ mt: 2, mb: 1, whiteSpace: 'pre-wrap' }}>{errorDetails}</Alert>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {projects.map(project => (
          <Grid item key={project._id} xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                  {project.name}
                </Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                  Dirección: {project.address}
                </Typography>
                {project.location && (
                  <>
                    <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                      Latitud: {project.location.lat}
                    </Typography>
                    <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                      Longitud: {project.location.lng}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      >
        <DialogTitle>Confirmar Cambios</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {explanation}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmUpdate} color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
