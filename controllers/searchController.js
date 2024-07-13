import OpenAI from 'openai';
import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stockModel = {
  "_id": "ObjectId",
  "real_estate_company_id": "ObjectId",
  "project_id": "ObjectId",
  "county_id": "ObjectId",
  "county_name": "string",
  "apartment": "string",
  "role": "string",
  "model": "string",
  "typology": "string",
  "program": "string",
  "orientation": "string",
  "interior_surface": "number",
  "terrace_surface": "number",
  "total_surface": "number",
  "current_list_price": "number",
  "down_payment_bonus": "number",
  "discount": "number",
  "rent": "number",
  "status_id": "ObjectId",
  "typology_info": "string",
  "created_at": "date"
};

const projectModel = {
  "_id": "ObjectId",
  "name": "string",
  "address": "string",
  "county_id": "ObjectId",
  "country_id": "ObjectId",
  "real_estate_company_id": "ObjectId",
  "location": {
    "lat": "number",
    "lng": "number"
  }
};

const countyModel = {
  "_id": "ObjectId",
  "name": "string",
  "state_id": "ObjectId"
};

const generateContext = (prompt) => {
  return `
  Dado el siguiente modelo para la colección de stock en MongoDB:
  ${JSON.stringify(stockModel, null, 2)}

  Dado el siguiente modelo para la colección de proyectos en MongoDB:
  ${JSON.stringify(projectModel, null, 2)}

  Dado el siguiente modelo para la colección de counties en MongoDB:
  ${JSON.stringify(countyModel, null, 2)}

  Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

  Ten en cuenta lo siguiente:
  - Si se solicita una cantidad específica de resultados, usa la opción "limit" en el comando MongoDB.
  - Para la tipología, considera que puede ser escrita de diferentes maneras, como "2D+2B", "2D 2B", "2D-2B", etc. Debes detectar cualquier formato que indique una cantidad de dormitorios (D) y baños (B).

  Ejemplos de posibles entradas:
  1. "Muéstrame todas las unidades con 2 dormitorios y 2 baños."
     Respuesta esperada: {"action": "filter", "command": {"typology": {"$regex": "2D.*2B"}}}
  2. "Enséñame todas las unidades con orientación al norte."
     Respuesta esperada: {"action": "filter", "command": {"orientation": {"$regex": "NORTE"}}}
  3. "Encuentra todas las unidades con un bono de pago inicial del 15%."
     Respuesta esperada: {"action": "filter", "command": {"down_payment_bonus": {"$regex": "15%"}}}
  4. "Busca todas las unidades con un descuento del 10%."
     Respuesta esperada: {"action": "filter", "command": {"discount": {"$regex": "10%"}}}
  5. "Listar todas las unidades con una superficie total entre 50 a 60 metros cuadrados."
     Respuesta esperada: {"action": "filter", "command": {"total_surface": {"$gte": 50, "$lte": 60}}}
  6. "Quiero ver todas las unidades en la comuna de La Florida."
     Respuesta esperada: {"action": "filter", "command": {"county_name": "La Florida"}}}
  7. "Muéstrame todas las unidades con valor menor a 3000 UF."
     Respuesta esperada: {"action": "filter", "command": {"current_list_price": {"$lt": 3000}}}
  8. "Muéstrame todas las unidades que tienen terraza."
     Respuesta esperada: {"action": "filter", "command": {"terrace_surface": {"$gt": 0}}}
  9. "Enséñame todas las unidades que están en Ñuñoa."
     Respuesta esperada: {"action": "filter", "command": {"county_name": "Ñuñoa"}}}
  10. "Encuentra todas las unidades que tienen un programa de 2D/2B/CA."
     Respuesta esperada: {"action": "filter", "command": {"program": {"$regex": "2D.*2B.*CA"}}}
  11. "Busca todas las unidades del modelo ALL ÑUÑOA II."
     Respuesta esperada: {"action": "filter", "command": {"model": "ALL ÑUÑOA II"}}}
  12. "Listar todas las unidades que fueron creadas después del 1 de enero de 2024."
     Respuesta esperada: {"action": "filter", "command": {"created_at": {"$gte": {"$date": "2024-01-01T00:00:00Z"}}}}}
  13. "Quiero ver todas las unidades que tienen una superficie interior mayor a 70 metros cuadrados."
     Respuesta esperada: {"action": "filter", "command": {"interior_surface": {"$gt": 70}}}
  14. "Muéstrame todas las unidades con un precio menor a 3000 UF y que tengan 2 dormitorios y 1 baño."
     Respuesta esperada: {"action": "filter", "command": {"current_list_price": {"$lt": 3000}, "typology": {"$regex": "2D.*1B"}}}
  15. "Enséñame todas las unidades con 2 dormitorios y 1 baño, y orientación al norte."
     Respuesta esperada: {"action": "filter", "command": {"typology": {"$regex": "2D.*1B"}, "orientation": {"$regex": "NORTE"}}}
  16. "Busca todas las unidades con una superficie total entre 50 y 60 metros cuadrados en Ñuñoa."
     Respuesta esperada: {"action": "filter", "command": {"total_surface": {"$gte": 50, "$lte": 60}, "county_name": "Ñuñoa"}}}
  17. "Encuentra 4 unidades de 2 dormitorios y 1 baño en la comuna de Ñuñoa de menos de 3000 UF."
     Respuesta esperada: {"action": "filter", "command": {"typology": {"$regex": "2D.*1B"}, "county_name": "Ñuñoa", "current_list_price": {"$lt": 3000}}, "limit": 4}

  Si te piden valores en monedas ($, pesos, UF), filtra solo por el número ignorando la unidad.

  Nota: Ahora se utiliza el campo 'county_name' directamente en la colección 'stock'.

  Entrada del usuario:
  ${prompt}
  `;
};

const makeRequestWithRetries = async (messages, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const gptResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 200,
      });
      return gptResponse.choices[0].message.content.trim();
    } catch (error) {
      if (error.code === 'rate_limit_exceeded' && i < retries - 1) {
        const retryAfter = (error.headers && error.headers['retry-after'] * 1000) || 5000;
        console.log(`Rate limit exceeded. Reintentando en ${retryAfter / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      } else if (error.code === 'insufficient_quota') {
        console.error('Insufficient quota. Please check your plan and billing details.');
        throw new Error('Insufficient quota. Please check your plan and billing details.');
      } else {
        throw error;
      }
    }
  }
  throw new Error('Maximum retries exceeded');
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
    console.log('Generando contexto para GPT-4...');
    const context = generateContext(query);
    console.log('Contexto generado:', context);

    const initialResponse = await makeRequestWithRetries([
      { role: 'system', content: context },
      { role: 'user', content: `Texto: ${query}` }
    ]);

    console.log('Respuesta inicial de GPT-4:', initialResponse);

    const mongoCommand = JSON.parse(initialResponse.replace(/\n/g, '').replace(/\\+/g, '\\\\+'));
    console.log('Comando MongoDB generado:', mongoCommand);

    const { action, command, limit } = mongoCommand;

    if (!action || !command) {
      console.log('Acción o comando no reconocidos en la respuesta:', mongoCommand);
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', initialResponse });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const stockCollection = db.collection('stock');
    const projectsCollection = db.collection('projects');
    let results;

    const queryOptions = limit ? { limit } : {};

    switch (action) {
      case 'filter':
        console.log('Ejecutando filtro en la colección de stock:', command);
        results = await stockCollection.find(command, queryOptions).toArray();
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }

    // Obtener detalles del proyecto para cada resultado
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
        const bonusValue = Math.floor(result.down_payment_bonus); // Aproximar hacia abajo
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
    

    console.log("summary", summary);
    let analysisResponse = '';
    if (includeAnalysis) {
      analysisResponse = await makeRequestWithRetries([
        { role: 'system', content: `Analiza el siguiente resumen de resultados y proporciona un análisis estadístico en formato de texto, incluyendo mínimos, máximos, medias, distribuciones. Busca algún dato o relación de interés, por ejemplo si alguna orientación es más cara que otras. Usa comuna en vez de condado. 80 palabras máximo. Para los valores usa UF como unidad y dale formato de miles con . (ej: 3.200 UF)` },
        { role: 'user', content: `Resumen de resultados: ${JSON.stringify(summary, null, 2)}` }
      ]);
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
