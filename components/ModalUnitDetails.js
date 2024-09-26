import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Button,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';

const ModalUnitDetails = ({ open, onClose, unit }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Información de la Unidad
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {unit && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TableContainer component={Paper} sx={{ flex: 1 }}>
              <Table size="small" aria-label="unit details" sx={{ '& tbody tr:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableBody>
                  {Object.entries(unit).map(([key, value]) => (
                    key !== 'link' && (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection:'column' }}>
              <Image src="/images/plan.jpg" alt="Placeholder" width={300} height={300} />
              <small><i>Imagen referencial</i></small>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={onClose}>
          Cotizar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalUnitDetails;
