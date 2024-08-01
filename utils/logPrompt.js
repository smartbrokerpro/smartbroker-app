import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function logPrompt(userId, userEmail, organization, creditsUsed, tokensUsed, success, prompt, model) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const log = {
      userId: new ObjectId(userId),
      userEmail: userEmail,
      organizationId: new ObjectId(organization._id),
      organizationName: organization.name,
      prompt: prompt,
      currentCredits: organization.credits.current,
      creditsUsed,
      tokensUsed,
      model, // Guarda el modelo utilizado
      success,
      createdAt: new Date()
    };

    console.log('Guardando log de prompt:', log);

    const result = await db.collection('prompt_logs').insertOne(log);
    console.log('Log guardado correctamente:', result);
  } catch (error) {
    console.error('Error al guardar el log del prompt:', error);
  }
}
