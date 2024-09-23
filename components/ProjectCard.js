import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { NumberFormatter } from '@/utils/formatNumber';
import HolidayVillageOutlinedIcon from '@mui/icons-material/HolidayVillageOutlined';
import { useSession } from 'next-auth/react';

const ProjectCard = React.forwardRef(({ project, updatedProjectIds, fallbackImage, fetchProjects }, ref) => {
  const { data: session } = useSession(); 
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const [tooltipText, setTooltipText] = useState('Click para copiar');
  const [icon, setIcon] = useState(<ContentCopyIcon sx={{ fontSize: 16, mr: 0.5 }} />);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Estado para manejar la eliminación

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/projects/${project?._id}/edit`);
  };

  const handleDelete = async () => {
    const organizationId = session?.user?.organization?._id; 
    if (!organizationId) {
      console.error('Organization ID is missing');
      return;
    }

    setIsDeleting(true); // Cambiamos el estado para mostrar el progreso de eliminación
    try {
      const response = await fetch(`/api/projects/delete/${project?._id}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': organizationId,
        },
      });

      if (response.ok) {
        console.log('Proyecto eliminado:', project?._id);
        fetchProjects(); // Hacemos el refetch de proyectos después de la eliminación
        setOpenDeleteDialog(false); // Cerramos el diálogo
      } else {
        const errorData = await response.json();
        console.error('Error eliminando el proyecto:', errorData);
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
    } finally {
      setIsDeleting(false); // Terminamos el estado de eliminación
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setTooltipText('Copiado');
    setIcon(<CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />);
    setTimeout(() => {
      setTooltipText('Click para copiar');
      setIcon(<ContentCopyIcon sx={{ fontSize: 16, mr: 0.5 }} />);
    }, 2000);
  };

  return (
    <Card
      ref={ref}
      sx={{
        bgcolor: 'background.paper',
        backgroundColor: updatedProjectIds.includes(project._id) ? 'rgba(0, 255, 0, 0.2)' : 'inherit',
        transition: 'background-color 0.5s ease-in-out',
        mb: 3,
        position: 'relative'
      }}
    >
      <CardMedia
        component="div"
        sx={{
          height: 140,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: `url(${project?.gallery?.length > 0 ? project?.gallery[0] : fallbackImage})`,
          position: 'relative'
        }}
        title={project?.name}
      >
        <Chip
          label={<Box display="flex" alignItems="center">
            {project?.unitsCount || 0}
            <HolidayVillageOutlinedIcon sx={{ml:'.2rem', fontSize:'1.2rem'}} />
          </Box>}
          color="primary"
          variant="contained"
          sx={{ textAlign: 'right', mt: 1, ml:1, fontSize:'.8rem',    position: 'absolute',bottom: '.5rem',right: 0, background: '#68B21Fcc', fontWeight:700 ,color:'white', borderRadius: '1rem 0 0 1rem' }}
        />
        {project?.deliveryType && 
        <Chip
          label={<Box display="flex" alignItems="center">
            {project?.deliveryType || ''}
          </Box>}
          color="primary"
          variant="contained"
          sx={{ textAlign: 'left', mt: 1, mr:1, fontSize:'.8rem',    position: 'absolute',bottom: '.5rem', left: 0, background: '#68B21Fcc', fontWeight:700 ,color:'white', borderRadius: '0 1rem 1rem 0' }}
        />
          }
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleMenuClick}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.6)',
            color:'white',
            '&:hover': {
              color: 'black',
              bgcolor: 'rgba(255,255,255, 0.6)',
            }
          }}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            style: {
              borderRadius: '8px'
            }
          }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
              Editar
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setOpenDeleteDialog(true)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
              Eliminar
            </ListItemText>
          </MenuItem>
        </Menu>
      </CardMedia>
      <CardContent>
        {/* Nombre */}
        <Box sx={{ mb: 0 }}>
          <Tooltip
            title={
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                {icon}{tooltipText}
              </Box>
            }
            arrow
            placement="top"
            classes={{ popper: 'MuiTooltip-copied' }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight:'1.4rem' }}
              onClick={() => handleCopy(project?.name)}
            >
              {project?.name}
            </Typography>
          </Tooltip>
        </Box>

        {/* Nombre de la Inmobiliaria */}
        <Typography
          variant="h6"
          component="h6"
          sx={{ pt: 0, mt: 0, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', fontWeight: '300' }}
        >
          {project?.real_estate_company.name}
        </Typography>

        {/* Dirección */}
        <Box sx={{ mb: 1 }}>
          <Tooltip
            title={
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                {icon}{tooltipText}
              </Box>
            }
            arrow
            placement="top"
            classes={{ popper: 'MuiTooltip-copied' }}
          >
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', whiteSpace: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onClick={() => handleCopy(project?.address)}
            >
              {project?.address}{project?.county.name && `, ${project?.county.name}.`}
            </Typography>
          </Tooltip>
        </Box>

        {project?.hasStock && (
          <>
            <Chip
              label={
                <>
                  <NumberFormatter value={project?.min_price} decimals={0} /> - <NumberFormatter value={project?.max_price} decimals={0} /> UF
                </>
              }
              color="primary"
              variant="outlined"
              sx={{ textAlign: 'right' }}
            />
          </>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {project?.typologies.map((typology, index) => (
            <Chip key={index} label={typology} color="secondary" variant="outlined" size="small" />
          ))}
        </Box>
        <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              if (project?.hasStock) {
                router.push(`/projects/${project?._id}/stock`);
              } else {
                router.push(`/projects/${project?._id}/create-stock`);
              }
            }}
          >
            {project?.hasStock ? 'Ver Stock' : 'Cargar Stock'}
          </Button>
        </Box>
      </CardContent>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el proyecto {project?.name}? Esta acción borrará también el stock asociado al proyecto y no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" disabled={isDeleting}>
            {isDeleting ? <CircularProgress size={24} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
});

export default ProjectCard;
