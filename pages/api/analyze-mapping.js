import clientPromise from '@/lib/mongodb';
import ExcelJS from 'exceljs';
import { ObjectId } from 'mongodb';

const getFieldKey = (mapping, fieldName) => {
  return Object.keys(mapping).find(key => mapping[key].field === fieldName);
};

function standardizeOrientation(orientation) {
  const orientationMap = {
    'NORTE': ['norte', 'n', 'north'],
    'NORPONIENTE': ['norponiente', 'noroeste', 'nw', 'northwest', 'nor-poniente', 'nor poniente', 'noroesteponiente', 'noroeste-poniente', 'no', 'np'],
    'NORORIENTE': ['nororiente', 'noreste', 'ne', 'northeast', 'nor-oriente', 'nor oriente', 'noresteoriente', 'noreste-oriente'],
    'SUR': ['sur', 's', 'south'],
    'SURPONIENTE': ['surponiente', 'suroeste', 'sw', 'southwest', 'sur-poniente', 'sur poniente', 'suroesteponiente', 'suroeste-poniente', 'so', 'sp'],
    'SURORIENTE': ['suroriente', 'sureste', 'se', 'southeast', 'sur-oriente', 'sur oriente', 'suresteoriente', 'sureste-oriente'],
    'PONIENTE': ['poniente', 'oeste', 'w', 'west', 'p', 'o'],
    'ORIENTE': ['oriente', 'este', 'e', 'east']
  };

  const normalizedOrientation = orientation.toLowerCase().replace(/\s+/g, ' ').trim();

  if (normalizedOrientation.includes('poniente') && normalizedOrientation.includes('sur')) {
    return 'SURPONIENTE';
  }
  if (normalizedOrientation.includes('poniente') && normalizedOrientation.includes('norte')) {
    return 'NORPONIENTE';
  }
  if (normalizedOrientation.includes('oriente') && normalizedOrientation.includes('sur')) {
    return 'SURORIENTE';
  }
  if (normalizedOrientation.includes('oriente') && normalizedOrientation.includes('norte')) {
    return 'NORORIENTE';
  }

  for (const [standard, variants] of Object.entries(orientationMap)) {
    if (variants.some(variant => normalizedOrientation.includes(variant))) {
      return standard;
    }
  }

  return orientation.toUpperCase();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { mapping, file, companyId, organizationId, realEstateCompanyId } = req.body;
    
    if (!file) {
      throw new Error("File is missing in the request body.");
    }

    const buffer = Buffer.from(file, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const rows = [];

    worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
      if (rowNumber > 1) {
        rows.push(row.values.slice(1));
      }
    });

    const projectNameKey = getFieldKey(mapping, 'name');
    const apartmentKey = getFieldKey(mapping, 'apartment');

    if (!projectNameKey || !apartmentKey) {
      throw new Error('Project name or apartment field not found in mapping');
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const projectQuery = { 
      name: { $exists: true },
      organization_id: new ObjectId(organizationId),
      real_estate_company_id: new ObjectId(realEstateCompanyId)
    };

    const existingProjects = await db.collection('projects').find(projectQuery).toArray();
    const existingProjectMap = new Map(existingProjects.map(proj => [proj.name.toLowerCase().trim().replace(/\s+/g, ' '), proj]));

    const existingUnitsQuery = {
      project_id: { $in: existingProjects.map(p => p._id) },
      organization_id: new ObjectId(organizationId),
    };
    const existingUnits = await db.collection('stock').find(existingUnitsQuery).toArray();
    const existingUnitMap = new Map(existingUnits.map(unit => [`${unit.project_id.toString()}-${unit.apartment}`, unit]));

    const projectsToCreate = new Map();
    const projectsToUpdate = new Map();
    const unitsToCreate = [];
    const unitsToUpdate = [];
    const unitsToMarkUnavailable = [];
    const processedUnits = new Set();
    const errors = [];
    const projectSummary = {};

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const projectNameOriginal = row[mapping[projectNameKey].index];
      const projectNameLowercase = projectNameOriginal?.toLowerCase().trim().replace(/\s+/g, ' ');
      const apartment = row[mapping[apartmentKey].index];

      if (!projectNameOriginal || !apartment) {
        errors.push(`Row ${rowIndex + 2}: Missing project name or apartment`);
        continue;
      }

      const existingProject = existingProjectMap.get(projectNameLowercase);
      
      const projectData = {};
      const stockData = {};
      
      Object.keys(mapping).forEach((header) => {
        const { field, index, model } = mapping[header];
        if (field) {
          if (model === 'project') {
            projectData[field] = row[index];
          } else if (model === 'stock') {
            stockData[field] = row[index];
          }
        }
      });

      if (!existingProject) {
        if (!projectsToCreate.has(projectNameLowercase)) {
          projectsToCreate.set(projectNameLowercase, {
            ...projectData,
            name: projectNameOriginal,
            organization_id: new ObjectId(organizationId),
            real_estate_company_id: new ObjectId(realEstateCompanyId)
          });
        }
        if (!projectSummary[projectNameOriginal]) {
          projectSummary[projectNameOriginal] = { newUnits: 0, updatedUnits: 0, unavailableUnits: 0, isNew: true };
        }
      } else {
        if (!projectsToUpdate.has(projectNameLowercase)) {
          projectsToUpdate.set(projectNameLowercase, {
            _id: existingProject._id,
            ...projectData,
            name: projectNameOriginal,
          });
        }
        if (!projectSummary[projectNameOriginal]) {
          projectSummary[projectNameOriginal] = { newUnits: 0, updatedUnits: 0, unavailableUnits: 0, isNew: false };
        }
      }

      const unitData = {
        ...stockData,
        project_name: projectNameOriginal,
        county_name: existingProject ? existingProject.county_name : projectData.county_name,
        region_name: existingProject ? existingProject.region_name : projectData.region_name,
        real_estate_company_id: new ObjectId(realEstateCompanyId),
        discount: stockData.discount || 0,
        down_payment_bonus: stockData.down_payment_bonus || 0,
        orientation: standardizeOrientation(stockData.orientation || ''),
        available: 1,
      };

      const projectId = existingProject ? existingProject._id : 'new';
      const unitKey = `${projectId}-${apartment}`;
      const existingUnit = existingUnitMap.get(unitKey);

      if (existingUnit) {
        unitsToUpdate.push({
          ...existingUnit,
          ...unitData,
          project_id: projectId,
          organization_id: new ObjectId(organizationId),
          real_estate_company_id: new ObjectId(realEstateCompanyId)
        });
        projectSummary[projectNameOriginal].updatedUnits++;
      } else {
        unitsToCreate.push({
          ...unitData,
          apartment,
          project_id: projectId,
          organization_id: new ObjectId(organizationId),
          real_estate_company_id: new ObjectId(realEstateCompanyId)
        });
        projectSummary[projectNameOriginal].newUnits++;
      }

      processedUnits.add(unitKey);
    }

    existingUnits.forEach(unit => {
      const existingProject = existingProjects.find(p => p._id.toString() === unit.project_id.toString());
      if (existingProject) {
        const key = `${unit.project_id.toString()}-${unit.apartment}`;
        if (!processedUnits.has(key) && unit.available !== 0) {
          unitsToMarkUnavailable.push({ _id: unit._id, available: 0 });
          const projectName = existingProject.name;
          if (projectSummary[projectName]) {
            projectSummary[projectName].unavailableUnits++;
          } else {
            projectSummary[projectName] = { newUnits: 0, updatedUnits: 0, unavailableUnits: 1, isNew: false };
          }
        }
      }
    });

    const detailedProjectSummary = Object.entries(projectSummary).map(([projectName, summary]) => ({
      projectName,
      isNewProject: summary.isNew,
      newUnits: summary.newUnits,
      updatedUnits: summary.updatedUnits,
      unavailableUnits: summary.unavailableUnits,
      totalUnits: summary.newUnits + summary.updatedUnits + summary.unavailableUnits
    }));

    const unitsToMarkUnavailableOptimized = unitsToMarkUnavailable.map(unit => ({
        _id: unit._id,
        available: 0
    }));

    res.status(200).json({
        summary: {
          projectsToCreate: projectsToCreate.size,
          projectsToUpdate: projectsToUpdate.size,
          unitsToCreate: unitsToCreate.length,
          unitsToUpdate: unitsToUpdate.length,
          unitsToMarkUnavailable: unitsToMarkUnavailable.length,
        },
        detailedProjectSummary,
        errors,
        executionData: {
          projectsToCreate: Array.from(projectsToCreate.values()),
          projectsToUpdate: Array.from(projectsToUpdate.values()),
          unitsToCreate,
          unitsToUpdate,
          unitsToMarkUnavailable: unitsToMarkUnavailableOptimized,
        },
        sampleData: {
          projectToCreate: Array.from(projectsToCreate.values())[0],
          projectToUpdate: Array.from(projectsToUpdate.values())[0],
          unitToCreate: unitsToCreate[0],
          unitToUpdate: unitsToUpdate[0],
          unitToMarkUnavailable: unitsToMarkUnavailableOptimized[0]
        }
      });
  } catch (error) {
    console.error('Error analyzing mapping:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}