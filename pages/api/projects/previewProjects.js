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
      const previewData = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          headers = row.values.slice(1); 
          return;
        }

        if (rowNumber > 4) return; 

        const updateFields = {};

        row.eachCell((cell, colNumber) => {
          const fieldName = headers[colNumber - 1]; 
          if (fieldName) {
            updateFields[fieldName] = cell.value;
          }
        });

        if (updateFields['_id']) {
          updateFields['_id'] = new ObjectId(updateFields['_id']);
        }

        updateFields['updatedAt'] = new Date();

        previewData.push(updateFields);
      });

      res.status(200).json({ preview: previewData });
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}
