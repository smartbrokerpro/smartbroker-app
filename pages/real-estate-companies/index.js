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
  Pagination
} from '@mui/material';

const truncateString = (str, num) => {
  if(str == undefined){
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
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/real_estate_companies');
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{mb:4}}>Empresas Inmobiliarias</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Website</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((company) => (
              <TableRow key={company._id.$oid}>
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
                <TableCell>{truncateString(company.description, 25)}</TableCell>
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
    </Box>
  );
};

export default RealEstateCompaniesPage;
