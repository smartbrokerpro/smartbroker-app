// /pages/projects/[idProject]/stock/[idStock]/index.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, useTheme, Button } from '@mui/material';

export default function StockDetailsPage() {
  const router = useRouter();
  const { idProject, idStock } = router.query;
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (idStock) {
      fetchStockDetails();
    }
  }, [idStock]);

  async function fetchStockDetails() {
    const response = await fetch(`/api/projects/${idProject}/stock/${idStock}`);
    const data = await response.json();
    if (data.success) {
      setStockDetails(data.data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!stockDetails) {
    return <Typography variant="h6" color="error">No se encontraron detalles del stock.</Typography>;
  }

  return (
    <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Button onClick={() => router.push(`/projects/${idProject}/stock`)}>Volver al Stock</Button>
      <Card sx={{ bgcolor: theme.palette.background.paper, mt: 2 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom color="primary">Detalles del Stock</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Apartamento: {stockDetails.apartment}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Role: {stockDetails.role}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Modelo: {stockDetails.model}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Tipología: {stockDetails.typology}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Superficie interior: {stockDetails.interior_surface} m²
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Superficie terraza: {stockDetails.terrace_surface} m²
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Superficie total: {stockDetails.total_surface} m²
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Precio de lista actual: {stockDetails.current_list_price}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Bono de pie: {stockDetails.down_payment_bonus}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Descuento: {stockDetails.discount}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Renta: {stockDetails.rent}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Estado: {stockDetails.status_id}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
