// /pages/projects/[idProject]/index.js

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
  Button
} from '@mui/material';

export default function ProjectStockPage() {
  const router = useRouter();
  const { idProject } = router.query;
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (idProject) {
      fetchStock();
    }
  }, [idProject]);

  async function fetchStock() {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${idProject}/stock`);
      const data = await response.json();
      if (data.success) {
        setStock(data.data);
      } else {
        setStock([]);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
    setLoading(false);
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
      <Typography variant="h4" component="h1" gutterBottom color="primary">Stock del Proyecto</Typography>
      <Grid container spacing={4}>
        {stock.map(item => (
          <Grid item key={item._id} xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 1, color: theme.palette.text.primary }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                  Estado: {item.status}
                </Typography>
                <Button
                  color="primary"
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => router.push(`/projects/${idProject}/stock/${item._id}`)}
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
