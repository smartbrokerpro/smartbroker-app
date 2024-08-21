import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function getRealEstateCompanies(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');
    const companies = await collection.find({}).toArray();

    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching real estate companies:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

export async function createRealEstateCompany(req, res) {
  try {
    const { 
      name, 
      address, 
      contact_person, 
      description, 
      email, 
      phone, 
      website 
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    const now = new Date();

    const newCompany = { 
      name,
      address: address || null,
      contact_person: contact_person || null,
      description: description || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(newCompany);
    
    newCompany._id = result.insertedId;

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    console.error('Error creating real estate company:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

export async function updateRealEstateCompany(req, res) {
  try {
    const { id } = req.query;
    const { 
      name, 
      address, 
      contact_person, 
      description, 
      email, 
      phone, 
      website 
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    const updatedCompany = {
      name,
      address: address || null,
      contact_person: contact_person || null,
      description: description || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      updatedAt: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedCompany },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, data: result.value });
  } catch (error) {
    console.error('Error updating real estate company:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

export async function deleteRealEstateCompany(req, res) {
  try {
    const { id } = req.query;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('real_estate_companies');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting real estate company:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}