'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Image,
  Badge,
  Text,
  SimpleGrid,
  Heading,
  Spinner,
  Center,
} from '@chakra-ui/react';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <Center height="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Heading as="h1" mb={6}>Movies</Heading>
      <SimpleGrid columns={[1, 2, 3]} spacing={10}>
        {movies.map(movie => (
          <Box
            key={movie._id}
            maxW="sm"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
          >
            <Image src={movie.poster} alt={movie.title} />

            <Box p="6">
              <Box display="flex" alignItems="baseline">
                <Badge borderRadius="full" px="2" colorScheme="teal">
                  {movie.year}
                </Badge>
                <Box
                  color="gray.500"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  fontSize="xs"
                  textTransform="uppercase"
                  ml="2"
                >
                  {movie.genres.join(', ')}
                </Box>
              </Box>

              <Box
                mt="1"
                fontWeight="semibold"
                as="h4"
                lineHeight="tight"
                isTruncated
              >
                {movie.title}
              </Box>

              <Text mt={2} noOfLines={3}>
                {movie.plot}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
