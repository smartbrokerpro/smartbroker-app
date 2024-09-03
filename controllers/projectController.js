// controllers/projectController.js

import Project from '../models/projectModel';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import ExcelJS from 'exceljs';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export const getProjects = async (req, res) => {
  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log('Conectado a la base de datos, obteniendo proyectos...');

    const projects = await db.collection('projects').aggregate([
      { $match: { organization_id: new ObjectId(organizationId) } },
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
          hasStock: { $gt: [{ $size: '$stock_items' }, 0] },
          unitsCount: { $size: '$stock_items' } // Aquí agregamos la cantidad de unidades
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
          hasStock: 1,
          unitsCount: 1 // Incluimos el campo unitsCount en el resultado final
        }
      },
      {
        $sort: { updatedAt: -1 }
      }
    ]).toArray();

    // Verifica si unitsCount se agregó correctamente
    // projects.forEach(project => {
    //   if (typeof project.unitsCount === 'undefined') {
    //     project.unitsCount = 0;
    //   }
    // });

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjectDetails = async (req, res, organizationId) => {
  const { idProject } = req.query;

  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const project = await db.collection('projects').findOne({
      _id: new ObjectId(idProject),
      organization_id: new ObjectId(organizationId)
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const realEstateCompany = await db.collection('real_estate_companies').findOne({ _id: project.real_estate_company_id });

    const projectDetails = {
      ...project,
      realEstateCompanyName: realEstateCompany.name,
    };

    res.status(200).json({ success: true, data: projectDetails });
  } catch (error) {
    console.error('Error fetching project details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProject = async (req, res) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const projectData = {
      ...req.body,
      organization_id: new ObjectId(organizationId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Convertir los IDs a ObjectId
    if (projectData.region_id) projectData.region_id = new ObjectId(projectData.region_id);
    if (projectData.county_id) projectData.county_id = new ObjectId(projectData.county_id);
    if (projectData.real_estate_company_id) projectData.real_estate_company_id = new ObjectId(projectData.real_estate_company_id);

    // Asegurarse de que `location` se maneje correctamente
    if (typeof projectData.location === 'string') {
      const [lat, lng] = projectData.location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        projectData.location = { lat, lng };
      }
    }

    // Asegurarse de que `reservationInfo` esté correctamente estructurado
    if (projectData.reservationInfo) {
      projectData.reservationInfo = {
        text: projectData.reservationInfo.text || '',
        hyperlink: projectData.reservationInfo.hyperlink || ''
      };
    }

    // Insertar el nuevo proyecto
    const result = await db.collection('projects').insertOne(projectData);

    if (result.insertedId) {
      const newProject = await db.collection('projects').findOne({ _id: result.insertedId });
      res.status(201).json({ success: true, data: newProject });
    } else {
      throw new Error('Failed to insert project');
    }
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const updateProject = async (req, res) => {
  const { idProject } = req.query;
  const organizationId = req.headers['x-organization-id'];

  console.log('Updating project:', idProject);
  console.log('Organization ID:', organizationId);

  if (!organizationId) {
    return res.status(400).json({ success: false, error: 'organization_id is required' });
  }

  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  const updateData = {};
  const allowedFields = [
    'name',
    'address',
    'county_id',
    'country_id',
    'real_estate_company_id',
    'location',
    'region_id',
    'gallery',
    'commercialConditions',
    'deliveryType',
    'downPaymentMethod',
    'installments',
    'promiseSignatureType',
    'reservationInfo',
    'reservationValue'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (['county_id', 'country_id', 'real_estate_company_id', 'region_id'].includes(field)) {
        updateData[field] = new ObjectId(req.body[field]);
      } else if (field === 'location') {
        if (typeof req.body[field] === 'string') {
          const [lat, lng] = req.body[field].split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            updateData[field] = { lat, lng };
          }
        } else if (typeof req.body[field] === 'object') {
          updateData[field] = req.body[field];
        }
      } else if (field === 'reservationInfo') {
        updateData[field] = {
          text: req.body.reservationInfo.text || '',
          hyperlink: req.body.reservationInfo.hyperlink || ''
        };
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  updateData.updatedAt = new Date();

  let client;
  try {
    client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const projectsCollection = db.collection('projects');

    console.log('Attempting to update project with data:', updateData);

    const result = await projectsCollection.findOneAndUpdate(
      { 
        _id: new ObjectId(idProject), 
        organization_id: new ObjectId(organizationId) 
      },
      { $set: updateData },
      { returnDocument: 'after' } // Para devolver el documento actualizado
    );

    // Si result es null, significa que no se encontró el documento
    if (!result) {
      console.log('Project not found or not updated');
      return res.status(404).json({ success: false, message: 'Project not found or not updated' });
    }

    console.log('Project updated successfully:', result);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: error.toString(), stack: error.stack });
  }
};




export const deleteProject = async (req, res) => {
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const deletedProject = await Project.findOneAndDelete({ _id: id, organization_id: new ObjectId(organizationId) });
    if (!deletedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: deletedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bulkUploadProjects = async (req, res) => {
  try {
    console.log('Received file:', req.file);
    console.log('Received body:', req.body);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ success: false, error: 'Excel file is required' });
    }

    const organizationId = req.body.organizationId;
    const mapping = JSON.parse(req.body.mapping);

    if (!organizationId) {
      console.error('organizationId not found');
      return res.status(400).json({ success: false, error: 'organizationId is required' });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1);
    const rows = worksheet.getSheetValues();

    if (rows.length < 2) {
      return res.status(400).json({ success: false, error: 'Excel file is empty or has no data rows' });
    }

    const headers = rows[1];
    const projects = [];

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      const project = {
        organization_id: new ObjectId(organizationId),
        createdAt: new Date(),
        updatedAt: new Date(),
        location: { lat: -33.4489, lng: -70.6693 }, // Santiago de Chile
        gallery: [],
        commercialConditions: null,
        country_id: new ObjectId("666fa92e6f4aed0a83b1399c"), // ID de Chile
      };

      Object.entries(mapping).forEach(([excelHeader, dbField]) => {
        const columnIndex = headers.indexOf(excelHeader);
        if (columnIndex !== -1 && row[columnIndex] !== undefined) {
          if (dbField === 'delivery_date') {
            project[dbField] = new Date(row[columnIndex]);
          } else {
            project[dbField] = row[columnIndex] || null;
          }
        }
      });

      if (project.county) {
        const county = await db.collection('counties').findOne({ 
          name: { $regex: new RegExp(`^${project.county}$`, 'i') } 
        });
        if (county) {
          project.county_id = county._id;
          project.region_id = county.region_id;
        }
        delete project.county;
      }

      if (project.real_estate_company) {
        let realEstateCompany = await db.collection('real_estate_companies').findOne({ 
          name: { $regex: new RegExp(`^${project.real_estate_company}$`, 'i') } 
        });
        if (!realEstateCompany) {
          const newRealEstateCompany = {
            name: project.real_estate_company,
            address: null,
            contact_person: null,
            created_at: new Date(),
            description: null,
            email: null,
            phone: null,
            updated_at: new Date(),
            website: null
          };
          const result = await db.collection('real_estate_companies').insertOne(newRealEstateCompany);
          project.real_estate_company_id = result.insertedId;
        } else {
          project.real_estate_company_id = realEstateCompany._id;
        }
        delete project.real_estate_company;
      }

      ['real_estate_company_id', 'county_id', 'region_id'].forEach(field => {
        if (project[field]) project[field] = new ObjectId(project[field]);
      });

      projects.push(project);
    }

    console.log('Projects to insert:', projects);

    if (projects.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid projects to insert' });
    }

    const result = await db.collection('projects').insertMany(projects);
    return res.status(201).json({ success: true, insertedCount: result.insertedCount });
  } catch (error) {
    console.error('Error during bulk upload:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};