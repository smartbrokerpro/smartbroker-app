import { getRealEstateCompanies, createRealEstateCompany, updateRealEstateCompany, deleteRealEstateCompany } from '@/controllers/realEstateCompanyController';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getRealEstateCompanies(req, res);
    case 'POST':
      return createRealEstateCompany(req, res);
    case 'PUT':
      return updateRealEstateCompany(req, res);
    case 'DELETE':
      return deleteRealEstateCompany(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}