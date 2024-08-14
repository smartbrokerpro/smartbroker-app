import React, { useState } from 'react';
import {
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
} from '@mui/material';

export default function UpdateProjects() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview([]);
    setStatus('');
  };

  const handlePreview = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/projects/previewProjects', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(data.preview);
        setStatus('Preview generated successfully');
      } else {
        setStatus('Failed to generate preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setStatus('Error occurred while generating preview');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/projects/updateProjects', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('Projects updated successfully');
      } else {
        setStatus('Failed to update projects');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setStatus('Error occurred while uploading file');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Update Projects
        </Typography>
        <Box component="form" onSubmit={handlePreview}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: '.xlsx' }}
                onChange={handleFileChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Generate Preview
              </Button>
            </Grid>
          </Grid>
        </Box>
        {status && (
          <Typography variant="body1" color="textSecondary" sx={{ marginTop: 2 }}>
            {status}
          </Typography>
        )}
        {preview.length > 0 && (
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Preview:
            </Typography>
            <Paper variant="outlined" sx={{ padding: 2, marginBottom: 2 }}>
              <pre>{JSON.stringify(preview, null, 2)}</pre>
            </Paper>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              fullWidth
            >
              Execute Update
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
