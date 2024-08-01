// /src/pages/api/[model]/index.js
import { fetchItemsByOrganization, createNewItem, updateExistingItem, removeExistingItem } from '../../../controllers/UniversalCRUDController';

export default async function handler(req, res) {
  const { method } = req;
  const modelName = req.query.model;

  switch (method) {
    case 'GET':
      return fetchItemsByOrganization(req, res);
    case 'POST':
      return createNewItem(req, res);
    case 'PUT':
      return updateExistingItem(req, res);
    case 'DELETE':
      return removeExistingItem(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}