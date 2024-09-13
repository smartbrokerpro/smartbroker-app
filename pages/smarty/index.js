// pages/index.js
import Smarty from '@/components/Smarty';
import { Container } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth={false} disableGutters>
      <Smarty />
    </Container>
  );
}
