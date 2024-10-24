import React, { useEffect, useRef } from 'react';
import fitty from 'fitty';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

const FittyText = ({ children }) => {
  const textRef = useRef(null);

  useEffect(() => {
    const fitInstance = fitty(textRef.current, {
      minSize: 10,
      maxSize: 16,
    });

    return () => {
      fitInstance.unsubscribe();
    };
  }, []);

  return (
    <div ref={textRef} style={{ width: '100%', textAlign: 'center' }}>
      <b style={{ color: '#000' }}>{children !== undefined && children !== null ? children : '-'}</b>
    </div>
  );
};

const InfoBox = ({ title, value, hideIfZero }) => {
  // Si hideIfZero está activado y el valor es 0, no renderiza nada
  if (hideIfZero && value === 0) {
    return null;
  }

  console.log(title, value, hideIfZero); 
  console.log("**************");

  return (
    <Grid item xs={12} sm={4} lg={3} sx={{ overflow: 'visible', my: 1 }}>
      <Card sx={{ overflow: 'visible', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minHeight: '70px' }}>
        <CardContent
          sx={{
            borderRadius: '1rem',
            padding: 1,
            textAlign: 'center',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
            position: 'relative',
            border: '1px solid #9AD850',
          }}
        >
          {/* Asegurar que el valor esté centrado */}
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <FittyText>{value !== undefined && value !== null ? value : '-'}</FittyText>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: 8,
              backgroundColor: '#fff',
              padding: '.15rem .75rem',
              borderRadius: '2rem',
              border: '1px solid #9AD850',
            }}
          >
            <Typography variant="caption" color="#000" noWrap>
              <b>{title}</b>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default InfoBox;
