const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Puedes omitirlo si ya lo tienes configurado en el entorno
});

async function testOpenAI() {
  try {
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: 'Say this is a test',
      max_tokens: 10,
    });

    console.log(response.choices[0].text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testOpenAI();
