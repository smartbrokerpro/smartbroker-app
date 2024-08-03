// pages/api/getModelFields.js
import clientPromise from '../../lib/mongodb';
import projectModel from '../../models/projectModel';
import stockModel from '../../models/stockModel';

const handler = async (req, res) => {
  try {
    // Conectar a la base de datos
    const client = await clientPromise;
    const db = client.db(); // Puedes especificar el nombre de la base de datos si es necesario
    
    // No necesitas hacer nada más con `client` o `db` ya que estás usando Mongoose para acceder a los modelos

    if (req.method === 'GET') {
      const projectFields = Object.keys(projectModel.schema.paths);
      const stockFields = Object.keys(stockModel.schema.paths);

      res.status(200).json({ projectFields, stockFields });
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los campos del modelo', error });
  }
};

export default handler;
