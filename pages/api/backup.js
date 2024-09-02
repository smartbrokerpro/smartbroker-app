import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';
import ExcelJS from 'exceljs';
import Project from '@/models/projectModel';
import Stock from '@/models/stockModel';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { collection, organizationId, format } = req.query;

    if (!collection || !organizationId || !format) {
      return res.status(400).json({ error: 'Collection type, organizationId, and format are required' });
    }

    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const data = await db
        .collection(collection)
        .find({ organization_id: new ObjectId(organizationId) })
        .toArray();

      const modelFields = collection === 'projects'
        ? Object.keys(Project.schema.paths)
        : Object.keys(Stock.schema.paths);

      if (format === 'json') {
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.json`);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(data);
      } else if (format === 'csv') {
        const csv = convertToCSV(data, modelFields);
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.csv`);
        res.setHeader('Content-Type', 'text/csv');
        return res.status(200).send(csv);
      } else if (format === 'xlsx') {
        const workbook = createXLSX(data, modelFields, collection);
        res.setHeader('Content-Disposition', `attachment; filename=${collection}-backup.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        await workbook.xlsx.write(res);
        res.end();
      } else {
        return res.status(400).json({ error: 'Invalid format' });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function convertToCSV(data, modelFields) {
  const csvRows = [];
  csvRows.push(modelFields.join(','));

  data.forEach((item) => {
    const values = modelFields.map((field) => item[field] === null || item[field] === undefined ? '' : item[field]);
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

function createXLSX(data, modelFields, sheetName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.addRow(modelFields);

  data.forEach((item) => {
    const rowValues = modelFields.map((field) => item[field] !== undefined ? item[field] : null);
    worksheet.addRow(rowValues);
  });

  return workbook;
}
