import React, { useState, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress, TextareaAutosize, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExploreIcon from '@mui/icons-material/Explore';
import PaymentIcon from '@mui/icons-material/Payment';
import DiscountIcon from '@mui/icons-material/Discount';
import SurfaceIcon from '@mui/icons-material/Fullscreen';
import MapIcon from '@mui/icons-material/Map';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Typewriter from 'typewriter-effect';

const Lottie = dynamic(() => import('@lottielab/lottie-player/react'), { ssr: false });
import smartyImage from '/public/images/smarty.svg'; // Asegúrate de que la ruta sea correcta

const examples = [
  { icon: <FilterListIcon fontSize="large" />, text: "Muéstrame todas las unidades con 2 dormitorios y 2 baños." },
  { icon: <ExploreIcon fontSize="large" />, text: "Enséñame las unidades con orientación al norte." },
  { icon: <PaymentIcon fontSize="large" />, text: "Encuentra unidades con un bono pie del 15%." },
  { icon: <DiscountIcon fontSize="large" />, text: "Busca unidades con un descuento del 5%." },
  { icon: <SurfaceIcon fontSize="large" />, text: "Listar todas las unidades con una superficie total entre 50 a 60 m<sup>2</sup>." },
  { icon: <MapIcon fontSize="large" />, text: "Quiero ver todas las unidades de dos dormitorios y dos baños en la comuna de La Florida." },
  { icon: <PriceCheckIcon fontSize="large" />, text: "Mostrar todas las unidades con valor menor a 3000 UF." }
];

const highlightAnalysis = (text) => {
  const keywords = ['promedio', 'superficie', 'precio', 'descuentos', 'orientación', 'ubicación'];
  const numberRegex = /\b\d+([.,]\d+)?\b/g;
  
  let highlightedText = text.replace(numberRegex, (match) => `<strong>${match}</strong>`);

  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<strong>$1</strong>');
  });

  return highlightedText;
};

const Chat = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [tokensUsed, setTokensUsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));
  const [openModal, setOpenModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [includeAnalysis, setIncludeAnalysis] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [key, setKey] = useState(0); // Added key to force re-render Typewriter

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (response && includeAnalysis && response.analysis) {
      const highlightedAnalysis = highlightAnalysis(response.analysis);
      setAnalysisText(highlightedAnalysis);
      setShowTypewriter(true);
      setKey(prevKey => prevKey + 1); // Update key to force re-render Typewriter
    }
  }, [response, includeAnalysis]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowExamples(false);
    setShowTypewriter(false); // Reset typewriter visibility
    try {
      const payload = { query, sessionId, includeAnalysis };
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error && data.error.type === 'insufficient_quota') {
        alert('You have exceeded your quota. Please check your billing details.');
      } else {
        setResponse(null); // Reset response to force re-render
        setAnalysisText(''); // Reset analysis text
        setResponse(data);
        setTokensUsed(data.tokensUsed);
      }
    } catch (error) {
      console.error('Error:', error.message);
      alert('An error occurred. Please try again later.');
    }
    setLoading(false);
  };

  const handleExampleClick = async (text) => {
    const newQuery = `${query} ${text}`;
    setQuery(newQuery);
    setLoading(true);
    setShowExamples(false);
    setShowTypewriter(false); // Reset typewriter visibility
    const payload = { query: newQuery, sessionId, includeAnalysis };
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setResponse(null); // Reset response to force re-render
    setAnalysisText(''); // Reset analysis text
    setResponse(data);
    setTokensUsed(data.tokensUsed);
    setLoading(false);
  };

  const handleOpenModal = (unit) => {
    setSelectedUnit(unit);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedUnit(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 0, mb: 0, p: 2, pb: 0, display: 'flex', flexDirection: 'column', height: '96vh', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
        {showExamples && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
            <Image src={smartyImage} alt="Smarty" width={100} height={100} />
            <Typography variant="h6" sx={{ m: 3 }} gutterBottom>Puedes pedirme cosas como: </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 2,
              justifyContent: 'center',
            }}>
              {examples.map((example, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: '#fff',
                    p: 2,
                    borderRadius: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'left',
                    '&:hover': {
                      backgroundColor: '#50A930',
                    },
                    transition: 'background-color 0.3s ease',
                  }}
                  onClick={() => handleExampleClick(example.text)}
                >
                  <Box sx={{ mr: 2 }}>{example.icon}</Box>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }} dangerouslySetInnerHTML={{ __html: example.text }}></Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        {response && (
          <>
            {includeAnalysis && showTypewriter && (
              <Typography
                variant="body1"
                sx={{ mb: 2, fontSize: '0.85rem' }}
                component="div"
              >
                <Typewriter
                  key={key} // Add key to force re-render
                  options={{
                    strings: [analysisText],
                    autoStart: true,
                    loop: false,
                    delay: 20,
                    deleteSpeed: Infinity,
                  }}
                />
              </Typography>
            )}
            <TableContainer component={Paper}>
              <Table size="small" aria-label="simple table" sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableHead>
                  <TableRow>
                    {response.result.columns.map((column) => (
                      <TableCell key={column.id} sx={{ px: 1, py: 0.5 }}>{column.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {response.result.rows.map((row, index) => (
                    <TableRow key={index}>
                      {response.result.columns.map((column) => (
                        <TableCell key={column.id} sx={{ px: 1, py: 0.5 }}>
                          {column.id === 'link' ? (
                            <Button variant="contained" color="primary" onClick={() => handleOpenModal(row)} size="small">
                              Ver Unidad
                            </Button>
                          ) : (
                            row[column.id]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {tokensUsed && (
              <Typography variant="subtitle1" color="textSecondary">
                Tokens utilizados: {tokensUsed}
              </Typography>
            )}
          </>
        )}
      </Box>
      <Box sx={{ position: 'sticky', bottom: 0, width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff' }}>
        <form onSubmit={handleSubmit} >
          <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextareaAutosize
              aria-label="Describe lo que buscas"
              minRows={1}
              maxRows={6}
              placeholder="Describe lo que buscas"
              style={{ width: '100%', padding: '8px', paddingLeft: '1rem', paddingRight: '1rem', marginRight: '8px', boxSizing: 'border-box', borderRadius: '1rem', fontSize: '.8rem', fontFamily: 'Poppins', color: '#000', backgroundColor: '#fff', border: '1px solid #fff' }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="contained" color="primary" type="submit" disabled={loading} sx={{ minWidth: 100 }}>
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Box>
          
        </form>
      </Box>
      <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeAnalysis}
                  onChange={(e) => setIncludeAnalysis(e.target.checked)}
                  name="includeAnalysis"
                  color="secondary"
                  size="small"
                />
              }
              label={<Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Mostrar análisis</Typography>}
              sx={{ ml: 0, mr: 1 }}
            />
          </Box>
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          Información de la Unidad
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUnit && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TableContainer component={Paper} sx={{ flex: 1 }}>
                <Table size="small" aria-label="unit details" sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                  <TableBody>
                    {Object.entries(selectedUnit).map(([key, value]) => (
                      key !== 'link' && (
                        <TableRow key={key}>
                          <TableCell>{key}</TableCell>
                          <TableCell>{value}</TableCell>
                        </TableRow>
                      )
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Image src="/images/plan.jpg" alt="Placeholder" width={300} height={300} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleCloseModal}>
            Cotizar
          </Button>
        </DialogActions>
      </Dialog>
      {isClient && loading && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 9999 }}>
          <Box sx={{ width: '250px', height: '440px', overflowY: 'hidden', transform: "scale(0.4)" }}>
            <Lottie src="/anim/smarty.json" autoplay />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Chat;
