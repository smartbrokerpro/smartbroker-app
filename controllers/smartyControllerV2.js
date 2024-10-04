// controllers/smartyControllerV2.js

import clientPromise from '../lib/mongodb';
import OpenAI from 'openai';
import Stock from '../models/stockModel';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const schemaDescription = JSON.stringify(Stock.schema.obj, null, 2);

function parseMongoQuery(queryString) {
  queryString = queryString.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  // Reemplazar operadores de MongoDB sin comillas por versiones con comillas
  queryString = queryString.replace(/(\w+):\s*{(\$[a-z]+):/g, '$1:{"$2":');
  
  try {
    return JSON.parse(queryString);
  } catch (error) {
    console.error('Error al parsear la consulta:', error);
    
    // Intento de recuperación: evaluar como objeto JavaScript
    try {
      queryString = queryString.replace(/'/g, '"');
      const safeEval = new Function('return ' + queryString);
      return safeEval();
    } catch (evalError) {
      console.error('Error al evaluar la consulta:', evalError);
      throw new Error('Invalid MongoDB query format');
    }
  }
}

function flexibleQuery(field, value) {
  if (field === 'typology') {
    return flexibleTypologyQuery(value);
  } else if (field === 'orientation') {
    return { $regex: new RegExp(value, 'i') };
  } else if (typeof value === 'object' && value !== null) {
    // Convertir valores de cadena a número para campos numéricos
    if ('$gt' in value || '$lt' in value || '$gte' in value || '$lte' in value) {
      const convertedValue = {};
      for (const key in value) {
        convertedValue[key] = Number(value[key]);
      }
      return convertedValue;
    }
    return value;
  } else if (field === 'total_surface' || field === 'current_list_price' || field === 'discount') {
    // Convertir a número si es una cadena
    return typeof value === 'string' ? Number(value) : value;
  } else {
    return { $regex: new RegExp(`^${value}$`, 'i') };
  }
}

function flexibleTypologyQuery(typology) {
  const normalizedTypology = typology.toLowerCase().replace(/\s+/g, '');
  
  const dormitorios = normalizedTypology.match(/(\d+)d/);
  const banos = normalizedTypology.match(/(\d+)b/);
  
  if (dormitorios) {
    let regex = `${dormitorios[1]}\\s*d`;
    if (banos) {
      regex += `.*?${banos[1]}\\s*b`;
    } else {
      regex += '.*?\\d+\\s*b';
    }
    return { $regex: new RegExp(regex, 'i') };
  }
  
  return { $regex: new RegExp(normalizedTypology.replace(/\d+/g, '\\d+'), 'i') };
}

export async function handleSearchRequest(req, res) {
  const { query, organizationId, userId } = req.body;

  if (!query || !organizationId || !userId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('Query recibida:', query);

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { 
          role: "system", 
          content: `Eres un experto en generar consultas MongoDB para búsquedas de propiedades inmobiliarias. 
          Utiliza este esquema de la colección 'stock' para generar las consultas:
          ${schemaDescription}
          Responde ÚNICAMENTE con el objeto JSON que representa la consulta MongoDB, sin explicaciones adicionales. 
          Para agregaciones, usa la estructura: {"aggregate": "stock", "pipeline": [...]}.
          Para búsquedas simples, usa la estructura: {"find": {...}, "sort": {...}, "limit": ...}.
          Asegúrate de manejar posibles valores no numéricos o nulos en los campos numéricos, especialmente en divisiones.
          Para tipologías, usa el campo 'typology' y especifica el número de dormitorios y baños (ej: "1 dormitorio 1 baño" o "1D1B").
          Para orientación, usa el campo 'orientation'.
          Para superficies, usa el campo 'total_surface'.
          Para descuentos, usa el campo 'discount'.
          Siempre incorpora indicadores además del _id. Por ejemplo, si te piden proyectos, agrega también el nombre del proyecto.
          Para disponibilidad o tipo de entrega usa el campo 'deliveryType'.
          Asegúrate de que todos los operadores de MongoDB (como $gt, $lt, etc.) estén entre comillas.`
        },
        { role: "user", content: query }
      ],
    });

    const mongoQueryString = gptResponse.choices[0].message.content.trim();
    console.log('Consulta MongoDB generada:', mongoQueryString);

    const parsedQuery = parseMongoQuery(mongoQueryString);
    console.log('Consulta MongoDB parseada:', JSON.stringify(parsedQuery));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('stock');

    let results;
    if (parsedQuery.find) {
      const flexibleQueryCriteria = Object.entries(parsedQuery.find).map(([key, value]) => ({
        [key]: flexibleQuery(key, value)
      }));

      const findQuery = {
        $and: [
          ...flexibleQueryCriteria,
          { current_list_price: { $type: "number", $ne: null } },
          { total_surface: { $type: "number", $ne: null, $gt: 0 } }
        ]
      };

      console.log('Consulta flexible generada:', JSON.stringify(findQuery));

      results = await collection.find(findQuery)
                                .sort(parsedQuery.sort || {})
                                .limit(parsedQuery.limit || 0)
                                .toArray();
    } else if (parsedQuery.aggregate && Array.isArray(parsedQuery.pipeline)) {
      // Lógica para agregaciones (se mantiene igual)
      const aggregatePipeline = [
        {
          $match: {
            $and: [
              { current_list_price: { $type: "number", $ne: null } },
              { total_surface: { $type: "number", $ne: null, $gt: 0 } }
            ]
          }
        },
        {
          $addFields: {
            pricePerM2: {
              $divide: ["$current_list_price", "$total_surface"]
            }
          }
        },
        ...parsedQuery.pipeline
      ];
      results = await collection.aggregate(aggregatePipeline).toArray();
    } else {
      throw new Error('Unsupported query format');
    }

    console.log(`Número de resultados obtenidos: ${results.length}`);

    const analysisPrompt = `
      Analiza brevemente los siguientes resultados: ${JSON.stringify(results)}, considerando que la consulta original del usuario fue ${query}
      
      Instrucciones:
      1. Proporciona un análisis conciso de los resultados como tabla, con 20 palabras introductorias
      2. Menciona los valores más altos y más bajos encontrados, indicando a qué corresponden.
      3. Si es relevante, indica el total o promedio de los valores numéricos.
      4. No hagas suposiciones sobre información no proporcionada en los datos.
      5. Si no hay resultados, explica posibles razones por las que la búsqueda no arrojó resultados y sugiere cómo ampliar la búsqueda.
      6. Nunca uses ids de mongo, siempre usa nombres cuando sea posible.
      7. Siempre indica el proyecto primero y luego el número de la unidad.
      8. La jerarquía de la información es inmobiliaria, proyecto, unidad o stock o departamento o apartamento
      9. Usa siempre los datos entregados, NUNCA los inventes.
      10. Valor es lo mismo que precio.
      11. Siempre ordena los valores de mayor a menor, o viceversa, a tu criterio.
      12. Si haces calculos, muestra las fórmulas generales, no expandidas con números. Por ejemplo, sumatorias está bien,  mostrar cada numero sumándoese está mal. Muestra siempre los resultados de las fórmulas.
      13. Los números deben siempre usar . para miles y , para decimales, tanto en la explicación como en las tablas.
      14. Cuando te pidan unidades, haz que el numero o nombre de la unidad sea un enlace que lleve a http://localhost:3000/[project_id]/stock/[id_unidad], donde id_unidad es el id de mongo de esa unidad, y project_id es el id de mongo del proyecto al que pertenece, no uses nombres, solo ids de mongo.
      Tu análisis debe ser breve y basado únicamente en la información proporcionada. Precios en UF
    `;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        { 
          role: "system", 
          content: "Eres un experto analista del mercado inmobiliario. Tu tarea es proporcionar análisis detallados y perspicaces de datos inmobiliarios, incluyendo no solo promedios, sino también otras métricas relevantes como varianza, mediana, desviación estándar y cualquier otra estadística que ayude a clarificar la interpretación de los datos cuando sea apropiado. Agrega una definición de cada métrica de 3 a 4 palabras cuando sean usadas."
        },
        { role: "user", content: analysisPrompt }
      ],
    });

    const analysis = analysisResponse.choices[0].message.content;
    console.log('Análisis generado:', analysis);

    res.status(200).json({
      results,
      analysis,
    });

  } catch (error) {
    console.error('Error en handleSearchRequest:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}