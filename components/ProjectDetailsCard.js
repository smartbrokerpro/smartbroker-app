import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, useTheme, Grid } from '@mui/material';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '200px'
};

export default function ProjectDetailsCard({ project }) {
  const theme = useTheme();
  const [mapStyle, setMapStyle] = useState(null);

  useEffect(() => {
    async function fetchMapStyle() {
      const response = await fetch('/mapStyle.json');
      const style = await response.json();
      setMapStyle(style);
    }

    fetchMapStyle();
  }, []);

  return (
    <Card sx={{ mb: 4, bgcolor: theme.palette.background.paper }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ mb: 2 }}>
              {project.name}
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                Dirección: {project.address}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                Inmobiliaria: {project.realEstateCompanyName}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            {project.location && project.location.lat && project.location.lng && (
              <Box sx={{ height: 200 }}>
                <LoadScript googleMapsApiKey="AIzaSyAAVyQCW67osIeXi5JEX1gDY1fijFyJXFY">
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: project.location.lat, lng: project.location.lng }}
                    zoom={15}
                    options={{ styles: mapStyle }}
                  >
                    <Marker position={{ lat: project.location.lat, lng: project.location.lng }} />
                  </GoogleMap>
                </LoadScript>
              </Box>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
