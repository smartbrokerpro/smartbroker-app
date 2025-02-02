import clientPromise from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split("T")[0];

    // Conectar a MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "real_estate_management_prod");

    // Buscar la UF del día en MongoDB
    const uf = await db.collection("ufs").findOne({ fecha: hoy });

    if (!uf) {
      return res.status(404).json({ error: "No se encontró la UF para hoy" });
    }

    // Formatear la respuesta como la API de la CMF
    return res.status(200).json({
      UFs: [
        {
          Valor: uf.valor.toLocaleString("es-CL", { minimumFractionDigits: 2 }),
          Fecha: uf.fecha
        }
      ]
    });
  } catch (error) {
    console.error("Error al obtener la UF:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
