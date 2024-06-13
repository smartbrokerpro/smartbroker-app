// components/Login.js

import React from 'react';
import { signIn } from 'next-auth/react';
import { Box, Button, TextField, Checkbox, FormControlLabel, Typography, Container, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';

const Login = () => {
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
          ¡Hola!
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Para continuar, inicia sesión
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={() => signIn('google')}
          sx={{ mb: 2, backgroundColor: '#4285F4', color: '#fff', '&:hover': { backgroundColor: '#357ae8' } }}
        >
          Ingresa con Google
        </Button>
        <Divider sx={{ my: 2 }}>o</Divider>
        <TextField
          label="Correo Electrónico"
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <TextField
          label="Contraseña"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <FormControlLabel
          control={<Checkbox name="remember" color="primary" />}
          label="Recordar cuenta"
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
        >
          Iniciar sesión
        </Button>
        <Typography variant="body2" align="center">
          ¿No tienes cuenta? <a href="#">Regístrate aquí</a>
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          startIcon={<FacebookIcon />}
          disabled
          sx={{ backgroundColor: '#3b5998', color: '#fff', '&:hover': { backgroundColor: '#365492' } }}
        >
          Ingresa con Facebook
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
