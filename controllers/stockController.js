import Stock from '@/models/stockModel';
import OpenAI from 'openai';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stockModel = {
  "stock": {
    "_id": "ObjectId",
    "project_id": "ObjectId",
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
    "created_at": "Date",
    "county_id": "ObjectId",
    "county_name": "string",
    "real_estate_company_name": "string",
    "region_name": "string",
    "available": "number"
  }
};

const generateContext = (prompt, projectId) => {
  return `
Dado el siguiente modelo para la colección de stock en MongoDB:
${JSON.stringify(stockModel, null, 2)}

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON. Todas las peticiones deben incluir obligatoriamente los parámetros "apartment" y "project_id", donde "project_id" es un ObjectId.
 
MUY IMPORTANTE: SIEMPRE INCORPORA EL "project_id"

Ejemplos de posibles entradas:
1. "Crear una nueva unidad de stock con el apartamento '204' y project_id '${projectId}'."
   Respuesta esperada: {"action": "create", "command": { "apartment": "204", "project_id": { "$oid": "${projectId}" } }}
2. "Actualizar la orientación a NORTE del apartamento '306' en el project_id '${projectId}'."
   Respuesta esperada: {"action": "update", "command": { "q": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }, "u": { "$set": { "orientation": "NORTE" } } }}
3. "Eliminar la unidad de stock con el apartamento '306' en el project_id '${projectId}'."
   Respuesta esperada: {"action": "delete", "command": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }}
4. "Filtrar las unidades de stock que tengan valores de unidad entre 2000 y 4000 UF en el project_id '${projectId}'."
   Respuesta esperada: {"action": "filter", "command": { "project_id": { "$oid": "${projectId}" }, "current_list_price": { "$gte": 2000, "$lte": 4000 } }}

Entrada del usuario:
${prompt}
`;
};


export const handleGPTRequest = async (req, res) => {
  const { prompt, project_id } = req.body;

  if (!prompt || !project_id) {
    console.log('Se requiere un prompt y project_id');
    return res.status(400).json({ error: 'Se requiere un prompt y project_id' });
  }

  const context = generateContext(prompt, project_id);
  console.log('Contexto generado para GPT-4:', context);

  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: `Texto: ${prompt}` }
      ],
      max_tokens: 150,
    });

    const message = gptResponse.choices[0].message.content.trim();
    console.log('Respuesta de GPT-4:', message);

    let response;
    try {
      response = JSON.parse(message.replace(/\n/g, ''));
      console.log('Respuesta JSON parseada:', response);
    } catch (e) {
      console.log('Error al parsear JSON:', e);
      return res.status(400).json({ error: 'Formato JSON inválido desde GPT-4', gptResponse: message });
    }

    const { action, command } = response;

    if (!action || !command) {
      console.log('Acción o comando no reconocidos en la respuesta:', response);
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection('stock');

    switch (action) {
      case 'create':
        console.log('Procesando una creación');
        const newStock = await collection.insertOne({ ...command, project_id: new ObjectId(command.project_id.$oid), updatedAt: new Date() });
        console.log('Unidad de stock creada:', newStock);
        res.status(201).json({ success: true, data: newStock.ops ? newStock.ops[0] : { _id: newStock.insertedId, ...command } });
        break;
      case 'update':
        console.log('Procesando una actualización');
        const { q, u } = command;

        if (!q || !u || !q.apartment || !q.project_id || !u.$set) {
          console.log('Formato de respuesta incompleto desde GPT-4:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
        }

        const projectObjectId = new ObjectId(q.project_id.$oid);
        const updatedStock = await collection.findOneAndUpdate(
          { apartment: q.apartment, project_id: projectObjectId },
          { $set: { ...u.$set, updatedAt: new Date() } },
          { returnDocument: 'after' }
        );

        console.log('Respuesta de findOneAndUpdate:', updatedStock);

        if (updatedStock) {
          console.log('Unidad de stock actualizada:', updatedStock);
          return res.status(200).json({ success: true, data: updatedStock });
        } else {
          console.log('Unidad de stock no encontrada para la actualización');
          return res.status(404).json({ error: 'Unidad de stock no encontrada para la actualización' });
        }
        break;
      case 'delete':
        console.log('Procesando una eliminación');
        const deleteCmd = command;
        console.log('Filtro de eliminación:', deleteCmd);

        if (!deleteCmd.apartment || !deleteCmd.project_id) {
          console.log('Formato de respuesta incompleto desde GPT-4:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
        }

        const projectIdObject = new ObjectId(deleteCmd.project_id.$oid);
        const deletedStock = await collection.findOneAndDelete({ apartment: deleteCmd.apartment, project_id: projectIdObject });

        console.log("Respuesta de deletedStock:", Boolean(deletedStock), deletedStock);
        if (deletedStock) {
          console.log('Unidad de stock eliminada:', deletedStock.value);
          return res.status(200).json({ success: true, data: deletedStock.value });
        } else {
          console.log('Unidad de stock no encontrada para la eliminación');
          return res.status(404).json({ error: 'Unidad de stock no encontrada para la eliminación' });
        }
        break;
      case 'filter':
        console.log('Procesando un filtro');
        const filterCriteria = command;
        console.log('Criterios de filtro:', filterCriteria);

        if (!filterCriteria.project_id) {
          console.log('Formato de respuesta incompleto desde GPT-4:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
        }

        filterCriteria.project_id = new ObjectId(filterCriteria.project_id.$oid);

        const stocks = await collection.find(filterCriteria).toArray();
        console.log('Unidades de stock filtradas:', stocks);
        return res.status(200).json({ success: true, data: stocks });
        break;
      default:
        console.log('Acción no válida en el comando:', response);
        return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error del servidor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const getStock = async (req, res) => {
  const { idProject } = req.query;
  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo stock...');

    const stock = await db.collection('stock').aggregate([
      {
        $match: {
          project_id: new ObjectId(idProject)
        }
      },
      {
        $lookup: {
          from: 'counties',
          localField: 'county_id',
          foreignField: '_id',
          as: 'county'
        }
      },
      {
        $unwind: {
          path: '$county',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'real_estate_companies',
          localField: 'real_estate_company_id',
          foreignField: '_id',
          as: 'real_estate_company'
        }
      },
      {
        $unwind: {
          path: '$real_estate_company',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          apartment: 1,
          role: 1,
          model: 1,
          typology: 1,
          program: 1,
          orientation: 1,
          interior_surface: 1,
          terrace_surface: 1,
          total_surface: 1,
          current_list_price: 1,
          down_payment_bonus: 1,
          discount: 1,
          rent: 1,
          status_id: 1,
          created_at: 1,
          county: {
            id: '$county._id',
            name: '$county.name'
          },
          real_estate_company: {
            id: '$real_estate_company._id',
            name: '$real_estate_company.name'
          },
          region_name: 1,
          available: 1,
          updatedAt: 1
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]).toArray();

    res.status(200).json({ success: true, data: stock });
  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createStock = async (req, res) => {
  try {
    const newStock = new Stock(req.body);
    const savedStock = await newStock.save();
    res.status(201).json({ success: true, data: savedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStock = await Stock.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedStock) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: updatedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStock = await Stock.findByIdAndDelete(id);
    if (!deletedStock) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: deletedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};