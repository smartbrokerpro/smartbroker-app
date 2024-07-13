import Project from '../models/projectModel';
import OpenAI from 'openai';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const projectModel = {
  "projects": {
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
  }
};

const generateContext = (prompt) => {
  return `
Dado el siguiente modelo para la colección de proyectos en MongoDB:
${JSON.stringify(projectModel, null, 2)}

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON.

Ejemplos de posibles entradas:
1. "Crear un nuevo proyecto con el nombre 'Edificio Central', dirección 'Calle Falsa 123'."
   Respuesta esperada: {"action": "create", "command": { "name": "Edificio Central", "address": "Calle Falsa 123" }}
2. "Actualizar el proyecto con nombre 'Edificio Central'. Establecer la dirección a 'Calle Verdadera 456'."
   Respuesta esperada: {"action": "update", "command": { "q": { "name": "Edificio Central" }, "u": { "$set": { "address": "Calle Verdadera 456" } } }}
3. "Eliminar el proyecto con nombre 'Edificio Central'."
   Respuesta esperada: {"action": "delete", "command": { "name": "Edificio Central" }}
4. "Filtrar los proyectos que tengan valores de unidad entre 2000 y 4000 UF."
   Respuesta esperada: {"action": "filter", "command": { "min_price": { "$gte": 2000 }, "max_price": { "$lte": 4000 } }}

Entrada del usuario:
${prompt}
`;
};

export const handleGPTRequest = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    console.log('No se proporcionó un prompt');
    return res.status(400).json({ error: 'Se requiere un prompt' });
  }

  const context = generateContext(prompt);
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
      response = JSON.parse(message.replace(/\n/g, '')); // Eliminar saltos de línea y analizar JSON
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
    const collection = db.collection('projects');

    switch (action) {
      case 'create':
        console.log('Procesando una creación');
        const newProject = await collection.insertOne({ ...command, updatedAt: new Date() });
        console.log('Proyecto creado:', newProject);
        res.status(201).json({ success: true, data: newProject.ops ? newProject.ops[0] : { _id: newProject.insertedId, ...command } });
        break;
      case 'update':
        console.log('Procesando una actualización');
        const { q, u } = command;
        console.log('Filtro de actualización:', q);
        console.log('Actualización de datos:', u);
        if (!q || !u) {
          console.log('Formato de respuesta incompleto desde GPT-4:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-4', gptResponse: message });
        }

        // Verificar la existencia del proyecto
        const projectToUpdate = await collection.findOne(q);
        console.log('Proyecto encontrado para actualizar:', projectToUpdate);
        if (!projectToUpdate) {
          console.log('Proyecto no encontrado para la actualización');
          return res.status(404).json({ error: 'Proyecto no encontrado para la actualización' });
        }

        console.log('ID del proyecto a actualizar:', projectToUpdate._id);
        const updatedProject = await collection.findOneAndUpdate(
          { _id: projectToUpdate._id },
          { $set: { ...u.$set, updatedAt: new Date() } },
          { returnOriginal: false, returnDocument: 'after' } // Asegurarse de que se devuelva el documento actualizado
        );

        console.log('Respuesta de findOneAndUpdate:', updatedProject);

        if (updatedProject) {
          console.log('Proyecto actualizado:', updatedProject);
          res.status(200).json({ success: true, data: updatedProject, updatedProjectId: updatedProject._id });
        } else {
          console.log('Proyecto no encontrado para la actualización después del intento');
          res.status(404).json({ error: 'Proyecto no encontrado para la actualización' });
        }
        break;
      case 'delete':
        console.log('Procesando una eliminación');
        const deleteCmd = command;
        console.log('Filtro de eliminación:', deleteCmd);
        const deletedProject = await collection.findOneAndDelete(deleteCmd);
        console.log("Respuesta de deletedProject:", Boolean(deletedProject), deletedProject);
        if (deletedProject) {
          console.log('Proyecto eliminado:', deletedProject);
          res.status(200).json({ success: true, data: deletedProject.value, deletedProjectId: deletedProject.value._id });
        } else {
          console.log('Proyecto no encontrado para la eliminación');
          res.status(404).json({ error: 'Proyecto no encontrado para la eliminación' });
        }
        break;
      case 'filter':
        console.log('Procesando un filtro');
        const filterCriteria = command;
        console.log('Criterios de filtro:', filterCriteria);
        const projects = await collection.find(filterCriteria).toArray();
        console.log('Proyectos filtrados:', projects);
        res.status(200).json({ success: true, data: projects });
        break;
      default:
        console.log('Acción no válida en el comando:', response);
        res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error del servidor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Restaurar el método getProjects
export const getProjects = async (req, res) => {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo proyectos...');

    const projects = await db.collection('projects').aggregate([
      {
        $lookup: {
          from: 'stock',
          localField: '_id',
          foreignField: 'project_id',
          as: 'stock_items'
        }
      },
      {
        $addFields: {
          typologies: {
            $reduce: {
              input: '$stock_items.typology',
              initialValue: [],
              in: {
                $cond: {
                  if: { $in: ['$$this', '$$value'] },
                  then: '$$value',
                  else: { $concatArrays: ['$$value', ['$$this']] }
                }
              }
            }
          },
          min_price: { $min: '$stock_items.current_list_price' },
          max_price: { $max: '$stock_items.current_list_price' },
          hasStock: { $gt: [{ $size: '$stock_items' }, 0] } // Añade el indicador hasStock
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
          name: 1,
          address: 1,
          gallery: 1,
          county: {
            id: '$county._id',
            name: '$county.name'
          },
          real_estate_company: {
            id: '$real_estate_company._id',
            name: '$real_estate_company.name'
          },
          country_id: 1,
          location: 1,
          typologies: 1,
          min_price: 1,
          max_price: 1,
          updatedAt: 1,
          hasStock: 1 // Incluye el campo hasStock en el resultado final
        }
      },
      {
        $sort: { updatedAt: -1 } // Ordena por updatedAt de manera descendente
      }
    ]).toArray();

    // console.log('Proyectos obtenidos:', projects);
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjectDetails = async (req, res) => {
  try {
    const { idProject } = req.query;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo detalles del proyecto...');

    const project = await db.collection('projects').findOne({ _id: new ObjectId(idProject) });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('Error al obtener detalles del proyecto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


// Otros métodos CRUD se mantienen igual...
export const createProject = async (req, res) => {
  try {
    const newProject = new Project(req.body);
    const savedProject = await newProject.save();
    res.status(201).json({ success: true, data: savedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProject = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: deletedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const filterProjects = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.query;
    const filter = {};
    if (minPrice) filter.min_price = { $gte: minPrice };
    if (maxPrice) filter.max_price = { $lte: maxPrice };
    const projects = await Project.find(filter).populate('county_id country_id real_estate_company_id');
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
