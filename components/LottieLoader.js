import React from 'react';
import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';

const Lottie = dynamic(() => import('@lottielab/lottie-player/react'), { ssr: false });

const LottieLoader = ({ message = "Cargando..." }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', p: 2 }}>
      <Box sx={{ width: '150px', height: '260px', overflowY: 'hidden', transform: 'scale(0.5)', transformOrigin: '50% 90%' }}>
        <Lottie src="/anim/smarty.json" autoplay />
      </Box>
      <Typography variant="p" sx={{ mt: 0 }}>{message}</Typography>
    </Box>
  );
};

export default LottieLoader;
