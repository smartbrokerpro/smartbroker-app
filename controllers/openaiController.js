import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const assistantMap = {
  ProjectAssistant: 'asst_li4YlhbZp8MyQ2YT3KdfJaQC',
  StockAssistant: 'asst_abc1234XYZ',
  // Add more assistants as needed
};

const createThread = async () => {
  console.log('Creating thread...');
  const response = await openai.beta.threads.create();
  console.log('Thread created:', response);
  return response;
};

const addMessageToThread = async (threadId, message) => {
  console.log('Adding message to thread:', threadId, message);
  const response = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
  console.log('Message added:', response);
  return response;
};

const runAssistantOnThread = async (threadId, assistantName) => {
  const assistantId = assistantMap[assistantName];
  if (!assistantId) {
    throw new Error('Invalid assistant name');
  }
  console.log('Running assistant on thread:', threadId, assistantId);
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  console.log('Assistant run response:', response);
  return response;
};

const getAssistantResponse = async (threadId) => {
  console.log('Getting assistant response for thread:', threadId);
  const messagesResponse = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messagesResponse.data.find(message => message.role === 'assistant');
  console.log('Assistant message:', assistantMessage);
  return assistantMessage ? assistantMessage.content[0].text.value.trim() : null;
};

const getTokenUsage = async (threadId, runId) => {
  console.log('Getting token usage for thread:', threadId, runId);
  const response = await openai.beta.threads.runs.retrieve(threadId, runId);
  console.log('Token usage response:', response);
  return response.usage;
};

export {
  createThread,
  addMessageToThread,
  runAssistantOnThread,
  getAssistantResponse,
  getTokenUsage
};
