import { useEffect, useState } from 'react';
import { Box, Input, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center } from '@chakra-ui/react';

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
    <Box p={4}>
      <Input
        placeholder="Buscar..."
        mb={4}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading ? (
        <Center>
          <Spinner size="xl" />
        </Center>
      ) : (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Year</Th>
                <Th>Genres</Th>
                <Th>Plot</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredMovies.map(movie => (
                <Tr key={movie._id}>
                  <Td>{movie.title ? `${movie.title.substring(0, 30)}...` : ''}</Td>
                  <Td>{movie.year}</Td>
                  <Td>{movie.genres ? movie.genres.join(', ') : ''}</Td>
                  <Td>{movie.plot ? `${movie.plot.substring(0, 25)}...` : ''}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
