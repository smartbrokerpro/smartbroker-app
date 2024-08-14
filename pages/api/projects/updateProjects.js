// pages/api/projects/updateProjects.js
import clientPromise from '@/lib/mongodb';
import ExcelJS from 'exceljs';
import formidable from 'formidable';
import fs from 'fs';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false, // Desactivar el body parser para manejar FormData manualmente
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const form = formidable({ multiples: false }); // Configurar formidable

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ message: 'Error parsing form data' });
    }

    // Acceder al primer archivo en el array de archivos
    const file = files.file[0];

    if (!file) {
      console.error('File is undefined');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = file.filepath || file.path;
    console.log('File Path:', filePath);

    if (!filePath) {
      console.error('File path is undefined');
      return res.status(400).json({ message: 'File path is undefined' });
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);

      const worksheet = workbook.getWorksheet(1);
      let headers = [];

      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) {
          headers = row.values.slice(1); 
          return;
        }

        const updateFields = {};

        row.eachCell((cell, colNumber) => {
          const fieldName = headers[colNumber - 1]; 
          if (fieldName) {
            updateFields[fieldName] = cell.value;
          }
        });

        // Convertir a ObjectId si el campo es _id
        if (updateFields['_id']) {
          updateFields['_id'] = new ObjectId(updateFields['_id']);
        }

        updateFields['updatedAt'] = new Date();

        await db.collection('projects').updateOne(
          { "_id": updateFields['_id'] },
          { $set: updateFields },
          { upsert: true } // Si no existe el documento, lo crea
        );
      });

      res.status(200).json({ message: 'Projects updated successfully' });
    } catch (error) {
      console.error('Error updating projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
