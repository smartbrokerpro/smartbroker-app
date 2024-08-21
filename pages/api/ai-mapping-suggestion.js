// pages/api/ai-mapping-suggestion.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { headers, projectFields, stockFields } = req.body;

  try {
    const prompt = `Given the following Excel headers: ${headers.join(', ')}, and the following model fields:
    Project: ${projectFields.join(', ')}
    Stock: ${stockFields.join(', ')}
    
    Suggest a mapping between the Excel headers and the model fields. Return the result as a JSON object where the keys are the Excel headers and the values are objects with 'model' (either 'project' or 'stock') and 'field' properties. Use lowercase field names`;

    console.log("prompt", prompt)

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt }
      ],
      max_tokens: 1000,
    });

    const suggestion = JSON.parse(gptResponse.choices[0].message.content.trim());
    res.status(200).json(suggestion);
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    res.status(500).json({ message: 'Error getting AI suggestions' });
  }
}
