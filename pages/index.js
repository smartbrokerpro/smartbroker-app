// pages/index.js

import React from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Box, Button } from '@mui/material';
import Login from "@/components/Login";
import { signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography variant="h6">Cargando...</Typography>
      </Container>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Box
        sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: 'background.paper',
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          ¡Bienvenido {session.user.name}!
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Estás logueado como {session.user.email}.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={() => signOut()}
          sx={{ mt: 2 }}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Container>
  );
}
