// pages/api/gptRequest.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003', // or another model you prefer
      prompt: prompt,
      max_tokens: 150,
    });

    res.status(200).json({ text: response.data.choices[0].text });
  } catch (error) {
    console.error('Error fetching GPT-4 response:', error);
    res.status(500).json({ message: 'Error fetching GPT-4 response' });
  }
}
