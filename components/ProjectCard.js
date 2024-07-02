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
  ListItemText
} from '@mui/material';
import { useRouter } from 'next/router';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { NumberFormatter } from '@/utils/formatNumber';

const ProjectCard = React.forwardRef(({ project, updatedProjectId, fallbackImage }, ref) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    router.push(`/projects/${project._id}/edit`);
  };

  const handleDelete = () => {
    // Aquí puedes agregar la lógica para eliminar el proyecto
    console.log('Eliminar proyecto:', project._id);
  };

  return (
    <Card
      ref={ref}
      sx={{
        bgcolor: 'background.paper',
        backgroundColor: updatedProjectId === project._id ? 'rgba(0, 255, 0, 0.2)' : 'none',
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
          backgroundImage: `url(${project?.gallery ? project?.gallery[0] : fallbackImage})`,
          position: 'relative'
        }}
        title={project.name}
      >
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
          <MenuItem onClick={handleDelete}>
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
        <Typography
          variant="h6"
          component="h2"
          sx={{ pb: 0, mb: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {project.name}
        </Typography>
        <Typography
          variant="h6"
          component="h6"
          sx={{ pt: 0, mt: 0, mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', fontWeight: '300' }}
        >
          {project.real_estate_company.name}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {project.address}{project.county.name && `, ${project.county.name}.`}
        </Typography>
        {project.hasStock &&
          <Chip
            label={
              <>
                <NumberFormatter value={project.min_price} decimals={0} /> - <NumberFormatter value={project.max_price} decimals={0} /> UF
              </>
            }
            color="primary"
            variant="outlined"
            sx={{ textAlign: 'right' }}
          />
        }

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {project.typologies.map((typology, index) => (
            <Chip key={index} label={typology} color="secondary" variant="outlined" size="small" />
          ))}
        </Box>
        <Box sx={{ m: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            color="primary"
            variant="contained"
            onClick={() => {
              if (project.hasStock) {
                router.push(`/projects/${project._id}/stock`);
              } else {
                router.push(`/projects/${project._id}/create-stock`);
              }
            }}
          >
            {project.hasStock ? 'Ver Stock' : 'Cargar Stock'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

export default ProjectCard;
