import clientPromise from "@/lib/mongodb";

const API_URL = "https://api.cmfchile.cl/api-sbifv3/recursos_api/uf?apikey=bace76350472a60b9a18534dfa08b18a033c78f7&formato=json";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "real_estate_management_prod");

    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const ayerStr = ayer.toISOString().split("T")[0];

    let uf = await db.collection("ufs").findOne({ fecha: hoyStr });
    if (!uf) {
      uf = await db.collection("ufs").findOne({ fecha: ayerStr });
    }

    if (uf) {
      return res.status(200).json({
        UFs: [{
          Valor: uf.valor.toLocaleString("es-CL", { minimumFractionDigits: 2 }),
          Fecha: uf.fecha,
          origen: "Smarty"
        }]
      });
    }

    console.log("UF no encontrada en MongoDB, intentando obtener de CMF");
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.UFs && data.UFs.length > 0) {
      try {
        const valorNumeric = parseFloat(data.UFs[0].Valor.replace(/\./g, "").replace(",", "."));
        await db.collection("ufs").insertOne({
          fecha: data.UFs[0].Fecha,
          valor: valorNumeric,
          createdAt: new Date()
        });
        console.log("UF de CMF guardada en MongoDB");
      } catch (saveError) {
        console.error("Error al guardar UF de CMF en MongoDB:", saveError);
      }
      return res.status(200).json({
        UFs: [{
          ...data.UFs[0],
          origen: "CMF"
        }]
      });
    }

    console.log("No se pudo obtener UF de ninguna fuente, usando valor por defecto");
    return res.status(200).json({
      UFs: [{
        Valor: "38.500,00",
        Fecha: hoyStr,
        origen: "default",
        status: "referencial"
      }]
    });

  } catch (error) {
    console.error("Error inicial en MongoDB:", error);

    try {
      console.log("Intentando obtener de CMF después del error en MongoDB");
      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.UFs && data.UFs.length > 0) {
        return res.status(200).json({
          UFs: [{
            ...data.UFs[0],
            origen: "CMF"
          }]
        });
      }
    } catch (cmfError) {
      console.error("Error al obtener de CMF:", cmfError);
    }

    const hoy = new Date().toISOString().split("T")[0];
    return res.status(200).json({
      UFs: [{
        Valor: "38.500,00",
        Fecha: hoy,
        origen: "default",
        status: "referencial"
      }]
    });
  }
}