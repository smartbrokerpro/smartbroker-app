import Stock from '@/models/stockModel';
import OpenAI from 'openai';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logPrompt } from '@/utils/logPrompt';
import ExcelJS from 'exceljs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stockModel = {
  "stock": {
    "_id": "ObjectId",
    "project_id": "ObjectId",
    "organization_id": "ObjectId",
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

Por favor, devuelve solo el comando MongoDB necesario en formato JSON puro y minificado para la operación solicitada en el siguiente texto. No incluyas ninguna explicación adicional. Asegúrate de incluir la acción a realizar ("create", "update", "delete", "filter") como parte de la respuesta JSON. Todas las peticiones deben incluir obligatoriamente los parámetros "apartment" y "project_id", donde "project_id" es ObjectId.

MUY IMPORTANTE: SIEMPRE INCORPORA EL "project_id": "${projectId}"

Ejemplos de posibles entradas:
1. "Crear una nueva unidad de stock con el apartamento '204'."
   Respuesta esperada: {"action": "create", "command": { "apartment": "204", "project_id": { "$oid": "${projectId}" } }}
2. "Cambia el valor de la unidad 306 a 3000 UF"
   Respuesta esperada: {"action": "update", "command": { "q": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }, "u": { "$set": { "current_list_price": 3000 } } }}
3. "Eliminar la unidad de stock con el apartamento '306'."
   Respuesta esperada: {"action": "delete", "command": { "apartment": "306", "project_id": { "$oid": "${projectId}" } }}
4. "Filtrar las unidades de stock que tengan valores de unidad entre 2000 y 4000 UF."
   Respuesta esperada: {"action": "filter", "command": { "project_id": { "$oid": "${projectId}" }, "current_list_price": { "$gte": 2000, "$lte": 4000 } }}

Entrada del usuario:
${prompt}
`;
};

export const handleGPTRequest = async (req, res) => {
  const { prompt, project_id, organizationId, userId, userEmail } = req.body;

  if (!prompt || !project_id || !organizationId) {
    console.log('Se requiere un prompt, project_id y organization_id');
    return res.status(400).json({ error: 'Se requiere un prompt, project_id y organization_id' });
  }

  const context = generateContext(prompt, project_id);
  console.log('Contexto generado para GPT-3.5-turbo:', context);

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Verificar asociación de proyecto y organización
    const project = await db.collection('projects').findOne({ _id: new ObjectId(project_id), organization_id: new ObjectId(organizationId) });
    if (!project) {
      console.log('Proyecto no encontrado para el organization_id proporcionado');
      return res.status(400).json({ error: 'Proyecto no encontrado para el organization_id proporcionado' });
    }
    console.log('Proyecto verificado con organization_id:', organizationId);

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: `Texto: ${prompt}` }
      ],
      max_tokens: 150,
      temperature: 0.1 // Temperatura baja para reducir la creatividad
    });

    const message = gptResponse.choices[0].message.content.trim();
    console.log('Respuesta de GPT-3.5-turbo:', message);

    let response;
    try {
      response = JSON.parse(message.replace(/\n/g, ''));
      console.log('Respuesta JSON parseada:', response);
    } catch (e) {
      console.log('Error al parsear JSON:', e);
      return res.status(400).json({ error: 'Formato JSON inválido desde GPT-3.5-turbo', gptResponse: message });
    }

    const { action, command } = response;

    if (!action || !command) {
      console.log('Acción o comando no reconocidos en la respuesta:', response);
      return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-3.5-turbo', gptResponse: message });
    }

    const collection = db.collection('stock');

    // Obtener la organización y actualizar los créditos
    const organization = await db.collection('organizations').findOne({ _id: new ObjectId(organizationId) });
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const tokensUsed = gptResponse.usage.total_tokens;
    const creditsUsed = Math.ceil(tokensUsed / 1000);

    if (organization.credits.current < creditsUsed) {
      return res.status(403).json({ error: 'Insufficient credits' });
    }

    await db.collection('organizations').updateOne(
      { _id: new ObjectId(organizationId) },
      { $inc: { 'credits.current': -creditsUsed } }
    );

    await logPrompt(userId, userEmail, organization, creditsUsed, tokensUsed, true, prompt, 'gpt-3.5-turbo');

    switch (action) {
      case 'create':
        console.log('Procesando una creación');
        const newStock = await collection.insertOne({ ...command, project_id: new ObjectId(project_id), organization_id: new ObjectId(organizationId), updatedAt: new Date() });
        console.log('Unidad de stock creada:', newStock);
        res.status(201).json({ success: true, data: newStock.ops ? newStock.ops[0] : { _id: newStock.insertedId, ...command }, credits: organization.credits.current - creditsUsed });
        break;
      case 'update':
        console.log('Procesando una actualización');
        const { q, u } = command;

        if (!q || !u || !q.apartment || !u.$set) {
          console.log('Formato de respuesta incompleto desde GPT-3.5-turbo:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-3.5-turbo', gptResponse: message });
        }

        //Verificar la existencia del stock
        console.log('find one to update', { apartment: q.apartment, project_id: new ObjectId(project_id) })
        const stockToUpdate = await collection.findOne({ apartment: q.apartment, project_id: new ObjectId(project_id) });
        console.log('Stock encontrado para actualizar:', stockToUpdate);
        if (!stockToUpdate) {
          console.log('Stock no encontrado para la actualización');
          return res.status(404).json({ error: 'Stock no encontrado para la actualización' });
        }

        // console.log('ID del stock a actualizar:', stockToUpdate._id);
        const updatedStock = await collection.findOneAndUpdate(
          { _id: stockToUpdate._id },
          { $set: { ...u.$set, updatedAt: new Date() } },
          { returnOriginal: false, returnDocument: 'after' } // Asegurarse de que se devuelva el documento actualizado
        );

        console.log('Respuesta de findOneAndUpdate:', updatedStock);

        if (updatedStock) {
          console.log('Stock actualizado:', updatedStock);
          res.status(200).json({ success: true, data: updatedStock, credits: organization.credits.current - creditsUsed });
        } else {
          console.log('Stock no encontrado para la actualización después del intento');
          res.status(404).json({ error: 'Stock no encontrado para la actualización' });
        }
        break;
      case 'delete':
        console.log('Procesando una eliminación');
        const deleteCmd = command;

        if (!deleteCmd.apartment || !deleteCmd.project_id) {
          console.log('Formato de respuesta incompleto desde GPT-3.5-turbo:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-3.5-turbo', gptResponse: message });
        }

        const deletedStock = await collection.findOneAndDelete({ apartment: deleteCmd.apartment, project_id: new ObjectId(project_id), organization_id: new ObjectId(organizationId) });

        console.log("Respuesta de deletedStock:", Boolean(deletedStock), deletedStock);
        if (deletedStock.value) {
          console.log('Unidad de stock eliminada:', deletedStock.value);
          res.status(200).json({ success: true, data: deletedStock.value, credits: organization.credits.current - creditsUsed });
        } else {
          console.log('Unidad de stock no encontrada para la eliminación');
          res.status(404).json({ error: 'Unidad de stock no encontrada para la eliminación' });
        }
        break;
      case 'filter':
        console.log('Procesando un filtro');
        const filterCriteria = command;

        if (!filterCriteria.project_id) {
          console.log('Formato de respuesta incompleto desde GPT-3.5-turbo:', response);
          return res.status(400).json({ error: 'Formato de respuesta incompleto desde GPT-3.5-turbo', gptResponse: message });
        }

        filterCriteria.project_id = new ObjectId(filterCriteria.project_id.$oid);

        const stocks = await collection.find(filterCriteria).toArray();
        console.log('Unidades de stock filtradas:', stocks);
        return res.status(200).json({ success: true, data: stocks, credits: organization.credits.current - creditsUsed });
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
  const { idProject, organizationId } = req.query;
  if (!ObjectId.isValid(idProject) || !ObjectId.isValid(organizationId)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID or organization ID' });
  }
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo stock...');

    const stock = await db.collection('stock').aggregate([
      {
        $match: {
          project_id: new ObjectId(idProject),
          organization_id: new ObjectId(organizationId)
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
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const newStock = new Stock({ ...req.body, organization_id: new ObjectId(organizationId) });
    const savedStock = await newStock.save();
    res.status(201).json({ success: true, data: savedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateStock = async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const updatedStock = await Stock.findOneAndUpdate(
      { _id: id, organization_id: new ObjectId(organizationId) },
      req.body,
      { new: true }
    );
    if (!updatedStock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }
    res.status(200).json({ success: true, data: updatedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStock = async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const deletedStock = await Stock.findOneAndDelete({ _id: id, organization_id: new ObjectId(organizationId) });
    if (!deletedStock) {
      return res.status(404).json({ success: false, message: 'Stock not found' });
    }
    res.status(200).json({ success: true, data: deletedStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const bulkUploadStock = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Iniciando carga masiva de stock');
    const { organizationId } = req.body;
    const mapping = JSON.parse(req.body.mapping);

    console.log('Mapping recibido:', mapping);

    if (!organizationId) {
      console.log('Error: organizationId no proporcionado');
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    if (!mapping || Object.keys(mapping).length === 0) {
      console.log('Error: Mapeo inválido o vacío');
      return res.status(400).json({ success: false, error: 'Invalid or empty mapping' });
    }

    console.log('Conectando a la base de datos...');
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Cargando archivo Excel...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    console.log(`Número total de filas en el Excel: ${worksheet.rowCount}`);
    console.log(`Número total de columnas en el Excel: ${worksheet.columnCount}`);
    
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values.filter(Boolean);
    console.log('Nombres de las columnas en el Excel:', headers);

    const getCellValue = (row, fieldName) => {
      const columnName = Object.keys(mapping).find(key => mapping[key] === fieldName);
      if (!columnName) {
        console.log(`Campo no mapeado: ${fieldName}`);
        return null;
      }
      const columnIndex = headers.indexOf(columnName);
      if (columnIndex === -1) {
        console.log(`Columna no encontrada: ${columnName}`);
        return null;
      }
      const cell = row.getCell(columnIndex + 1);
      return cell && cell.value !== undefined ? cell.value : null;
    };

    const stockItems = [];
    let validRowsCount = 0;
    let errorCount = 0;

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      if (errorCount > 10) {
        console.log('Demasiados errores consecutivos, deteniendo el procesamiento.');
        break;
      }

      console.log(`Procesando fila ${rowNumber}`);
      const row = worksheet.getRow(rowNumber);
      
      if (!row.hasValues) {
        console.log(`Fila ${rowNumber} está vacía, saltando...`);
        errorCount++;
        continue;
      }

      const projectName = getCellValue(row, 'project_name');
      if (!projectName) {
        console.log(`Fila ${rowNumber}: Nombre del proyecto vacío, saltando...`);
        errorCount++;
        continue;
      }

      errorCount = 0;

      console.log(`Buscando proyecto: ${projectName}`);
      const project = await db.collection('projects').findOne({ 
        name: projectName,
        organization_id: new ObjectId(organizationId)
      });
      
      if (!project) {
        console.log(`Fila ${rowNumber}: Proyecto no encontrado: ${projectName}, saltando...`);
        continue;
      }

      const stockItem = {
        project_id: project._id,
        organization_id: new ObjectId(organizationId),
        apartment: getCellValue(row, 'apartment'),
        role: getCellValue(row, 'role'),
        model: getCellValue(row, 'model'),
        typology: getCellValue(row, 'typology'),
        program: getCellValue(row, 'program'),
        orientation: getCellValue(row, 'orientation'),
        interior_surface: parseFloat(getCellValue(row, 'interior_surface')) || 0,
        terrace_surface: parseFloat(getCellValue(row, 'terrace_surface')) || 0,
        total_surface: parseFloat(getCellValue(row, 'total_surface')) || 0,
        current_list_price: parseInt(getCellValue(row, 'current_list_price')) || 0,
        down_payment_bonus: parseInt(getCellValue(row, 'down_payment_bonus')) || 0,
        discount: parseInt(getCellValue(row, 'discount')) || 0,
        rent: parseInt(getCellValue(row, 'rent')) || 0,
        available: 1,
        created_at: new Date(),
        updatedAt: new Date()
      };

      const realEstateCompanyName = getCellValue(row, 'real_estate_company');
      if (realEstateCompanyName) {
        let realEstateCompany = await db.collection('real_estate_companies').findOne({ name: realEstateCompanyName });
        if (!realEstateCompany) {
          const result = await db.collection('real_estate_companies').insertOne({ 
            name: realEstateCompanyName,
            organization_id: new ObjectId(organizationId)
          });
          realEstateCompany = { _id: result.insertedId, name: realEstateCompanyName };
        }
        stockItem.real_estate_company_id = realEstateCompany._id;
        stockItem.real_estate_company_name = realEstateCompanyName;
      }

      const countyName = getCellValue(row, 'county');
      if (countyName) {
        const county = await db.collection('counties').findOne({ name: countyName });
        if (county) {
          stockItem.county_id = county._id;
          stockItem.county_name = countyName;
          stockItem.region_name = county.region_name;
        } else {
          console.log(`Fila ${rowNumber}: Comuna no encontrada: ${countyName}`);
        }
      }

      Object.keys(stockItem).forEach(key => stockItem[key] === null && delete stockItem[key]);

      console.log(`Stock item creado: ${JSON.stringify(stockItem)}`);
      stockItems.push(stockItem);

      validRowsCount++;
      
      // if (validRowsCount >= 100) {
      //   console.log('Alcanzado el límite de 100 filas válidas, deteniendo el procesamiento.');
      //   break;
      // }
    }

    if (validRowsCount === 0) {
      console.log('No se encontraron datos válidos para cargar');
      return res.status(400).json({ success: false, error: 'No se encontraron datos válidos para cargar' });
    }

    console.log(`Insertando ${validRowsCount} elementos de stock...`);
    const result = await db.collection('stock').insertMany(stockItems);

    console.log(`Carga masiva completada. Elementos insertados: ${result.insertedCount}`);
    res.status(200).json({ success: true, insertedCount: result.insertedCount });
  } catch (error) {
    console.error('Error en la carga masiva de stock:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};