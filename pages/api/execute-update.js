//execute-update.js

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

function ensureObjectId(id) {
  return id instanceof ObjectId ? id : new ObjectId(id);
}

function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { 
      projectsToCreate,
      projectsToUpdate,
      unitsToCreate,
      unitsToUpdate,
      unitsToMarkUnavailable,
      organizationId
    } = req.body;

    console.log('Received data for execution:');
    console.log(JSON.stringify(req.body, null, 2));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const result = {
      projectsCreated: 0,
      projectsUpdated: 0,
      unitsCreated: 0,
      unitsUpdated: 0,
      unitsMarkedUnavailable: 0
    };

    // Crear proyectos y mantener un mapeo de nombres a IDs
    const projectNameToIdMap = new Map();
    if (projectsToCreate.length > 0) {
      const projectsToInsert = projectsToCreate.map(project => ({
        ...project,
        _id: new ObjectId(),
        organization_id: ensureObjectId(organizationId),
        real_estate_company_id: ensureObjectId(project.real_estate_company_id),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const createProjectsResult = await db.collection('projects').insertMany(projectsToInsert);
      result.projectsCreated = createProjectsResult.insertedCount;
      console.log(`Created ${result.projectsCreated} projects`);

      // Crear el mapeo de nombres de proyecto a IDs
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
                updatedAt: new Date()
              }
            }
          }
        };
      });
      const updateProjectsResult = await db.collection('projects').bulkWrite(bulkUpdateProjects);
      result.projectsUpdated = updateProjectsResult.modifiedCount;
      console.log(`Updated ${result.projectsUpdated} projects`);
    }

    // Actualizar unidades con los IDs de proyecto correctos y crear unidades
    const updatedUnitsToCreate = unitsToCreate.map(unit => {
      const projectId = projectNameToIdMap.get(unit.project_name) || ensureObjectId(unit.project_id);
      return {
        ...unit,
        _id: new ObjectId(),
        project_id: projectId,
        organization_id: ensureObjectId(organizationId),
        real_estate_company_id: ensureObjectId(unit.real_estate_company_id),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    if (updatedUnitsToCreate.length > 0) {
      const createUnitsResult = await db.collection('stock').insertMany(updatedUnitsToCreate);
      result.unitsCreated = createUnitsResult.insertedCount;
      console.log(`Created ${result.unitsCreated} units`);
    }

    // Actualizar unidades existentes
    if (unitsToUpdate.length > 0) {
      const bulkUpdateUnits = unitsToUpdate.map(unit => {
        const unitData = omit(unit, ['_id', 'organization_id']);
        return {
          updateOne: {
            filter: { _id: ensureObjectId(unit._id), organization_id: ensureObjectId(organizationId) },
            update: {
              $set: {
                ...unitData,
                project_id: ensureObjectId(unitData.project_id),
                real_estate_company_id: ensureObjectId(unitData.real_estate_company_id),
                updatedAt: new Date()
              }
            }
          }
        };
      });
      const updateUnitsResult = await db.collection('stock').bulkWrite(bulkUpdateUnits);
      result.unitsUpdated = updateUnitsResult.modifiedCount;
      console.log(`Updated ${result.unitsUpdated} units`);
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
      console.log(`Marked ${result.unitsMarkedUnavailable} units as unavailable`);
    }

    console.log('Execution result:');
    console.log(JSON.stringify(result, null, 2));

    res.status(200).json({ 
      message: 'Database update completed successfully', 
      result 
    });
  } catch (error) {
    console.error('Error executing database update:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}