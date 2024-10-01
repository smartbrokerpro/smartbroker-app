// pages/index.js
import SmartyV2 from '@/components/SmartyV2';
import { Container } from '@mui/material';

export default function Smarty2() {
  return (
    <Container maxWidth={false} disableGutters sx={{p:0}}>
      <SmartyV2 />
    </Container>
  );
}
