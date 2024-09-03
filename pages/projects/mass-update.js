import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import { Container, Typography, Button, Box, Paper, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Card, CardContent, List, ListItem, ListItemText, Menu, MenuItem, Chip } from '@mui/material';

export default function MassUpdateProjects() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [dbOperations, setDbOperations] = useState(null);

  useEffect(() => {
    console.log("Current logs:", logs);
  }, [logs]);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        setSelectedFile(base64String);
        handleAnalyzeFile(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleAnalyzeFile = async (fileContent = selectedFile) => {
    if (!fileContent) {
      setNotification({ open: true, message: 'Please select a file first', severity: 'error' });
      return;
    }

    setLoading(true);
    setLogs([]);

    const organizationId = session?.user?.organization?._id;

    if (!organizationId) {
      setNotification({ open: true, message: 'Organization ID not found', severity: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/projects/analyze-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: fileContent, organizationId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        if (data.message === 'No changes detected. All projects are up to date.') {
          setNotification({ open: true, message: data.message, severity: 'info' });
        } else {
          setAnalysisSummary(data);
          setDbOperations(data.dbOperations);
          setConfirmDialogOpen(true);
        }
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      setNotification({ open: true, message: `Failed to analyze file: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = async (format) => {
    try {
      const organizationId = session?.user?.organization?._id;
      if (!organizationId) {
        setNotification({ open: true, message: 'Organization ID not found', severity: 'error' });
        return;
      }

      const response = await fetch(`/api/backup?collection=projects&organizationId=${organizationId}&format=${format}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-backup.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error during download:`, error);
      setNotification({ open: true, message: 'An error occurred while downloading the backup', severity: 'error' });
    } finally {
      handleMenuClose();
    }
  };

  const handleApplyUpdates = async () => {
    if (!dbOperations) {
      setNotification({ open: true, message: 'No updates to apply', severity: 'warning' });
      return;
    }

    const organizationId = session?.user?.organization?._id;
    if (!organizationId) {
      setNotification({ open: true, message: 'Organization ID not found', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/apply-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dbOperations, organizationId }),
      });

      if (response.ok) {
        const result = await response.json();
        setNotification({ 
          open: true, 
          message: `Updates applied successfully. Inserted: ${result.inserted}, Updated: ${result.updated}`, 
          severity: 'success' 
        });
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (error) {
      console.error("Error applying updates:", error);
      setNotification({ open: true, message: `Failed to apply updates: ${error.message}`, severity: 'error' });
    } finally {
      setLoading(false);
      setConfirmDialogOpen(false);
    }
  };

  const renderSummaryContent = () => {
    if (!analysisSummary) return null;

    const totalProjects = analysisSummary.projectsToCreate.length + analysisSummary.projectsToUpdate.length;
    const projectsWithoutChanges = totalProjects - (analysisSummary.projectsToCreate.length + analysisSummary.projectsToUpdate.length);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Analysis Summary</Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#D6993E', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Projects to Update</Typography>
                <Typography variant="h4">{analysisSummary.projectsToUpdate.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#6AAC4E', color: 'white' }}>
              <CardContent>
                <Typography variant="h6">Projects to Create</Typography>
                <Typography variant="h4">{analysisSummary.projectsToCreate.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Projects Without Changes</Typography>
                <Typography variant="h4">{projectsWithoutChanges}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom>Detailed Project List</Typography>
        <Grid container spacing={2}>
          {analysisSummary.projectsToCreate.map((project, index) => {
            const [projectId, projectData] = Object.entries(project)[0];
            return (
              <Grid item xs={4} key={`create-${projectId}`}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{projectData.name}</Typography>
                      <Chip label="Create" sx={{ bgcolor: '#6AAC4E', color: 'white' }} />
                    </Box>
                    <List dense>
                      {Object.entries(projectData).filter(([key]) => key !== 'name').map(([field, value]) => (
                        <ListItem key={field}>
                          <ListItemText primary={`${field}: ${value}`} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {analysisSummary.projectsToUpdate.map((project, index) => {
            const [projectId, projectData] = Object.entries(project)[0];
            return (
              <Grid item xs={4} key={`update-${projectId}`}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">{projectData.name}</Typography>
                      <Chip label="Update" sx={{ bgcolor: '#D6993E', color: 'white' }} />
                    </Box>
                    <List dense>
                      {Object.entries(projectData).filter(([key]) => key !== 'name').map(([field, value]) => (
                        <ListItem key={field}>
                          <ListItemText primary={`${field}: ${value}`} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        {analysisSummary.errors?.length > 0 && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" color="error">Errors: {analysisSummary.errors.length}</Typography>
              <List dense>
                {analysisSummary.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  const renderLogs = () => (
    <Dialog open={showLogs} onClose={() => setShowLogs(false)} maxWidth="md" fullWidth>
      <DialogTitle>Detailed Logs</DialogTitle>
      <DialogContent>
        {logs.length > 0 ? (
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {logs.join('\n')}
          </pre>
        ) : (
          <Typography>No logs available.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowLogs(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="md" sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mass Update of Projects
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Download Projects
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleMenuOpen}
            >
              Download
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={9}>
          <Paper elevation={3} sx={{ padding: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upload and Analyze Projects File
            </Typography>
            <Box {...getRootProps()} sx={{
              border: '2px dashed #cccccc',
              borderRadius: '4px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#999999'
              }
            }}>
              <input {...getInputProps()} />
              {
                isDragActive ?
                  <p>Drop the Excel file here ...</p> :
                  <p>Drag 'n' drop an Excel file here, or click to select file</p>
              }
            </Box>
            {loading && <CircularProgress sx={{ mt: 2 }} />}
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownload('json')}>Download as JSON</MenuItem>
        <MenuItem onClick={() => handleDownload('csv')}>Download as CSV</MenuItem>
        <MenuItem onClick={() => handleDownload('xlsx')}>Download as XLSX</MenuItem>
      </Menu>

      <Button 
        onClick={() => setShowLogs(true)} 
        disabled={logs.length === 0}
        sx={{ mt: 2 }}
      >
        View Detailed Logs ({logs.length})
      </Button>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Analysis Summary</DialogTitle>
        <DialogContent>
          {renderSummaryContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleApplyUpdates} color="primary" variant="contained">
            Confirm and Update
          </Button>
        </DialogActions>
      </Dialog>

      {renderLogs()}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}