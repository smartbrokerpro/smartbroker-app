'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Typography,
  Pagination,
  Snackbar,
  TableSortLabel,
  IconButton,
  Modal,
  TextField,
  Button,
  Grid,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EditCompanyModal from '@/components/EditCompanyModal';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
  maxHeight: '90vh',
  overflow: 'auto'
};

const truncateString = (str, num) => {
  if (str == undefined) {
    return '-';
  }
  if (str?.length <= num) {
    return str;
  }
  return str?.slice(0, num) + '...';
};

const RealEstateCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [openModal, setOpenModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    contact_person: '',
    email: '',
    phone: '',
    website: ''
  });
  
  const rowsPerPage = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/real_estate_companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      showSnackbar('Error al cargar las empresas: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleEditClick = (company) => {
    setSelectedCompany(company);
    setEditFormData({
      name: company.name || '',
      address: company.address || '',
      contact_person: company.contact_person || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || ''
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedCompany(null);
    setEditFormData({
      name: '',
      address: '',
      contact_person: '',
      email: '',
      phone: '',
      website: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCompany?._id) {
      showSnackbar('Error: No se encontró el ID de la empresa', 'error');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/real_estate_companies?id=${selectedCompany._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la empresa');
      }

      if (data.success) {
        setCompanies(companies.map(company => 
          company._id === selectedCompany._id ? { ...company, ...data.data } : company
        ));
        
        showSnackbar('Empresa actualizada exitosamente', 'success');
        handleCloseModal();
      } else {
        throw new Error(data.message || 'Error al actualizar la empresa');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showSnackbar('Error al actualizar: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const sortedCompanies = React.useMemo(() => {
    const comparator = (a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (order === 'asc') {
        return aValue.toString().localeCompare(bValue.toString(), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      } else {
        return bValue.toString().localeCompare(aValue.toString(), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      }
    };

    return [...companies].sort(comparator);
  }, [companies, order, orderBy]);

  const headCells = [
    { id: 'logo', label: '', sortable: false },
    { id: 'name', label: 'Nombre' },
    { id: 'address', label: 'Dirección' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'email', label: 'Email' },
    { id: 'contact_person', label: 'Responsable' },
    { id: 'website', label: 'Website' },
    { id: 'actions', label: 'Acciones', sortable: false }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{mb:4}}>
        Empresas Inmobiliarias
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell key={headCell.id}>
                  {headCell.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  ) : (
                    headCell.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCompanies
              .slice((page - 1) * rowsPerPage, page * rowsPerPage)
              .map((company) => (
                <TableRow key={company._id}>
                  <TableCell>
                    <Avatar alt={company.name} src={company.logo || '/images/fallback.jpg'} />
                  </TableCell>
                  <TableCell>{truncateString(company.name, 25)}</TableCell>
                  <TableCell>{truncateString(company.address, 25)}</TableCell>
                  <TableCell>{truncateString(company.phone, 25)}</TableCell>
                  <TableCell>{truncateString(company.email, 25)}</TableCell>
                  <TableCell>{truncateString(company.contact_person, 25)}</TableCell>
                  <TableCell>
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {truncateString(company.website, 25)}
                    </a>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary"
                      onClick={() => handleEditClick(company)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Pagination
          count={Math.ceil(companies.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
        />
      </Box>
      
      {/* Modal de Edición */}
      <EditCompanyModal 
        open={openModal}
        onClose={handleCloseModal}
        company={selectedCompany}
        editFormData={editFormData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        saving={saving}
        showSnackbar={showSnackbar}
      />

      <Snackbar 
        open={!!snackbarMessage} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarMessage('')} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RealEstateCompaniesPage;