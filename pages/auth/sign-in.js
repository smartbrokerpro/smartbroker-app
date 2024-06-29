// pages/auth/sign-in.js

import { useSession, signIn } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, TextField, Checkbox, FormControlLabel, Typography, Container, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import Image from 'next/image';

export default function SignIn() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Image
            src="/images/smarty.svg"
            alt="Logo"
            width={90}
            height={90}
            layout="fixed"
            style={{ cursor: 'pointer', textAlign:'center', marginBottom:'2rem' }}
          />
      <Box
        sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: 'background.paper',
          width: '100%',
        }}
      >
        {/* <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start', width: '100%', p: 2 }}> */}
          
        {/* </Box> */}
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
}


export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { },
  };
}