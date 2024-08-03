// controllers/projectController.js

import Project from '../models/projectModel';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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

    const project = await db.collection('projects').findOne({ _id: new ObjectId(idProject), organization_id: new ObjectId(organizationId) });

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
  const { id } = req.params;
  const { organizationId } = req.body;

  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required' });
  }

  try {
    const updatedProject = await Project.findOneAndUpdate(
      { _id: id, organization_id: new ObjectId(organizationId) },
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
