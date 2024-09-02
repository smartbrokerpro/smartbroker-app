import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { dbOperations, organizationId } = req.body;

    if (!dbOperations || !organizationId) {
      return res.status(400).json({ message: 'DB operations and Organization ID are required.' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const projectsCollection = db.collection('projects');

    const results = {
      inserted: 0,
      updated: 0,
      errors: [],
    };

    const orgId = new ObjectId(organizationId);

    // Perform inserts
    if (dbOperations.insert && dbOperations.insert.length > 0) {
      try {
        const documentsToInsert = dbOperations.insert.map(op => ({
          ...op.document,
          organization_id: orgId
        }));
        const insertResult = await projectsCollection.insertMany(documentsToInsert);
        results.inserted = insertResult.insertedCount;
      } catch (error) {
        results.errors.push(`Insert error: ${error.message}`);
      }
    }

    // Perform updates
    if (dbOperations.update && dbOperations.update.length > 0) {
      for (const op of dbOperations.update) {
        try {
          const updateResult = await projectsCollection.updateOne(
            { 
              _id: new ObjectId(op.filter._id),
              organization_id: orgId 
            },
            op.update
          );
          if (updateResult.modifiedCount > 0) {
            results.updated++;
          }
        } catch (error) {
          results.errors.push(`Update error for ${op.filter._id}: ${error.message}`);
        }
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error applying updates:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}