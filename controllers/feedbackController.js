import { ObjectId } from 'mongodb';
import clientPromise from '../lib/mongodb';

export async function updateFeedback(req, res) {
  const { feedbackId, feedback, userId, organizationId } = req.body;

  if (!feedbackId || feedback === undefined || !userId || !organizationId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const feedbackCollection = db.collection('feedbacks');

    const result = await feedbackCollection.updateOne(
      { _id: new ObjectId(feedbackId) },
      { 
        $set: { 
          feedback: feedback,
          feedbackDate: new Date(),
          userId: new ObjectId(userId),
          organizationId: new ObjectId(organizationId)
        }
      },
      { upsert: true }
    );

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      return res.status(404).json({ error: 'Feedback entry not found and could not be created' });
    }

    res.status(200).json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}