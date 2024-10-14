import React from 'react';
import moment from 'moment';
import 'moment/locale/es';
import { Typography } from '@mui/material';

const SimpleExpirationComponent = ({ quotation }) => {
  const now = moment();
  const expirationDate = moment(quotation.quotation_date).add(15, 'days');
  const daysRemaining = expirationDate.diff(now, 'days');
  const hoursRemaining = expirationDate.diff(now, 'hours');

  let expirationText;
  if (daysRemaining > 2) {
    expirationText = `Vence en ${daysRemaining} días`;
  } else {
    expirationText = `Vence en ${hoursRemaining} horas`;
  }
  console.log(quotation)
  return (
    <Typography variant="caption" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
      {expirationText}
    </Typography>
  );
};

export default SimpleExpirationComponent;