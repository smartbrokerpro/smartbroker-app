import {
    createThread,
    addMessageToThread,
    runAssistantOnThread,
    getAssistantResponse,
    getTokenUsage
  } from '../../controllers/openaiController';
  
  export default async function handler(req, res) {
    const { action, params } = req.body;
  
    console.log('Received request with action:', action, 'and params:', params);
  
    try {
      let response;
  
      switch (action) {
        case 'createThread':
          response = await createThread();
          break;
        case 'addMessageToThread':
          response = await addMessageToThread(params.threadId, params.message);
          break;
        case 'runAssistantOnThread':
          response = await runAssistantOnThread(params.threadId, params.assistantName);
          break;
        case 'getAssistantResponse':
          response = await getAssistantResponse(params.threadId);
          break;
        case 'getTokenUsage':
          response = await getTokenUsage(params.threadId, params.runId);
          break;
        default:
          res.status(400).json({ error: 'Invalid action' });
          return;
      }
  
      console.log('Sending response:', response);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in handler:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
  