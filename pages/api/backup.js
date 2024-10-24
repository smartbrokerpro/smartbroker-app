import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import ExcelJS from 'exceljs';
import Project from '@/models/projectModel';
import Stock from '@/models/stockModel';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { collection, organizationId, format } = req.query;

  // Validate required parameters
  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Special handling for models export
    if (collection === 'models') {
      await handleModelsExport(db, organizationId, res);
      return;
    }

    // Regular collection export
    if (!collection || !format) {
      return res.status(400).json({ error: 'Collection type and format are required' });
    }

    const data = await db
      .collection(collection)
      .find({ organization_id: new ObjectId(organizationId) })
      .toArray();

    const modelFields = collection === 'projects'
      ? Object.keys(Project.schema.paths)
      : Object.keys(Stock.schema.paths);

    // Handle different export formats
    switch (format) {
      case 'json':
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.json`);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(data);

      case 'csv':
        const csv = convertToCSV(data, modelFields);
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);

      case 'xlsx':
        const workbook = createXLSX(data, modelFields, collection);
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await workbook.xlsx.write(res);
        return res.end();

      default:
        return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    console.error('Error in backup handler:', error);
    return res.status(500).json({ error: 'Failed to fetch data' });
  }
}

async function handleModelsExport(db, organizationId, res) {
  try {
    // Fetch all stock items for the organization
    const stockItems = await db
      .collection('stock')
      .find({ 
        organization_id: new ObjectId(organizationId),
        available: 1
      })
      .toArray();

    // Create a map to count unique combinations
    const modelMap = new Map();

    stockItems.forEach(item => {
      const key = `${item.project_name}|${item.typology}|${item.model || 'Sin modelo'}`;
      if (!modelMap.has(key)) {
        modelMap.set(key, {
          proyecto: item.project_name,
          tipologia: item.typology,
          modelo: item.model || 'Sin modelo',
          cantidad: 1
        });
      } else {
        modelMap.get(key).cantidad += 1;
      }
    });

    // Convert map to array and sort
    const modelsList = Array.from(modelMap.values()).sort((a, b) => {
      const projectCompare = a.proyecto.localeCompare(b.proyecto);
      if (projectCompare !== 0) return projectCompare;
      return a.tipologia.localeCompare(b.tipologia);
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Modelos');

    // Define columns
    worksheet.columns = [
      { header: 'Proyecto', key: 'proyecto', width: 30 },
      { header: 'Tipología', key: 'tipologia', width: 15 },
      { header: 'Modelo', key: 'modelo', width: 20 },
      { header: 'Cantidad Disponible', key: 'cantidad', width: 20 }
    ];

    // Add header row styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    modelsList.forEach(model => {
      worksheet.addRow(model);
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=modelos-stock.xlsx'
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error in handleModelsExport:', error);
    res.status(500).json({ error: 'Failed to generate models export' });
  }
}

function convertToCSV(data, modelFields) {
  const csvRows = [];
  csvRows.push(modelFields.join(','));

  data.forEach((item) => {
    const values = modelFields.map((field) => 
      item[field] === null || item[field] === undefined ? '' : item[field]
    );
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

function createXLSX(data, modelFields, sheetName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers
  worksheet.addRow(modelFields);

  // Add data
  data.forEach((item) => {
    const rowValues = modelFields.map((field) => 
      item[field] !== undefined ? item[field] : null
    );
    worksheet.addRow(rowValues);
  });

  return workbook;
}