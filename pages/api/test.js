import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('sample_mflix');  // Conecta a la base de datos que especificaste en la URL de conexión
    const collection = db.collection('users');  // Crea una colección de prueba
    const result = await collection.insertOne({ message: 'Hello, MongoDB!' });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
