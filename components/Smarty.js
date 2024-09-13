import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Pagination,
  Snackbar,
  Alert
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExploreIcon from '@mui/icons-material/Explore';
import PaymentIcon from '@mui/icons-material/Payment';
import SurfaceIcon from '@mui/icons-material/Fullscreen';
import MapIcon from '@mui/icons-material/Map';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Typewriter from 'typewriter-effect';
import ModalUnitDetails from './ModalUnitDetails';
import LottieLoader from './LottieLoader';
import { useSession } from 'next-auth/react';
import smartyImage from '/public/images/smarty.svg';
import { useNotification } from '@/context/NotificationContext';

const examples = [
  { icon: <FilterListIcon fontSize="large" />, text: "Muéstrame doce unidades de 2 dormitorios y 2 baños." },
  { icon: <ExploreIcon fontSize="large" />, text: "Enséñame 8 unidades con orientación al norte." },
  { icon: <PaymentIcon fontSize="large" />, text: "Encuentra diez unidades con un bono pie del 15%." },
  { icon: <SurfaceIcon fontSize="large" />, text: "Listar todas las unidades con una superficie total entre 50 a 55 m2." },
  { icon: <MapIcon fontSize="large" />, text: "Quiero ver todas las unidades de dos dormitorios y dos baños en la comuna de La Florida." },
  { icon: <PriceCheckIcon fontSize="large" />, text: "Mostrar todas las unidades con valor menor a 2400 UF." }
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

const generateSummaryText = (summary) => {
  if (!summary) return '';

  const totalUnits = summary.total || 0;
  const mostCommonTypology = Object.keys(summary.typologies || {})[0] || 'N/A';
  const mostCommonCounty = Object.keys(summary.counties || {})[0] || 'N/A';
  const mostCommonOrientation = Object.keys(summary.orientations || {})[0] || 'N/A';
  const bonuses = summary.bonuses || {};
  const commonBonuses = Object.entries(bonuses).map(([value, count]) => `${value}% (${count} veces)`).join(', ');

  const meanPrice = summary.statistics?.price?.mean?.toFixed(2) || 'N/A';
  const minPrice = summary.statistics?.price?.min || 'N/A';
  const maxPrice = summary.statistics?.price?.max || 'N/A';
  const meanSurface = summary.statistics?.total_surface?.mean?.toFixed(2) || 'N/A';
  const minSurface = summary.statistics?.total_surface?.min || 'N/A';
  const maxSurface = summary.statistics?.total_surface?.max || 'N/A';

  return `Los resultados consideran ${totalUnits} propiedades, con precio promedio de ${meanPrice} UF, precio mínimo de ${minPrice} UF y máximo de ${maxPrice} UF. Las propiedades tenían en promedio una superficie de ${meanSurface} m², con mínimo de ${minSurface} m² y máximo de ${maxSurface} m². La mayoría de las propiedades son de ${mostCommonTypology} y se encuentran en ${mostCommonCounty}. La orientación predominante es ${mostCommonOrientation}. Todos tienen un descuento de 0. Los bonos más comunes son: ${commonBonuses}.`;
};

const Smarty = () => {
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
  const [key, setKey] = useState(0);
  const [page, setPage] = useState(1);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [error, setError] = useState(null);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const rowsPerPage = 12;
  const { data: session } = useSession();
  const showNotification = useNotification();

  const organizationId = session?.user?.organization?._id;
  const userId = session?.user?.id;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (response) {
      let text = '';
      if (response.analysis) {
        text = highlightAnalysis(response.analysis);
      } else if (response.summary) {
        text = highlightAnalysis(generateSummaryText(response.summary));
      }
      setAnalysisText(text);
      setShowTypewriter(true);
      setKey(prevKey => prevKey + 1);
    }
  }, [response]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setShowExamples(false);
    setShowTypewriter(false);
    setError(null);
    try {
      const payload = { 
        query, 
        sessionId, 
        includeAnalysis,
        organizationId,
        userId
      };
      const res = await fetch('/api/smarty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!organizationId || !userId) {
        setError('No se pudo obtener la información de la organización o usuario.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      if (res.status === 403) {
        setError('Créditos insuficientes. Por favor, recargue sus créditos.');
      } else if (!res.ok) {
        throw new Error(data.error || 'An error occurred');
      } else {
        setResponse(null);
        setAnalysisText('');
        setResponse(data);
        
        // Disparar evento personalizado para actualizar créditos
        const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: data.credits } });
        window.dispatchEvent(creditUpdateEvent);
        
        showNotification(`Operación exitosa.`, 'success');
      }
    } catch (error) {
      console.error('Error:', error.message);
      setError(error.message);
    }
    setLoading(false);
  };
  
  const handleExampleClick = async (text) => {
    const newQuery = `${query} ${text}`;
    setQuery(newQuery);
    setPage(1);
    setLoading(true);
    setShowExamples(false);
    setShowTypewriter(false);
    setError(null);
    try {
      const payload = { 
        query: newQuery, 
        sessionId, 
        includeAnalysis,
        organizationId,
        userId
      };
      const res = await fetch('/api/smarty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Respuesta del servidor:', data);
      if (res.status === 403) {
        setError('Créditos insuficientes. Por favor, recargue sus créditos.');
      } else if (!res.ok) {
        throw new Error(data.error || 'An error occurred');
      } else {
        setResponse(null);
        setAnalysisText('');
        setResponse(data);
        
        // Disparar evento personalizado para actualizar créditos
        const creditUpdateEvent = new CustomEvent('creditUpdate', { detail: { credits: data.credits } });
        window.dispatchEvent(creditUpdateEvent);
        
        showNotification(`Operación exitosa. Créditos restantes: ${data.credits}`, 'success');
      }
    } catch (error) {
      console.error('Error:', error.message);
      setError(error.message);
    }
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = useMemo(() => {
    if (!response || !response.result || !response.result.rows) return [];
    
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return order === 'asc' ? 1 : -1;
      }
      if (b[orderBy] > a[orderBy]) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    };

    return [...response.result.rows].sort(comparator);
  }, [response, order, orderBy]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 0, mb: 0, p: 4, pb: 0, display: 'flex', flexDirection: 'column', height: '96vh', overflow: 'hidden', position: 'relative' }}>
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
        {isClient && loading && (
          <LottieLoader message="Buscando..." />
        )}
        {response && response.result && response.result.rows.length > 0 && (
          <>
            {showTypewriter && (
              <Typography
                variant="body1"
                sx={{ mb: 2, fontSize: '0.85rem', backgroundColor: response.analysis ? '#A4E844' : '#0E0F10', color: response.analysis ? 'black' : 'white', borderRadius: '5px', padding: '10px' }}
                component="div"
              >
                <Typewriter
                  key={key}
                  options={{
                    strings: [response.analysis ? `<b>Análisis</b>: ${analysisText}` : `<b>Resumen:</b> ${analysisText}`],
                    autoStart: true, 
                    loop: false,
                    delay: 1,
                    deleteSpeed: Infinity, 
                  }}
                />
              </Typography>
            )}
            <TableContainer component={Paper} elevation={4} sx={{ fontSize: '.85rem' }}>
              <Table size="small" aria-label="simple table" sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableHead>
                  <TableRow>
                    {response.result.columns.map((column) => (
                      <TableCell key={column.id} sx={{ px: 2, py: 0.5, textAlign: column.id === 'project_name' ? 'left' : 'center', fontSize: '0.75rem' }}>
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRows.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row, index) => (
                    <TableRow key={index}>
                      {response.result.columns.map((column) => (
                        <TableCell key={column.id} sx={{ px: 1, py: 0.5, textAlign: column.id === 'project_name' ? 'left' : 'center', fontSize: '0.75rem' }}>
                          {column.id === 'link' ? (
                            <Button variant="contained" color="primary" onClick={() => handleOpenModal(row)} size="small">
                              Info
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
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Pagination
                  count={Math.ceil(sortedRows.length / rowsPerPage)}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                />
              </Box>
            </TableContainer>
          </>
        )}
        {(!loading && (!response || !response.result || response.result.rows.length === 0) && !showExamples) && (
          <LottieLoader message="No se encontraron resultados, intenta una nueva búsqueda" />
        )}
      </Box>
      <Box sx={{ position: 'sticky', bottom: 0, width: '100%', backgroundColor: 'primary.main', borderRadius: '2rem', padding: '1rem', paddingBottom: '1rem', color: '#fff' }}>
        <form onSubmit={handleSubmit} >
          <Box style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TextField
              aria-label="Describe lo que buscas"
              placeholder="Describe lo que buscas"
              multiline
              minRows={1}
              maxRows={6}
              variant="outlined"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
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
                      label={<Typography variant="body2" sx={{ fontSize: '0.7rem', display:'flex', alignItems:'center' }}>Análisis</Typography>}
                    />
                  </InputAdornment>
                ),
                sx: {
                  padding: '8px',
                  paddingLeft: '1rem',
                  borderRadius: '1rem',
                  fontSize: '.9rem',
                  fontFamily: 'Poppins',
                  backgroundColor: '#fff',
                  border: '1px solid #fff',
                },
              }}
            />
            <Button variant="contained" color="primary" type="submit" disabled={loading} sx={{ minWidth: 100, ml: '6px', borderRadius: '2rem', pl: 3, pr: 3 }}>
              {loading ? <CircularProgress size={24} /> : 'Buscar'}
            </Button>
          </Box>
        </form>
      </Box>
      <ModalUnitDetails open={openModal} onClose={handleCloseModal} unit={selectedUnit} />
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Smarty;