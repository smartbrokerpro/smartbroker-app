// components/RightSidebar.js

import React, { useState } from 'react';
import { Drawer, Box, Typography, Card, CardContent, TextField, Button, Grid } from '@mui/material';

const RightSidebar = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handlePromptSubmit = async () => {
    try {
      const res = await fetch('/api/gptProjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.message);
    } catch (error) {
      console.error('Error submitting prompt:', error);
    }
  };

  const summaryCards = [
    { title: 'Inmobiliarias', value: 10 },
    { title: 'Proyectos', value: 5 },
    { title: 'Stock', value: 150 },
    { title: 'Clientes', value: 75 },
    { title: 'Cotizaciones', value: 20 },
    { title: 'Reservas', value: 8 },
    { title: 'Promesas', value: 12 },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {summaryCards.map((card, index) => (
            <Grid item xs={6} key={index}>
              <Card sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <CardContent sx={{ padding: 1, textAlign: 'center', flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{card.value}</Typography>
                </CardContent>
                <CardContent sx={{ padding: 1, textAlign: 'center', borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" noWrap>{card.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ padding: 2, borderTop: '1px solid #e0e0e0' }}>
        <Typography variant="h6">Pídele algo a la AI</Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Pregúntame o pídeme algo..."
          value={prompt}
          onChange={handlePromptChange}
          sx={{ marginBottom: 2 }}
        />
        <Button variant="contained" color="primary" fullWidth onClick={handlePromptSubmit}>
          Enviar
        </Button>
        {response && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">{response}</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default RightSidebar;
