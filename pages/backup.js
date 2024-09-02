import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Container, Typography, Button, Grid, Box, Input, Paper, Menu, MenuItem } from '@mui/material';

export default function BackupPage() {
  const { data: session } = useSession();
  const [selectedStockFile, setSelectedStockFile] = useState(null);
  const [selectedProjectsFile, setSelectedProjectsFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [collectionName, setCollectionName] = useState('');

  const handleFileChange = (e, setFile) => {
    setFile(e.target.files[0]);
  };

  const handleRestore = async (file, collectionName) => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    const organizationId = session?.user?.organization?._id;

    if (!organizationId) {
      alert('Organization ID not found');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/restore?collection=${collectionName}&organizationId=${organizationId}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      alert(`${collectionName} restored successfully`);
      window.location.reload();
    } else {
      alert(`Failed to restore ${collectionName}`);
    }
  };

  const handleMenuOpen = (event, collection) => {
    setAnchorEl(event.currentTarget);
    setCollectionName(collection);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCollectionName('');
  };

  const handleDownload = async (format) => {
    try {
      const organizationId = session?.user?.organization?._id;
      if (!organizationId) {
        alert('Organization ID not found');
        return;
      }

      const response = await fetch(`/api/backup?collection=${collectionName}&organizationId=${organizationId}&format=${format}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.blob();

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionName}-backup.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error during download for ${collectionName}:`, error);
      alert('An error occurred while downloading the backup');
    } finally {
      handleMenuClose();
    }
  };

  return (
    <Container maxWidth="md" sx={{m:5}}>
      <Typography variant="h4" component="h1" gutterBottom>
        Respaldo
      </Typography>

      <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
        {/* <Typography variant="h5" component="h2" gutterBottom>
          Backup
        </Typography> */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={(e) => handleMenuOpen(e, 'projects')}
            >
              Descargar proyectos
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={(e) => handleMenuOpen(e, 'stock')}
            >
              Descargar stock
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* <Paper elevation={3} sx={{ padding: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Restore
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Restore Stock
              </Typography>
              <Input
                type="file"
                inputProps={{ accept: '.json' }}
                onChange={(e) => handleFileChange(e, setSelectedStockFile)}
              />
              <Button
                variant="contained"
                color="secondary"
                disabled={!selectedStockFile}
                onClick={() => handleRestore(selectedStockFile, 'stock')}
                sx={{ mt: 2 }}
              >
                Restore Stock File
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Typography variant="h6" gutterBottom>
                Restore Projects
              </Typography>
              <Input
                type="file"
                inputProps={{ accept: '.json' }}
                onChange={(e) => handleFileChange(e, setSelectedProjectsFile)}
              />
              <Button
                variant="contained"
                color="secondary"
                disabled={!selectedProjectsFile}
                onClick={() => handleRestore(selectedProjectsFile, 'projects')}
                sx={{ mt: 2 }}
              >
                Restore Projects File
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper> */}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownload('json')}>Download as JSON</MenuItem>
        <MenuItem onClick={() => handleDownload('csv')}>Download as CSV</MenuItem>
        <MenuItem onClick={() => handleDownload('xlsx')}>Download as XLSX</MenuItem>
      </Menu>
    </Container>
  );
}
