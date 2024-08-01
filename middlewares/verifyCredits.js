import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const verifyCredits = async (req, res, next) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const organization = await db.collection('organizations').findOne({ _id: new ObjectId(organizationId) });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    if (organization.credits.current <= 0) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    next();
  } catch (error) {
    console.error('Error in verifyCredits middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default verifyCredits;
