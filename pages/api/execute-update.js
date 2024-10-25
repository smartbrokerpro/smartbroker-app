import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', 
    },
  },
};

function ensureObjectId(id) {
  return id instanceof ObjectId ? id : new ObjectId(id);
}

function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

function normalizeString(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const missingCounties = [];

async function loadAllCountiesAndRegions(db) {
  const counties = await db.collection('counties').find().toArray();
  const regions = await db.collection('regions').find().toArray();
  
  const countyMap = new Map();
  counties.forEach(county => {
    const normalizedCountyName = normalizeString(county.name);
    const region = regions.find(r => r._id.equals(county.region_id));
    countyMap.set(normalizedCountyName, {
      countyId: county._id,
      countyName: county.name,
      regionId: region ? region._id : null,
      regionName: region ? region.region : null,
    });
  });
  return countyMap;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { 
      projectsToCreate = [],
      projectsToUpdate = [],
      unitsToCreate = [],
      unitsToUpdate = [],
      unitsToMarkUnavailable = [],
      organizationId,
      realEstateCompanyName
    } = req.body;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const countyMap = await loadAllCountiesAndRegions(db);

    const result = {
      projectsCreated: 0,
      projectsUpdated: 0,
      unitsCreated: 0,
      unitsUpdated: 0,
      unitsMarkedUnavailable: 0,
      missingCounties: []
    };

    // Crear proyectos y mantener un mapeo de nombres a IDs
    const projectNameToIdMap = new Map();
    if (projectsToCreate.length > 0) {
      const projectsToInsert = projectsToCreate.map(project => {
        const {
          countyId,
          countyName,
          regionId,
          regionName
        } = countyMap.get(normalizeString(project.county_name)) || {};

        if (!countyId) {
          missingCounties.push({ countyName: project.county_name, projectName: project.name });
        }

        return {
          ...project,
          _id: new ObjectId(),
          organization_id: ensureObjectId(organizationId),
          real_estate_company_id: ensureObjectId(project.real_estate_company_id),
          real_estate_company_name: realEstateCompanyName,
          county_id: countyId,
          county_name: countyName,
          region_id: regionId,
          region_name: regionName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      const createProjectsResult = await db.collection('projects').insertMany(projectsToInsert);
      result.projectsCreated = createProjectsResult.insertedCount;

      projectsToInsert.forEach(project => {
        projectNameToIdMap.set(project.name, project._id);
      });
    }

    // Actualizar proyectos
    if (projectsToUpdate.length > 0) {
      const bulkUpdateProjects = projectsToUpdate.map(project => {
        const projectData = omit(project, ['_id', 'organization_id']);
        return {
          updateOne: {
            filter: { _id: ensureObjectId(project._id), organization_id: ensureObjectId(organizationId) },
            update: {
              $set: {
                ...projectData,
                real_estate_company_id: ensureObjectId(projectData.real_estate_company_id),
                real_estate_company_name: realEstateCompanyName,
                updatedAt: new Date()
              }
            }
          }
        };
      });
      const updateProjectsResult = await db.collection('projects').bulkWrite(bulkUpdateProjects);
      result.projectsUpdated = updateProjectsResult.modifiedCount;
    }

    // Actualizar unidades con los IDs de proyecto correctos y crear unidades
    if (unitsToCreate.length > 0) {
      const updatedUnitsToCreate = unitsToCreate.map(unit => {
        const projectId = projectNameToIdMap.get(unit.project_name) || ensureObjectId(unit.project_id);

        const {
          countyId,
          countyName,
          regionId,
          regionName
        } = countyMap.get(normalizeString(unit.county_name)) || {};

        if (!countyId) {
          missingCounties.push({ countyName: unit.county_name, projectName: unit.project_name });
        }

        return {
          ...unit,
          _id: new ObjectId(),
          project_id: projectId,
          organization_id: ensureObjectId(organizationId),
          real_estate_company_id: ensureObjectId(unit.real_estate_company_id),
          real_estate_company_name: realEstateCompanyName,
          county_id: countyId,
          county_name: countyName,
          region_id: regionId,
          region_name: regionName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      const createUnitsResult = await db.collection('stock').insertMany(updatedUnitsToCreate);
      result.unitsCreated = createUnitsResult.insertedCount;
    }

    // Marcar unidades como no disponibles
    if (unitsToMarkUnavailable.length > 0) {
      const bulkMarkUnavailable = unitsToMarkUnavailable.map(unit => ({
        updateOne: {
          filter: { _id: ensureObjectId(unit._id), organization_id: ensureObjectId(organizationId) },
          update: {
            $set: {
              available: 0,
              updatedAt: new Date()
            }
          }
        }
      }));
      const markUnavailableResult = await db.collection('stock').bulkWrite(bulkMarkUnavailable);
      result.unitsMarkedUnavailable = markUnavailableResult.modifiedCount;
    }

    result.missingCounties = missingCounties;

    res.status(200).json({ 
      message: 'Database update completed successfully', 
      result 
    });
  } catch (error) {
    console.error('Error executing database update:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

export default handler;
