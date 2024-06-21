import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  TableSortLabel
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import ProjectDetailsCard from '@/components/ProjectDetailsCard';
import { formatCurrency } from '@/utils/format';

export default function ProjectStockPage() {
  const router = useRouter();
  const { idProject } = router.query;
  const [stock, setStock] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const theme = useTheme();

  useEffect(() => {
    if (idProject) {
      fetchProjectDetails();
      fetchStock();
    }
  }, [idProject]);

  async function fetchProjectDetails() {
    try {
      const response = await fetch(`/api/projects/${idProject}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.data);
      } else {
        setProject(null);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  }

  async function fetchStock() {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${idProject}/stock`);
      const data = await response.json();
      if (data.success) {
        setStock(data.data);
      } else {
        setStock([]);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
    setLoading(false);
  }

  function handleSearch(e) {
    setSearchQuery(e.target.value);
  }

  function filterStock(item) {
    const lowercasedQuery = searchQuery.toLowerCase();
    return (
      item.apartment.toLowerCase().includes(lowercasedQuery) ||
      item.typology.toLowerCase().includes(lowercasedQuery) ||
      item.orientation.toLowerCase().includes(lowercasedQuery) ||
      item.current_list_price.toLowerCase().includes(lowercasedQuery) ||
      item.down_payment_bonus.toLowerCase().includes(lowercasedQuery) ||
      item.discount.toLowerCase().includes(lowercasedQuery)
    );
  }

  function handleRequestSort(property) {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }

  function toggleRowExpand(id) {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  const filteredStock = stock.filter(filterStock);

  const sortedStock = filteredStock.sort((a, b) => {
    if (orderBy === '') return 0;
    const valueA = a[orderBy];
    const valueB = b[orderBy];
    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: theme.palette.background.default }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: 3, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Button onClick={() => router.push(`/projects`)}>Volver a Proyectos</Button>
      <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ mt: 2 }}>Stock del Proyecto</Typography>
      {project && <ProjectDetailsCard project={project} />}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Buscar..."
        value={searchQuery}
        onChange={handleSearch}
        sx={{ mb: 2 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Unidad
                <TableSortLabel
                  active={orderBy === 'apartment'}
                  direction={orderBy === 'apartment' ? order : 'asc'}
                  onClick={() => handleRequestSort('apartment')}
                  sx={{ marginLeft: 1, fontSize: '1rem' }}
                />
              </TableCell>
              <TableCell>
                Tipología
                <TableSortLabel
                  active={orderBy === 'typology'}
                  direction={orderBy === 'typology' ? order : 'asc'}
                  onClick={() => handleRequestSort('typology')}
                  sx={{ marginLeft: 1, fontSize: '1rem' }}
                />
              </TableCell>
              <TableCell>Orientación</TableCell>
              <TableCell>
                Precio
                <TableSortLabel
                  active={orderBy === 'current_list_price'}
                  direction={orderBy === 'current_list_price' ? order : 'asc'}
                  onClick={() => handleRequestSort('current_list_price')}
                  sx={{ marginLeft: 1, fontSize: '1rem' }}
                />
              </TableCell>
              <TableCell>Bono Pie</TableCell>
              <TableCell>Descuento</TableCell>
              <TableCell>Expandir</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStock.map(item => (
              <React.Fragment key={item._id}>
                <TableRow>
                  <TableCell>{item.apartment}</TableCell>
                  <TableCell>{item.typology}</TableCell>
                  <TableCell>{item.orientation}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(item.current_list_price.replace(/\./g, '').replace(',', '.')), 'es-CL', 'UF')}</TableCell>
                  <TableCell>{item.down_payment_bonus}</TableCell>
                  <TableCell>{item.discount}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => toggleRowExpand(item._id)}>
                      {expandedRows[item._id] ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={expandedRows[item._id]} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell>Role</TableCell>
                              <TableCell>{item.role}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Modelo</TableCell>
                              <TableCell>{item.model}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Superficie interior</TableCell>
                              <TableCell>{item.interior_surface} m²</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Superficie terraza</TableCell>
                              <TableCell>{item.terrace_surface} m²</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Superficie total</TableCell>
                              <TableCell>{item.total_surface} m²</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Renta</TableCell>
                              <TableCell>{item.rent}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Estado</TableCell>
                              <TableCell>{item.status_id}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <Button
                          color="primary"
                          variant="contained"
                          sx={{ my: 2, float: 'right' }}
                          onClick={() => console.log('Cotizar clicked')}
                        >
                          Cotizar
                        </Button>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
