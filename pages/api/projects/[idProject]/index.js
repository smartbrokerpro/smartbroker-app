import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const { idProject } = req.query;

  if (req.method === 'GET') {
    try {
      console.log('Conectando a la base de datos...');
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      console.log(`Buscando proyecto con id: ${idProject}`);
      const projectId = new ObjectId(idProject);
      const project = await db.collection('projects').aggregate([
        { $match: { _id: projectId } },
        {
          $lookup: {
            from: 'counties',
            localField: 'county_id',
            foreignField: '_id',
            as: 'county'
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
          $unwind: { path: '$county', preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: '$real_estate_company', preserveNullAndEmptyArrays: true }
        }
      ]).toArray();

      const regions = await db.collection('regions').find({}).toArray();
      const counties = await db.collection('counties').find({}).toArray();
      const realEstateCompanies = await db.collection('real_estate_companies').find({}).toArray();

      if (project.length === 0) {
        console.log('Proyecto no encontrado');
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Verificar si el campo gallery no existe y agregarlo si es necesario
      if (!project[0].gallery) {
        project[0].gallery = [];
        await db.collection('projects').updateOne(
          { _id: projectId },
          { $set: { gallery: [] } }
        );
      }

      console.log('Proyecto encontrado:', project[0]);
      res.status(200).json({ success: true, data: { project: project[0], regions, counties, realEstateCompanies } });
    } catch (error) {
      console.error('Error al obtener el proyecto:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      console.log('Conectando a la base de datos...');
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const { _id, region_id, county_id, real_estate_company_id, ...projectData } = req.body; // Excluye el campo _id
      console.log(`Actualizando proyecto con id: ${idProject}`);
      console.log('Datos del proyecto:', projectData);
      const updatedProjectData = {
        ...projectData,
        region_id: new ObjectId(region_id),
        county_id: new ObjectId(county_id),
        real_estate_company_id: new ObjectId(real_estate_company_id)
      };

      // Obtener los nombres correspondientes
      const region = await db.collection('regions').findOne({ _id: new ObjectId(region_id) });
      const county = await db.collection('counties').findOne({ _id: new ObjectId(county_id) });
      const realEstateCompany = await db.collection('real_estate_companies').findOne({ _id: new ObjectId(real_estate_company_id) });

      updatedProjectData.region_name = region ? region.region : null;
      updatedProjectData.county_name = county ? county.name : null;
      updatedProjectData.real_estate_company_name = realEstateCompany ? realEstateCompany.name : null;

      await db.collection('projects').updateOne({ _id: new ObjectId(idProject) }, { $set: updatedProjectData });

      const updatedProject = await db.collection('projects').findOne({ _id: new ObjectId(idProject) });

      if (updatedProject) {
        await db.collection('stock').updateMany(
          { project_id: new ObjectId(idProject) },
          {
            $set: {
              region_name: updatedProjectData.region_name,
              county_name: updatedProjectData.county_name,
              real_estate_company_name: updatedProjectData.real_estate_company_name
            }
          }
        );
      }

      console.log('Proyecto y stock actualizados con éxito');
      res.status(200).json({ success: true, message: 'Project updated successfully' });
    } catch (error) {
      console.error('Error al actualizar el proyecto:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
