import { ObjectId } from 'mongodb';
import ExcelJS from 'exceljs';
import clientPromise from '@/lib/mongodb';
import Project from '@/models/projectModel';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const IMMUTABLE_FIELDS = ['_id', 'real_estate_company_id', 'organization_id', 'createdAt', 'county_id', 'region_id'];
const DATE_FIELDS = ['updatedAt', 'delivery_date'];
const STRING_FIELDS = ['address', 'deliveryDateDescr'];

function normalizeId(value) {
  if (typeof value === 'string') {
    return value.replace(/^["']|["']$/g, '').trim();
  }
  return value;
}

function areValuesEqual(value1, value2, field) {
  if ((value1 == null || value1 === '') && (value2 == null || value2 === '')) {
    return true;
  }
  
  if (field.endsWith('_id')) {
    value1 = normalizeId(value1);
    value2 = normalizeId(value2);
  }

  if (DATE_FIELDS.includes(field)) {
    const date1 = value1 ? new Date(value1) : null;
    const date2 = value2 ? new Date(value2) : null;
    if (date1 && date2) {
      return Math.abs(date1.getTime() - date2.getTime()) < 60000; // 1 minute tolerance
    }
    return date1 === date2;
  }

  if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
      if (!areValuesEqual(value1[key], value2[key], `${field}.${key}`)) return false;
    }
    return true;
  }

  return value1 === value2;
}

function parseExcelValue(value, field) {
  if (value == null) return null;
  
  if (DATE_FIELDS.includes(field) && value instanceof Date) {
    return value.toISOString();
  }
  if (STRING_FIELDS.includes(field)) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // Return only the date part
    }
    return value.toString();
  }
  return value;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const logs = ['Starting analysis process'];

  try {
    const { file, organizationId } = req.body;

    if (!file || !organizationId) {
      return res.status(400).json({ message: 'File and Organization ID are required.' });
    }

    logs.push('File and Organization ID received');

    const buffer = Buffer.from(file, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    logs.push('Excel file loaded successfully');

    const headers = worksheet.getRow(1).values.slice(1).map(header => header?.toLowerCase().trim());
    const projectFields = Object.keys(Project.schema.paths).filter(field => !field.startsWith('_'));

    const fieldMapping = headers.reduce((acc, header, index) => {
      if (header) {
        const matchingField = projectFields.find(field => field.toLowerCase() === header);
        if (matchingField) {
          acc[matchingField] = index + 1;
        }
      }
      return acc;
    }, {});

    if (!fieldMapping.name) {
      logs.push('Error: "name" column not found in the file');
      return res.status(400).json({ message: 'The file must contain a "name" column.', logs });
    }

    logs.push('Field mapping created successfully');

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const existingProjects = await db.collection('projects').find({ organization_id: new ObjectId(organizationId) }).toArray();
    const existingProjectMap = new Map(existingProjects.map(proj => [proj.name.toLowerCase().trim(), proj]));

    logs.push(`Fetched ${existingProjects.length} existing projects from database`);

    const projectsToCreate = [];
    const projectsToUpdate = [];
    const errors = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      const projectData = {};
      projectFields.forEach(field => {
        if (fieldMapping[field] && !IMMUTABLE_FIELDS.includes(field)) {
          let value = row.getCell(fieldMapping[field]).value;
          projectData[field] = parseExcelValue(value, field);
        }
      });

      const projectName = projectData.name || `Unnamed Project ${rowNumber}`;
      const projectNameKey = projectName.toLowerCase().trim();

      const existingProject = existingProjectMap.get(projectNameKey);

      if (!existingProject) {
        const newProject = {
          ...projectData,
          organization_id: new ObjectId(organizationId),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        projectsToCreate.push(newProject);
        // logs.push(`New project to create: ${projectName}`);
      } else {
        const updates = {};
        // logs.push(`Comparing project: ${projectName}`);
        for (const [key, value] of Object.entries(projectData)) {
          if (!IMMUTABLE_FIELDS.includes(key)) {
            const existingValue = existingProject[key];
            const areEqual = areValuesEqual(value, existingValue, key);
            // logs.push(`  Field: ${key}`);
            // logs.push(`    Excel value: ${JSON.stringify(value)}`);
            // logs.push(`    DB value: ${JSON.stringify(existingValue)}`);
            // logs.push(`    Are equal: ${areEqual}`);
            if (!areEqual) {
              updates[key] = value;
            }
          }
        }
        if (Object.keys(updates).length > 0) {
          projectsToUpdate.push({
            _id: existingProject._id,
            name: existingProject.name,
            ...updates,
            updatedAt: new Date(),
          });
        //   logs.push(`  Project needs update: ${Object.keys(updates).join(', ')}`);
        } else {
        //   logs.push(`  No changes detected for this project`);
        }
      }
    });

    logs.push('Analysis process completed');
    logs.push(`Projects to create: ${projectsToCreate.length}`);
    logs.push(`Projects to update: ${projectsToUpdate.length}`);
    logs.push(`Errors encountered: ${errors.length}`);

    if (projectsToCreate.length === 0 && projectsToUpdate.length === 0 && errors.length === 0) {
      return res.status(200).json({
        message: 'No changes detected. All projects are up to date.',
        projectsToCreate: [],
        projectsToUpdate: [],
        errors: [],
        logs,
      });
    }

    const summary = {
        dbOperations: {
          insert: projectsToCreate.map(p => ({
            document: {
              ...p,
              _id: p._id ? new ObjectId(p._id) : new ObjectId(),
              organization_id: new ObjectId(organizationId),
            }
          })),
          update: projectsToUpdate.map(p => ({
            filter: { _id: new ObjectId(p._id) },
            update: { 
              $set: Object.fromEntries(
                Object.entries(p).filter(([key]) => 
                  key !== '_id' && key !== 'name' && 
                  !areValuesEqual(p[key], existingProjectMap.get(p.name.toLowerCase().trim())?.[key], key)
                )
              )
            }
          }))
        },
        projectsToCreate: projectsToCreate.map(p => ({
          [p._id ? p._id.toString() : 'new']: {
            name: p.name,
            ...Object.fromEntries(
              Object.entries(p).filter(([key]) => key !== '_id' && key !== 'updatedAt' && key !== 'name')
            )
          }
        })),
        projectsToUpdate: projectsToUpdate.map(p => ({
          [p._id ? p._id.toString() : 'unknown']: {
            name: p.name,
            ...Object.fromEntries(
              Object.entries(p).filter(([key]) => 
                key !== '_id' && key !== 'updatedAt' && key !== 'name' && 
                !areValuesEqual(p[key], existingProjectMap.get(p.name.toLowerCase().trim())?.[key], key)
              )
            )
          }
        })),
        errors,
        logs,
      };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error analyzing file:', error);
    logs.push(`Error occurred: ${error.message}`);
    res.status(500).json({ message: 'Internal Server Error', error: error.message, logs });
  }
}