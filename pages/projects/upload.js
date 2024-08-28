// pages/projects/upload.js

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Button, CircularProgress, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { useSession } from 'next-auth/react';
import { extractHeadersAndExamplesFromExcel } from '@/utils/excelUtils';
import HeaderMapping from '@/components/HeaderMapping';

export default function UploadExcel() {
  const [realEstateCompanies, setRealEstateCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [examples, setExamples] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [openNewCompanyDialog, setOpenNewCompanyDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    contact_person: '',
    description: '',
    email: '',
    phone: '',
    website: ''
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showMapping, setShowMapping] = useState(false);
  const [headerMapping, setHeaderMapping] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const { data: session } = useSession();

  const resetFileState = () => {
    setFile(null);
    setFileName('');
    setExcelHeaders([]);
    setExamples([]);
    setShowMapping(false);
    setHeaderMapping({});
    setAnalysisResult(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDrop: handleFileDrop
  });

  async function handleFileDrop(acceptedFiles) {
    setIsLoading(true);
    resetFileState();
    const droppedFile = acceptedFiles[0];
    setFile(droppedFile);
    setFileName(droppedFile.name);
    try {
      const { headers, examples } = await extractHeadersAndExamplesFromExcel(droppedFile);
      setExcelHeaders(headers);
      setExamples(examples);
      setShowMapping(true);
    } catch (error) {
      console.error('Error extracting headers and examples from Excel:', error);
      setSnackbarMessage('Error extracting headers and examples from Excel');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewCompany(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleCreateNewCompany = async () => {
    if (!newCompany.name.trim()) {
      setSnackbarMessage('Company name cannot be empty');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/real_estate_companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompany),
      });
      if (!response.ok) throw new Error('Failed to create new company');
      const result = await response.json();
      if (result.success) {
        const createdCompany = result.data;
        setRealEstateCompanies(prevCompanies => [...prevCompanies, createdCompany]);
        setSelectedCompany(createdCompany);
        setSnackbarMessage('New company created successfully');
      }
    } catch (error) {
      console.error('Error creating new company:', error);
      setSnackbarMessage('Failed to create new company');
    } finally {
      setIsLoading(false);
      setOpenNewCompanyDialog(false);
      setNewCompany({
        name: '',
        address: '',
        contact_person: '',
        description: '',
        email: '',
        phone: '',
        website: ''
      });
    }
  };

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/real_estate_companies');
        if (!response.ok) {
          throw new Error('Failed to fetch real estate companies');
        }
        const result = await response.json();
        if (result.success) {
          setRealEstateCompanies(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch real estate companies');
        }
      } catch (error) {
        console.error('Error fetching real estate companies:', error);
        setSnackbarMessage('Error fetching real estate companies');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);
  
  const handleMappingComplete = (mapping) => {
    console.log("Mapping before sending to backend:", JSON.stringify(mapping, null, 2));
    setHeaderMapping(mapping);
    setShowMapping(false);
    processExcelWithMapping(mapping);
  };

  const processExcelWithMapping = async (mapping) => {
    console.log("Starting processExcelWithMapping");
    setIsLoading(true);
    try {
      console.log('Session data:', JSON.stringify(session, null, 2));
      console.log('Selected company:', JSON.stringify(selectedCompany, null, 2));
  
      const organizationId = session?.user?.organization?._id;
      const companyId = selectedCompany?._id;
      const realEstateCompanyId = selectedCompany?._id;
  
      console.log('Prepared IDs:', {
        organizationId,
        companyId,
        realEstateCompanyId
      });
  
      if (!organizationId || !companyId || !realEstateCompanyId) {
        console.error('Missing required IDs');
        setSnackbarMessage('Error: Missing required organization or company data');
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));
      formData.append('companyId', companyId);
      formData.append('organizationId', organizationId);
      formData.append('realEstateCompanyId', realEstateCompanyId);
  
      console.log('Sending data:', {
        mappingKeys: Object.keys(mapping),
        fileSize: file.size,
        companyId,
        organizationId,
        realEstateCompanyId,
        mapping: JSON.stringify(mapping, null, 2)
      });
  
      const response = await fetch('/api/analyze-mapping', {
        method: 'POST',
        body: formData,
      });
  
      console.log('Response status:', response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to process Excel file: ${errorText}`);
      }
  
      const result = await response.json();
      console.log('Received analysis result:', JSON.stringify(result, null, 2));
  
      setSnackbarMessage(`Analysis complete. Existing Projects: ${result.existingProjects}, New Projects: ${result.newProjects}, Total Units: ${result.totalUnitsToProcess}`);
    } catch (error) {
      console.error('Error processing Excel:', error);
      setSnackbarMessage(`Error processing Excel file: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log("Finished processExcelWithMapping");
    }
  };

  if (!session) {
    return <Typography>Please sign in to access this page.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Upload Excel File</Typography>
      
      <Autocomplete
        value={selectedCompany}
        onChange={(event, newValue) => {
          if (newValue && newValue.inputValue) {
            setOpenNewCompanyDialog(true);
            setNewCompany(prev => ({ ...prev, name: newValue.inputValue }));
          } else {
            setSelectedCompany(newValue);
          }
        }}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        filterOptions={(options, params) => {
          const filtered = options.filter(option => 
            option.name.toLowerCase().includes(params.inputValue.toLowerCase())
          );
          if (params.inputValue !== '' && !filtered.some(option => option.name.toLowerCase() === params.inputValue.toLowerCase())) {
            filtered.push({
              inputValue: params.inputValue,
              name: `Add "${params.inputValue}"`,
            });
          }
          return filtered;
        }}
        options={realEstateCompanies}
        getOptionLabel={(option) => {
          if (typeof option === 'string') {
            return option;
          }
          if (option.inputValue) {
            return option.inputValue;
          }
          return option.name;
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return <li key={key} {...rest}>{option.name}</li>;
        }}
        sx={{ width: '100%', mb: 2 }}
        renderInput={(params) => <TextField {...params} label="Select or add a Real Estate Company" />}
      />

{selectedCompany && (
        <>
          {!file && (
            <Box 
              {...getRootProps()} 
              sx={{
                border: '2px dashed #cccccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                mb: 2,
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <input {...getInputProps()} />
              <Typography>Drag 'n' drop an Excel file here, or click to select one</Typography>
            </Box>
          )}

          {file && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>{fileName}</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={resetFileState}
              >
                Change file
              </Button>
            </Box>
          )}
        </>
      )}

      {showMapping && (
        <HeaderMapping 
          headers={excelHeaders} 
          examples={examples}
          onMappingComplete={handleMappingComplete} 
          selectedCompany={selectedCompany}
          file={file}
          organizationId={session?.user?.organization?._id}
        />
      )}

      <Dialog open={openNewCompanyDialog} onClose={() => setOpenNewCompanyDialog(false)}>
        <DialogTitle>Create New Real Estate Company</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Company Name"
            type="text"
            fullWidth
            required
            value={newCompany.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            type="text"
            fullWidth
            value={newCompany.address}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="contact_person"
            label="Contact Person"
            type="text"
            fullWidth
            value={newCompany.contact_person}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={newCompany.description}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            value={newCompany.email}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone"
            type="tel"
            fullWidth
            value={newCompany.phone}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="website"
            label="Website"
            type="url"
            fullWidth
            value={newCompany.website}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewCompanyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateNewCompany} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage('')}
        message={snackbarMessage}
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}