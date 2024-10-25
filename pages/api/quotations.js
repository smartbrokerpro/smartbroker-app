// api/quotations.js
import { createQuotation, getQuotations, getQuotationDetails, deleteQuotation } from '@/controllers/quotationController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  switch (req.method) {
    case 'GET':
      if (req.query.id) {
        console.log('Handling GET request for specific quotation');
        return getQuotationDetails(req, res);
      } else {
        console.log('Handling GET request for quotations list');
        return getQuotations(req, res);
      }
    case 'POST':
      console.log('Handling POST request');
      return createQuotation(req, res);
    case 'DELETE':
      console.log('Handling DELETE request');
      return deleteQuotation(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      console.log(`Method ${req.method} Not Allowed`);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}