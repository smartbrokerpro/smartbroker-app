import { createQuotation, getQuotations, getQuotationDetails } from '@/controllers/quotationController';

export default async function handler(req, res) {
  console.log(`API Request Method: ${req.method}`);
  
  if (req.method === 'GET') {
    if (req.query.id) {
      console.log('Handling GET request for specific quotation');
      return getQuotationDetails(req, res);
    } else {
      console.log('Handling GET request for quotations list');
      return getQuotations(req, res);
    }
  } else if (req.method === 'POST') {
    console.log('Handling POST request');
    return createQuotation(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    console.log(`Method ${req.method} Not Allowed`);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}