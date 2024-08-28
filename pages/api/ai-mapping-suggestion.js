// pages/api/ai-sugerencia-mapeo.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { headers, projectFields, stockFields } = req.body;

  try {
    const prompt = `Dado los siguientes encabezados de Excel: ${headers.join(', ')}, y los siguientes campos del modelo:
    Proyecto: ${projectFields.join(', ')}
    Stock: ${stockFields.join(', ')}
    
    Sugiere un mapeo entre los encabezados de Excel y los campos del modelo. Devuelve la respuesta SOLO como un objeto JSON (sin explicaciones adicionales) donde las claves son los encabezados de Excel y los valores son objetos con las propiedades 'model' (ya sea 'project' o 'stock') y 'field'. Utiliza nombres de campo en minúsculas.`;

    console.log("Prompt generado:", prompt);

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: prompt }
      ],
      max_tokens: 1000,
    });

    console.log("Respuesta de GPT-4:", gptResponse);

    // Verifica si la respuesta tiene el formato esperado
    let rawResponse = gptResponse.choices[0].message.content.trim();
    console.log("Contenido de la respuesta:", rawResponse);

    // Limpia posibles caracteres inesperados antes de intentar parsear
    rawResponse = rawResponse.replace(/```json|```/g, '');

    // Intenta analizar la respuesta como JSON
    const sugerencia = JSON.parse(rawResponse);
    res.status(200).json(sugerencia);
  } catch (error) {
    console.error('Error al obtener sugerencias de IA:', error);
    res.status(500).json({ message: 'Error al obtener sugerencias de IA' });
  }
}
