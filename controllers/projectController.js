// controllers/projectController.js

import Project from '../models/projectModel';
import { MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

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
    const newProject = new Project({ ...req.body, organization_id: new ObjectId(organizationId) });
    const savedProject = await newProject.save();
    res.status(201).json({ success: true, data: savedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProject = async (req, res) => {
  const { idProject } = req.query;
  const organizationId = req.headers['x-organization-id'];

  console.log('Updating project:', idProject);
  console.log('Organization ID:', organizationId);

  if (!organizationId) {
    return res.status(400).json({ success: false, error: 'organizationId is required' });
  }

  if (!ObjectId.isValid(idProject)) {
    return res.status(400).json({ success: false, error: 'Invalid project ID' });
  }

  // Crear un objeto de actualización basado en los campos permitidos
  const updateData = {};
  const allowedFields = ['name', 'address', 'county_id', 'country_id', 'real_estate_company_id', 'location', 'region_id', 'gallery', 'commercialConditions'];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (['county_id', 'country_id', 'real_estate_company_id', 'region_id'].includes(field)) {
        updateData[field] = new ObjectId(req.body[field]);
      } else if (field === 'location') {
        // Verificar si location es una cadena o un objeto
        if (typeof req.body[field] === 'string') {
          const [lat, lng] = req.body[field].split(',').map(Number);
          if (!isNaN(lat) && !isNaN(lng)) {
            updateData[field] = { lat, lng };
          }
        } else if (typeof req.body[field] === 'object') {
          updateData[field] = req.body[field];
        }
      } else {
        updateData[field] = req.body[field];
      }
    }
  });

  // Siempre actualizar el campo updatedAt
  updateData.updatedAt = new Date();

  let client;
  try {
    client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const projectsCollection = db.collection('projects');
    const stockCollection = db.collection('stock');

    console.log('Attempting to update project with data:', updateData);

    const result = await projectsCollection.findOneAndUpdate(
      { 
        _id: new ObjectId(idProject), 
        organization_id: new ObjectId(organizationId) 
      },
      { $set: updateData },
      { 
        returnDocument: 'after'
      }
    );

    if (!result) {
      console.log('Project not found or not updated');
      return res.status(404).json({ success: false, message: 'Project not found or not updated' });
    }

    // Actualizar las unidades de stock relacionadas
    const stockUpdateData = {
      real_estate_company_name: req.body.real_estate_company_name,
      county_name: req.body.county_name,
      region_name: req.body.region_name
    };

    await stockCollection.updateMany(
      { project_id: new ObjectId(idProject) },
      { $set: stockUpdateData }
    );

    console.log('Project and related stock units updated successfully');
    res.status(200).json({ success: true, data: result.value });
  } catch (error) {
    console.error('Error updating project and stock:', error);
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
