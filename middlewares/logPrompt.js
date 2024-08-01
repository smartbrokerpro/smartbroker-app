// middlewares/logPrompt.js
import PromptLog from '@/models/promptLogModel';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const logPrompt = async (req, res, next) => {
  const { prompt, project_id, organizationId } = req.body;
  const session = req.session;

  if (!session || !session.user) {
    console.log('Usuario no autenticado');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const userId = session.user._id;

  if (!prompt || !project_id || !organizationId) {
    console.log('Se requiere un prompt, project_id y organization_id');
    return res.status(400).json({ error: 'Se requiere un prompt, project_id y organization_id' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const organization = await db.collection('organizations').findOne({ _id: new ObjectId(organizationId) });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const tokensUsed = req.tokensUsed || 0;
    const creditsUsed = Math.ceil(tokensUsed / 1000);

    if (organization.credits.current < creditsUsed) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    await db.collection('organizations').updateOne(
      { _id: new ObjectId(organizationId) },
      { $inc: { 'credits.current': -creditsUsed } }
    );

    // Registrar el log del prompt
    const promptLog = new PromptLog({
      user: new ObjectId(userId),
      prompt: prompt,
      currentCredits: organization.credits.current,
      creditsUsed: creditsUsed,
      tokensUsed: tokensUsed,
      success: true,
    });

    await promptLog.save();

    // Almacenar los créditos actualizados en la respuesta
    req.updatedCredits = organization.credits.current - creditsUsed;

    next();
  } catch (error) {
    console.error('Error logging prompt:', error);
    next(error);
  }
};

export default logPrompt;
