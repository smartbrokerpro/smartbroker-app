import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const getNextSequenceValue = async (sequenceName) => {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const countersCollection = db.collection('counters');
  
    try {
      console.log(`Attempting to update sequence for: ${sequenceName}`);
      const result = await countersCollection.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { returnDocument: 'after', upsert: true }
      );
  
      console.log('Raw result from findOneAndUpdate:', JSON.stringify(result, null, 2));

      if (!result) {
        console.error('Result is null or undefined');
        throw new Error(`Could not retrieve the updated sequence for ${sequenceName}`);
      }

      if (typeof result.sequence_value !== 'number') {
        console.error('Sequence value is not a number:', result.sequence_value);
        throw new Error(`Invalid sequence value for ${sequenceName}`);
      }

      console.log(`Retrieved sequence value for ${sequenceName}:`, result.sequence_value);
      return result.sequence_value;
    } catch (error) {
      console.error(`Error in getNextSequenceValue for ${sequenceName}:`, error);
      throw error;
    }
};

export const createQuotation = async (req, res) => {
  const quotationData = req.body;

  if (!quotationData || !quotationData.organization_id || !quotationData.project_id || !quotationData.stock_id || !quotationData.user_id) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('quotations');

    console.log('Attempting to get next sequence value');
    const sequentialId = await getNextSequenceValue('quotations');
    console.log('Retrieved sequentialId:', sequentialId);

    const formattedData = {
      ...quotationData,
      quotation_id: sequentialId,
      organization_id: new ObjectId(quotationData.organization_id),
      project_id: new ObjectId(quotationData.project_id),
      stock_id: new ObjectId(quotationData.stock_id),
      client_id: quotationData.client_id ? new ObjectId(quotationData.client_id) : null,
      user_id: new ObjectId(quotationData.user_id),
      uf_value_at_quotation: { value: quotationData.uf_value_at_quotation, unit: 'CLP' },
      unit_value: { value: quotationData.unit_value, unit: 'UF' },
      financing_amount: { value: quotationData.financing_amount, unit: 'UF' },
      estimated_dividend: { value: quotationData.estimated_dividend, unit: 'UF' },
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('Attempting to insert document:', JSON.stringify(formattedData, null, 2));
    const result = await collection.insertOne(formattedData);
    console.log('Insert result:', JSON.stringify(result, null, 2));

    if (result.acknowledged && result.insertedId) {
      res.status(201).json({ success: true, message: 'Quotation created successfully', data: { _id: result.insertedId, ...formattedData } });
    } else {
      throw new Error('Failed to insert document into the database');
    }
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: error.message });
  }
};

export const getQuotations = async (req, res) => {
    const { organizationId, userId, page = 1, limit = 10 } = req.query;
  
    if (!organizationId || !userId) {
      return res.status(400).json({ success: false, message: 'Organization ID and User ID are required' });
    }
  
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const quotationsCollection = db.collection('quotations');
  
      const skip = (Number(page) - 1) * Number(limit);
  
      const pipeline = [
        {
          $match: {
            organization_id: new ObjectId(organizationId),
            user_id: new ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'client_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $unwind: {
            path: '$project',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'stock',
            localField: 'stock_id',
            foreignField: '_id',
            as: 'stock'
          }
        },
        {
          $unwind: {
            path: '$stock',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            quotation_id: 1,
            quotation_date: 1,
            uf_value_at_quotation: 1,
            unit_value: 1,
            financing_amount: 1,
            estimated_dividend: 1,
            storage: 1,
            parking: 1,
            'client.first_name': 1,
            'client.last_name': 1,
            'client.email': 1,
            'client.phone': 1,
            'client.rut': 1,
            'project.name': 1,
            'project.address': 1,
            'project.county_name': 1,
            'stock.apartment': 1,
            'stock.real_estate_company_name': 1
          }
        },
        { $skip: skip },
        { $limit: Number(limit) }
      ];
  
      const quotations = await quotationsCollection.aggregate(pipeline).toArray();
  
      const total = await quotationsCollection.countDocuments({
        organization_id: new ObjectId(organizationId),
        user_id: new ObjectId(userId)
      });
  
      res.status(200).json({
        success: true,
        data: quotations,
        page: Number(page),
        limit: Number(limit),
        total
      });
    } catch (error) {
      console.error('Error fetching quotations:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: error.message });
    }
  };

  export const updateQuotation = async (req, res) => {
    const { id } = req.query;
    const updateData = req.body;
  
    if (!id || !updateData) {
      return res.status(400).json({ success: false, message: 'Quotation ID and update data are required' });
    }
  
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const collection = db.collection('quotations');
  
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updated_at: new Date() } },
        { returnDocument: 'after' }
      );
  
      if (result.value) {
        res.status(200).json({ success: true, message: 'Quotation updated successfully', data: result.value });
      } else {
        res.status(404).json({ success: false, message: 'Quotation not found' });
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      res.status(500).json({ success: false, message: 'Failed to update quotation', error: error.message });
    }
  };
  
  export const deleteQuotation = async (req, res) => {
    const { id } = req.query;
  
    if (!id) {
      return res.status(400).json({ success: false, message: 'Quotation ID is required' });
    }
  
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const collection = db.collection('quotations');
  
      const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
  
      if (result.value) {
        res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Quotation not found' });
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      res.status(500).json({ success: false, message: 'Failed to delete quotation', error: error.message });
    }
  };
  
  export const getQuotationDetails = async (req, res) => {
    const { id, organizationId, userId } = req.query;
  
    if (!id || !organizationId || !userId) {
      return res.status(400).json({ success: false, message: 'Quotation ID, Organization ID, and User ID are required' });
    }
  
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);
      const quotationsCollection = db.collection('quotations');
  
      const pipeline = [
        {
          $match: {
            _id: new ObjectId(id),
            organization_id: new ObjectId(organizationId),
            user_id: new ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: 'clients',
            localField: 'client_id',
            foreignField: '_id',
            as: 'client'
          }
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        {
          $unwind: {
            path: '$project',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'stock',
            localField: 'stock_id',
            foreignField: '_id',
            as: 'stock'
          }
        },
        {
          $unwind: {
            path: '$stock',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            quotation_id: 1,
            quotation_date: 1,
            uf_value_at_quotation: 1,
            unit_value: 1,
            financing_amount: 1,
            estimated_dividend: 1,
            storage: 1,
            parking: 1,
            discount_percentage: 1,
            bonus_percentage: 1,
            down_payment_percentage: 1,
            down_payment_contribution: 1,
            down_payment_installments: 1,
            large_installment: 1,
            credit_term_years: 1,
            annual_rate: 1,
            created_at: 1,
            updated_at: 1,
            'client.first_name': 1,
            'client.last_name': 1,
            'client.email': 1,
            'client.phone': 1,
            'client.rut': 1,
            'project.name': 1,
            'project.address': 1,
            'project.county_name': 1,
            'stock.apartment': 1,
            'stock.real_estate_company_name': 1
          }
        }
      ];
  
      const quotation = await quotationsCollection.aggregate(pipeline).next();
  
      if (quotation) {
        res.status(200).json({ success: true, data: quotation });
      } else {
        res.status(404).json({ success: false, message: 'Quotation not found' });
      }
    } catch (error) {
      console.error('Error fetching quotation details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch quotation details', error: error.message });
    }
  };
  
