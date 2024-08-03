// pages/api/importStock.js
import dbConnect from '../../lib/mongodb';
import Project from '../../models/projectModel';
import Stock from '../../models/stockModel';

const handler = async (req, res) => {
  await dbConnect();

  if (req.method === 'POST') {
    const { data, projectMappings, stockMappings } = req.body;

    try {
      // Extraer los proyectos únicos
      const uniqueProjects = [...new Set(data.map(item => item[projectMappings.name]))];
      const projectMap = {};

      // Guardar los proyectos en la base de datos
      for (const projectName of uniqueProjects) {
        const projectData = {
          name: projectName,
          address: data.find(item => item[projectMappings.name] === projectName)[projectMappings.address],
          // Otros campos mapeados
        };

        const project = new Project(projectData);
        await project.save();
        projectMap[projectName] = project._id;
      }

      // Mapear los datos de stock con los ObjectId de los proyectos
      const stockData = data.map(item => ({
        project_id: projectMap[item[projectMappings.name]],
        apartment: item[stockMappings.apartment],
        // Otros campos mapeados
      }));

      // Insertar los datos de stock
      await Stock.insertMany(stockData);

      res.status(200).json({ message: 'Datos importados exitosamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al importar los datos', error });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
};

export default handler;
