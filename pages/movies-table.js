import React, { useEffect, useState } from 'react';
import { Box, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Container } from '@mui/material';

export default function MoviesTablePage() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true); // Estado para el spinner

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true); // Mostrar spinner antes de comenzar la carga
      const response = await fetch('/api/movies');
      const data = await response.json();
      if (data.success) {
        setMovies(data.data);
        setFilteredMovies(data.data);
      }
      setLoading(false); // Ocultar spinner después de que la carga haya terminado
    }

    fetchMovies();
  }, []);

  useEffect(() => {
    const results = movies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.plot && movie.plot.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMovies(results);
  }, [searchTerm, movies]);

  return (
    <Container sx={{ p: 4 }}>
      <TextField
        fullWidth
        placeholder="Buscar..."
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Genres</TableCell>
                <TableCell>Plot</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMovies.map(movie => (
                <TableRow key={movie._id}>
                  <TableCell>{movie.title ? `${movie.title.substring(0, 30)}...` : ''}</TableCell>
                  <TableCell>{movie.year}</TableCell>
                  <TableCell>{movie.genres ? movie.genres.join(', ') : ''}</TableCell>
                  <TableCell>{movie.plot ? `${movie.plot.substring(0, 25)}...` : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
