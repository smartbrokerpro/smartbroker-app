// pages/index.js

import { getSession } from 'next-auth/react';
import { useSession, signOut } from 'next-auth/react';
import { Box, Button, Typography, Container } from '@mui/material';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Redirecting...</div>;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Typography variant="h4">Welcome, {session.user.name}!</Typography>
        <Typography variant="body1">Email: {session.user.email}</Typography>
        <Button variant="contained" color="primary" onClick={() => signOut()}>Sign Out</Button>
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
