import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Pagination,
  Grid
} from '@mui/material';
import { TableRows, GridView } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useSidebarContext } from '@/context/SidebarContext';
import { useNotification } from '@/context/NotificationContext';
import { useTheme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import LottieLoader from '@/components/LottieLoader';
import QuotationCard from '@/components/QuotationCard';
import QuotationTable from '@/components/QuotationTable';
import QuotationDetailsModal from '@/components/QuotationDetailsModal';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

export default function QuotationsPage() {
  const { data: session, status } = useSession();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isRefetching, setIsRefetching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const rowsPerPage = 10;
  const { collapsed } = useSidebarContext();
  const theme = useTheme();
  const router = useRouter();
  const showNotification = useNotification();
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const fetchQuotations = useCallback(async (forceRefetch = false) => {
    if (!session?.user?.id || !session?.user?.organization?._id) return;

    if (!forceRefetch && quotations.length > 0 && !isRefetching) return;

    setIsRefetching(true);
    try {
      const response = await fetch(
        `/api/quotations?userId=${session.user.id}&organizationId=${session.user.organization._id}&page=${page}&limit=${rowsPerPage}`
      );
      const data = await response.json();
      if (data.success) {
        setQuotations(data.data);
        setTotalPages(Math.ceil(data.total / rowsPerPage));
      } else {
        console.error('Error fetching quotations:', data);
        showNotification('Error al cargar las cotizaciones', 'error');
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      showNotification('Error al cargar las cotizaciones', 'error');
    } finally {
      setIsRefetching(false);
      setLoading(false);
    }
  }, [session?.user?.id, session?.user?.organization?._id, page, rowsPerPage, showNotification, isRefetching]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchQuotations(true);
    }
  }, [status, page]); // fetchQuotations removed from dependencies

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleViewDetails = useCallback((quotationId) => {
    setSelectedQuotationId(quotationId);
    setDetailsModalOpen(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setDetailsModalOpen(false);
    setSelectedQuotationId(null);
  }, []);

  const handleEdit = useCallback((quotationId) => {
    router.push(`/quotations/${quotationId}/edit`);
  }, [router]);

  const handleDelete = useCallback((quotationId) => {
    setQuotations(prevQuotations => 
      prevQuotations.filter(quotation => quotation._id !== quotationId)
    );
    fetchQuotations(true);
  }, [fetchQuotations]);

  const filteredQuotations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return quotations.filter(quotation => {
      const searchableFields = [
        quotation.quotation_id?.toString(),
        quotation.client?.first_name?.toLowerCase(),
        quotation.client?.last_name?.toLowerCase(),
        quotation.client?.rut?.toLowerCase(),
        quotation.project?.name?.toLowerCase(),
        quotation.project?.county_name?.toLowerCase(),
        quotation.stock?.apartment?.toString(),
        quotation.unit_value?.value?.toString(),
        quotation.financing_amount?.value?.toString(),
        quotation.estimated_dividend?.value?.toString()
      ];

      return searchableFields.some(field => field?.includes(query));
    });
  }, [quotations, searchQuery]);

  const tableProps = useMemo(() => ({
    quotations: filteredQuotations,
    onDelete: handleDelete,
    onEdit: handleEdit,
    onView: handleViewDetails
  }), [filteredQuotations, handleDelete, handleEdit, handleViewDetails]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        bgcolor: theme.palette.background.default 
      }}>
        <LottieLoader message="Cargando..." />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      mt: 0, 
      mb: 0, 
      p: 4, 
      pb: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '96vh', 
      position: 'relative' 
    }}>
      <Box sx={{ 
        py: 4, 
        px: 3, 
        bgcolor: theme.palette.background.default, 
        color: theme.palette.text.primary 
      }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Cotizaciones
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4 
        }}>
          <TextField
            variant="outlined"
            placeholder="Búsqueda rápida"
            value={searchQuery}
            onChange={handleSearch}
            sx={{ mb: 2, flex: 1, mr: 2, height: 40 }}
            InputProps={{
              style: { fontSize: '0.875rem', height: '2.5rem' },
            }}
            helperText={`${filteredQuotations.length} de ${quotations.length} cotizaciones encontradas`}
          />
          <Box>
            <IconButton 
              onClick={() => setViewMode('grid')} 
              color={viewMode === 'grid' ? 'primary' : 'default'}
              sx={{ bgcolor: viewMode === 'grid' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}
            >
              <GridView />
            </IconButton>
            <IconButton 
              onClick={() => setViewMode('table')} 
              color={viewMode === 'table' ? 'primary' : 'default'}
              sx={{ bgcolor: viewMode === 'table' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}
            >
              <TableRows />
            </IconButton>
          </Box>
        </Box>

        {isRefetching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LottieLoader message="Actualizando..." />
          </Box>
        )}

        {viewMode === 'grid' ? (
          <Grid container spacing={4}>
            {filteredQuotations.map(quotation => (
              <Grid item key={quotation._id} xs={12} sm={6} md={4}>
                <QuotationCard
                  quotation={quotation}
                  onDelete={handleDelete}
                  onEdit={() => handleEdit(quotation._id)}
                  onView={() => handleViewDetails(quotation._id)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <QuotationTable {...tableProps} />
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>

      <QuotationDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        quotationId={selectedQuotationId}
        organizationId={session?.user?.organization?._id}
        userId={session?.user?.id}
      />
    </Box>
  );
}