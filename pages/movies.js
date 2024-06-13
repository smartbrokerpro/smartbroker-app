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
  Container,
  useTheme,
  Button
} from '@mui/material';

const fallbackImage = '/images/fallback.jpg'; // Asegúrate de que la ruta sea correcta y la imagen exista en esa ruta

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    async function fetchMovies() {
      const response = await fetch('/api/movies');
      const data = await response.json();
      if (data.success) {
        setMovies(data.data);
      }
      setLoading(false);
    }

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px:0, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">Movies</Typography>
      <Grid container spacing={4}>
        {movies.map(movie => (
          <Grid item key={movie._id} xs={12} sm={6} md={4}>
            <Card sx={{ bgcolor: theme.palette.background.paper }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundImage: `url(${movie.poster}), url(${fallbackImage})`,
                }}
                title={movie.title}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                  <Chip label={movie.year} color="primary" size="small" />
                  <Typography
                    variant="body2"
                    sx={{ ml: 1, color: theme.palette.text.secondary }}
                  >
                    {movie.genres.join(', ')}
                  </Typography>
                </Box>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.palette.text.primary }}
                >
                  {movie.title}
                </Typography>
                <Typography variant="body2" noWrap sx={{ color: theme.palette.text.secondary }}>
                  {movie.plot}
                </Typography>
                <Button color="secondary" variant="contained" sx={{mt:2, mr:2}}>
                  Previsualizar
                </Button>
                <Button color="third" variant="contained" sx={{mt:2}}>
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
