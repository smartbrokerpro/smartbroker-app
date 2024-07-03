// pages/index.js

import { getSession } from 'next-auth/react';
import { useSession, signOut } from 'next-auth/react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import FunnelGraph from '@/components/FunnelGraph';
import FunnelChart from '@/components/FunnelChart';

export default function Home() {
  const { data: session, status } = useSession();
  
  const data = {
    labels: ['Asesorías', 'Todos los procesos', 'Cotizando', 'Por pagar', 'Reservados', 'Aprobados', 'Rechazados', 'Promesas Solicitadas', 'Por firmar', 'Promesados'],
    values: [70, 63, 56, 48, 40, 34, 23, 12, 5, 5],
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Redirecting...</div>;
  }

  return (
    <Container maxWidth="lg" style={{padding:'2rem'}}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width:'calc(100vw - 300px' }}>
        <Paper elevation={5} style={{ padding: '2rem', borderRadius:'2rem', width:'100%' }}>

          <Typography variant="h4">Bienvenido, {session.user.name}!</Typography>
          <Typography variant="body1">Email: {session.user.email}</Typography>
          <Button variant="contained" color="primary" onClick={() => signOut()}>Sign Out</Button>
        </Paper>

        <Box sx={{display:'flex', gap:2, width:'100%'}}>
          <Paper elevation={5} style={{ flex:1, marginTop:'1rem', padding: '2rem', borderRadius:'2rem', width:'100%' }}>
            <h3>Resumen de procesos</h3>
            <FunnelGraph/>
          </Paper>
          <Paper elevation={5} style={{ flex:1, marginTop:'1rem', padding: '2rem', borderRadius:'2rem', width:'100%' }}>
            <h3>Resumen de procesos</h3>
            <FunnelChart data={data} />
          </Paper>
        </Box>
      </Box>

      
    </Container>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/sign-in',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
