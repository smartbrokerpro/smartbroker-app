import OpenAI from 'openai';
import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantMap = {
  ProjectAssistant: 'asst_li4YlhbZp8MyQ2YT3KdfJaQC',
  StockAssistant: 'asst_abc1234XYZ',
  AnalysisAssistant: 'asst_Ad4FdKxBOWP3hXXG96tXrMCq',
  // Add more assistants as needed
};

const createThread = async () => {
  console.log('Creating thread...');
  const response = await openai.beta.threads.create();
  console.log('Thread created:', response);
  return response;
};

const addMessageToThread = async (threadId, message) => {
  console.log('Adding message to thread:', threadId, message);
  const response = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
  console.log('Message added:', response);
  return response;
};

const runAssistantOnThread = async (threadId, assistantName) => {
  const assistantId = assistantMap[assistantName];
  if (!assistantId) {
    throw new Error('Invalid assistant name');
  }
  console.log('Running assistant on thread:', threadId, assistantId);
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  console.log('Assistant run response:', response);
  return response;
};

const waitForCompletion = async (threadId, maxRetries = 10, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`Checking if assistant response is ready (attempt ${i + 1}/${maxRetries})...`);
    const response = await openai.beta.threads.runs.list(threadId);
    const run = response.data.find(r => r.status === 'completed');
    if (run) {
      console.log('Assistant run completed:', run);
      return run.id;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Assistant did not complete in time');
};

const getAssistantResponse = async (threadId) => {
  console.log('Getting assistant response for thread:', threadId);
  const messagesResponse = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messagesResponse.data.find(message => message.role === 'assistant');
  console.log('Assistant message:', assistantMessage);
  return assistantMessage ? assistantMessage.content[0].text.value.trim() : null;
};

const getTokenUsage = async (threadId, runId) => {
  console.log('Getting token usage for thread:', threadId, runId);
  const response = await openai.beta.threads.runs.retrieve(threadId, runId);
  console.log('Token usage response:', response);
  return response.usage;
};

export const handleSearchRequest = async (req, res) => {
  const { query, sessionId, includeAnalysis } = req.body;

  if (!query) {
    console.log('No se proporcionó una consulta.');
    return res.status(400).json({ error: 'Se requiere una consulta' });
  }

  if (!sessionId) {
    console.log('No se proporcionó un ID de sesión.');
    return res.status(400).json({ error: 'Se requiere un ID de sesión' });
  }

  try {
    console.log('Iniciando creación de thread para ProjectAssistant...');
    const thread = await createThread();
    const threadId = thread.id;
    await addMessageToThread(threadId, query);
    await runAssistantOnThread(threadId, 'ProjectAssistant');
    const runId = await waitForCompletion(threadId);
    const initialResponse = await getAssistantResponse(threadId, runId);

    if (!initialResponse) {
      throw new Error('No se recibió respuesta del asistente.');
    }

    console.log('Respuesta inicial recibida:', initialResponse);
    const mongoCommand = JSON.parse(initialResponse.replace(/\n/g, '').replace(/\\+/g, '\\\\+'));
    const { action, command, limit } = mongoCommand;

    if (!action || !command) {
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde el asistente', initialResponse });
    }

    const client = await clientPromise;
    const db = client.db('real_estate_management');
    const stockCollection = db.collection('stock');
    const projectsCollection = db.collection('projects');
    let results;

    const queryOptions = limit ? { limit } : {};

    switch (action) {
      case 'filter':
        console.log('Ejecutando comando MongoDB:', command);
        results = await stockCollection.find(command, queryOptions).toArray();
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    console.log('Resultados obtenidos:', results.length);

    const projectIds = results.map(result => new ObjectId(result.project_id));
    const projectDetails = await projectsCollection.find({
      _id: { $in: projectIds }
    }).toArray();

    const summarizedResults = results.map(result => {
      const project = projectDetails.find(proj => proj._id.toString() === result.project_id.toString());
      return {
        project_name: project ? project.name : 'Proyecto desconocido',
        apartment: result.apartment,
        typology: result.typology,
        current_list_price: result.current_list_price,
        total_surface: result.total_surface,
        orientation: result.orientation,
        county_name: result.county_name,
        down_payment_bonus: result.down_payment_bonus,
        discount: result.discount,
        link: `http://localhost:3000/projects/${result.project_id}/stock/${result._id}`
      };
    });

    const calculateStatistics = (values) => {
      const total = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / total;
      const sortedValues = values.slice().sort((a, b) => a - b);
      const median = total % 2 === 0 ? (sortedValues[total / 2 - 1] + sortedValues[total / 2]) / 2 : sortedValues[Math.floor(total / 2)];
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { total, sum, mean, median, min, max };
    };

    const summary = {
      total: summarizedResults.length,
      projects: summarizedResults.reduce((acc, result) => {
        acc[result.project_name] = (acc[result.project_name] || 0) + 1;
        return acc;
      }, {}),
      typologies: summarizedResults.reduce((acc, result) => {
        acc[result.typology] = (acc[result.typology] || 0) + 1;
        return acc;
      }, {}),
      counties: summarizedResults.reduce((acc, result) => {
        acc[result.county_name] = (acc[result.county_name] || 0) + 1;
        return acc;
      }, {}),
      orientations: summarizedResults.reduce((acc, result) => {
        acc[result.orientation] = (acc[result.orientation] || 0) + 1;
        return acc;
      }, {}),
      bonuses: summarizedResults.reduce((acc, result) => {
        const bonusValue = Math.floor(result.down_payment_bonus);
        acc[bonusValue] = (acc[bonusValue] || 0) + 1;
        return acc;
      }, {}),
      discounts: summarizedResults.reduce((acc, result) => {
        acc[result.discount] = (acc[result.discount] || 0) + 1;
        return acc;
      }, {}),
      statistics: {
        price: calculateStatistics(summarizedResults.map(result => result.current_list_price)),
        total_surface: calculateStatistics(summarizedResults.map(result => result.total_surface)),
      }
    };

    console.log('Resumen de resultados generado:', summary);

    let analysisResponse = '';
    if (includeAnalysis) {
      console.log('Iniciando creación de nuevo thread para AnalysisAssistant...');
      const analysisThread = await createThread();
      const analysisThreadId = analysisThread.id;
      await addMessageToThread(analysisThreadId, `Analiza el siguiente resumen de resultados y proporciona un análisis estadístico en formato de texto. Resumen de resultados: ${JSON.stringify(summary, null, 2)}`);
      await runAssistantOnThread(analysisThreadId, 'AnalysisAssistant');
      const analysisRunId = await waitForCompletion(analysisThreadId);
      analysisResponse = await getAssistantResponse(analysisThreadId, analysisRunId);

      if (!analysisResponse) {
        throw new Error('No se recibió respuesta del asistente para el análisis.');
      }
      console.log('Respuesta de análisis recibida:', analysisResponse);
    }

    const columns = [
      { id: 'project_name', label: 'Proyecto' },
      { id: 'apartment', label: 'Unidad' },
      { id: 'current_list_price', label: 'Precio' },
      { id: 'typology', label: 'Tipología' },
      { id: 'orientation', label: 'Orientación' },
      { id: 'total_surface', label: 'Superficie Total' },
      { id: 'county_name', label: 'Comuna' },
      { id: 'down_payment_bonus', label: 'Bono' },
      { id: 'discount', label: 'Descuento' },
      { id: 'link', label: '', format: value => `<button onClick="window.location.href='${value}'">Ver Unidad</button>` }
    ];

    const finalResponse = {
      analysis: analysisResponse,
      result: {
        columns: columns,
        rows: summarizedResults
      },
      summary: summary
    };

    res.status(200).json(finalResponse);
  } catch (error) {
    console.error('Error en la generación de respuesta:', error);
    res.status(500).json({ error: 'Error en la generación de respuesta', details: error.message });
  }
};
