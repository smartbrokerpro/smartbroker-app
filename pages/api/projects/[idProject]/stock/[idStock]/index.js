import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { idStock } = req.query;

  if (!ObjectId.isValid(idStock)) {
    return res.status(400).json({ success: false, error: 'Invalid stock ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const stockCollection = db.collection('stock');
    const projectsCollection = db.collection('projects');
    const realEstateCompaniesCollection = db.collection('real_estate_companies');

    // Fetch stock details
    const stockDetails = await stockCollection.findOne({ _id: new ObjectId(idStock) });

    if (!stockDetails) {
      return res.status(404).json({ success: false, error: 'Stock not found' });
    }

    // Fetch project and real estate company data
    const project = await projectsCollection.findOne({ _id: new ObjectId(stockDetails.project_id) });
    const realEstateCompany = await realEstateCompaniesCollection.findOne({ _id: new ObjectId(stockDetails.real_estate_company_id) });

    // Add project name and real estate company name to stock details
    const enrichedStockDetails = {
      ...stockDetails,
      projectName: project.name,
      realEstateCompanyName: realEstateCompany.name
    };

    res.status(200).json({ success: true, data: enrichedStockDetails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
