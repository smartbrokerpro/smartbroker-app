import React from 'react';
import moment from 'moment';
import 'moment/locale/es';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SimpleExpiration from '@/components/SimpleExpiration';

moment.locale('es');

const QuotationCard = React.forwardRef(({ quotation, isUpdated, onDelete, onViewDetails }, ref) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const theme = useTheme();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/quotations/${quotation._id}/edit`);
  };

  const handleDelete = () => {
    onDelete(quotation._id);
    handleMenuClose();
  };

  const formatUF = (value) => {
    return Number(value).toFixed(2);
  };

  return (
    <Card
      ref={ref}
      sx={{
        bgcolor: 'background.paper',
        backgroundColor: isUpdated ? 'rgba(0, 255, 0, 0.1)' : 'white',
        transition: 'background-color 0.5s ease-in-out',
        mb: 3,
        boxShadow: 3,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ 
        bgcolor: theme.palette.primary.main, 
        color: 'white', 
        py: 2, 
        px: 3, 
        position: 'relative',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <Chip
          label={`cotización #${quotation.quotation_id}`}
          size="small"
          sx={{
            bgcolor: '#50A930',
            color: 'white',
            fontWeight: 'light',
            position:'absolute',
            width:'auto',
            top:0,
            left:0,
            borderRadius:'0 0 1rem 0'
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.2rem', mt:3 }}>
              Unidad {quotation.stock.apartment}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0 }}>
              <Typography variant="b" sx={{ fontWeight:'700', fontSize: '0.9rem' }}>{quotation.project.name}{quotation.project.county_name ? <small> · {quotation.project.county_name}</small> : ''}</Typography>
            </Box>
            <Typography variant="i" sx={{ fontSize: '0.75rem', display: 'block', mt: 0 }}>
              {quotation.stock.real_estate_company_name}
            </Typography>
          </Box>
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={handleMenuClick}
            sx={{ color: 'white', mt: -1, mr: -1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {moment(quotation.quotation_date).format('D [de] MMMM [de] YYYY')}
          </Typography>
          {/* <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
            {moment(quotation.quotation_date).fromNow()}
          </Typography> */}
          <SimpleExpiration quotation={quotation} />

        </Box>
      </Box>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      <CardContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
            <Typography variant="body2">{quotation.client.first_name} {quotation.client.last_name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FingerprintIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
            <Typography variant="body2">RUT: {quotation.client.rut}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{}}>
            <TableBody>
              <TableRow>
                <TableCell sx={{p:1, fontSize:'12px'}} component="th" scope="row">Valor</TableCell>
                <TableCell sx={{p:1, fontSize:'12px'}} align="right">{formatUF(quotation.unit_value.value)} {quotation.unit_value.unit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{p:1, fontSize:'12px'}} component="th" scope="row">Hipotecario</TableCell>
                <TableCell sx={{p:1, fontSize:'12px'}} align="right">{formatUF(quotation.financing_amount.value)} {quotation.financing_amount.unit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{p:1, fontSize:'12px'}} component="th" scope="row">Dividendo aprox.</TableCell>
                <TableCell sx={{p:1, fontSize:'12px'}} align="right">{formatUF(quotation.estimated_dividend.value)} {quotation.estimated_dividend.unit}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={<Checkbox checked={quotation.parking} disabled size="small" />}
            label={
              <Typography variant="body2" sx={{fontSize:'12px'}}>Estacionamiento</Typography>
            }
          />
          <FormControlLabel
            control={<Checkbox checked={quotation.storage} disabled size="small" />}
            label={
              <Typography variant="body2" sx={{fontSize:'12px'}}>Bodega</Typography>
            }
          />
        </Box>

        <Box sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
          <Button
            color="primary"
            variant="contained"
            onClick={() => onViewDetails(quotation)}
            sx={{ borderRadius: 20, px: 4 }}
          >
            VER DETALLES
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

export default QuotationCard;