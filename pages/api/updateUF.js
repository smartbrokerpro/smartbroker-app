import clientPromise from "@/lib/mongodb";

const API_URL = "https://api.cmfchile.cl/api-sbifv3/recursos_api/uf?apikey=bace76350472a60b9a18534dfa08b18a033c78f7&formato=json";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!data.UFs || data.UFs.length === 0) {
      return res.status(500).json({ error: "No hay datos de UF" });
    }

    const { Fecha, Valor } = data.UFs[0];

    // Convertir "38.379,45" a número: 38379.45
    const valorNumeric = parseFloat(Valor.replace(/\./g, "").replace(",", ".")) || parseFloat(Valor);

    // Obtener la conexión a MongoDB y asegurar que use la base correcta
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    console.log("Guardando UF en base de datos:", db.databaseName);

    // Verificar si ya existe la UF del día
    const existeUF = await db.collection("ufs").findOne({ fecha: Fecha });

    if (existeUF) {
      console.log("La UF ya está guardada, no se inserta nuevamente.");
      return res.status(204).json({ message: "UF ya guardada", data: existeUF });
    }

    // Insertar un nuevo registro si no existe
    const result = await db.collection("ufs").insertOne({
      fecha: Fecha, // Guardado como string "YYYY-MM-DD"
      valor: valorNumeric,
      createdAt: new Date()
    });

    console.log("UF insertada:", result);

    return res.status(200).json({ message: "UF guardada", data: { fecha: Fecha, valor: valorNumeric } });
  } catch (error) {
    console.error("Error al guardar UF:", error);
    return res.status(500).json({ error: error.message });
  }
}
