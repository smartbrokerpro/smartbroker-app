// pages/api/projects/edit/[id].js
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  const organizationId = req.headers['x-organization-id'];

  if (!organizationId) {
    return res.status(400).json({ success: false, error: 'organization_id is required' });
  }

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  const updateData = {};
  const allowedFields = [
    'name', 'address', 'county_id', 'country_id', 'real_estate_company_id',
    'location', 'region_id', 'gallery', 'commercialConditions', 'deliveryType',
    'downPaymentMethod', 'installments', 'promiseSignatureType', 'reservationInfo',
    'reservationValue', 'county_name', 'real_estate_company_name', 'region_name',
    'discount', 'down_payment_bonus', 'deliveryDateDescr', 'downpayment'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (['county_id', 'country_id', 'real_estate_company_id', 'region_id'].includes(field)) {
        updateData[field] = new ObjectId(req.body[field]);
      } else if (field === 'location') {
        if (typeof req.body[field] === 'string') {
          const [lat, lng] = req.body[field].split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            updateData[field] = { lat, lng };
          }
        } else if (typeof req.body[field] === 'object') {
          updateData[field] = req.body[field];
        }
      } else if (field === 'reservationInfo') {
        updateData[field] = {
          text: req.body.reservationInfo.text || '',
          hyperlink: req.body.reservationInfo.hyperlink || ''
        };
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  updateData.updatedAt = new Date();

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const projectsCollection = db.collection('projects');
    const stockCollection = db.collection('stock');

    const result = await projectsCollection.findOneAndUpdate(
      { 
        _id: new ObjectId(id), 
        organization_id: new ObjectId(organizationId) 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Project not found or not updated' });
    }

    // Update stock documents
    const stockUpdateResult = await stockCollection.updateMany(
      { 
        project_id: new ObjectId(id),
        organization_id: new ObjectId(organizationId)
      },
      { 
        $set: {
          county_id: updateData.county_id,
          county_name: updateData.county_name,
          real_estate_company_name: updateData.real_estate_company_name,
          real_estate_company_id: updateData.real_estate_company_id,
          project_name: updateData.name,
          region_name: updateData.region_name,
          region_id: updateData.region_id,
          discount: updateData.discount,
          down_payment_bonus: updateData.down_payment_bonus,
          installments: updateData.installments,
          deliveryDateDescr: updateData.deliveryDateDescr,
          downpayment: updateData.downpayment,
          deliveryType: updateData.deliveryType
        }
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: result, 
      stockUpdated: stockUpdateResult.modifiedCount 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: error.toString(), stack: error.stack });
  }
}