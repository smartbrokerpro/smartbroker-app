import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const TestAssistant = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenUsage, setTokenUsage] = useState([]);
  const [tests, setTests] = useState([
    "unidades de menos de 2200 uf",
    // "unidades con dormitorios y 2 baños",
    // "proyectos en la comuna de La Florida",
    // "unidades con orientación al norte",
    // "unidades con terraza y superficie total entre 50 y 60 metros cuadrados"
  ]);

  const callApi = async (action, params) => {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, params }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    let threadId = '';

    try {
      // Crear hilo
      const threadResponse = await callApi('createThread');
      threadId = threadResponse.id;

      // Añadir mensaje al hilo
      await callApi('addMessageToThread', { threadId, message: query });

      // Ejecutar asistente en el hilo
      const runResponse = await callApi('runAssistantOnThread', { threadId, assistantName: 'ProjectAssistant' });
      const runId = runResponse.id;

      // Esperar a que el run se complete
      let runStatus = 'queued';
      while (runStatus === 'queued' || runStatus === 'running') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de verificar nuevamente
        const statusResponse = await callApi('getTokenUsage', { threadId, runId });
        runStatus = statusResponse.status;
      }

      // Obtener respuesta del asistente
      const assistantResponse = await callApi('getAssistantResponse', { threadId });

      // Obtener uso de tokens
      const usage = await callApi('getTokenUsage', { threadId, runId });

      console.log(`Tokens used for query "${query}":`, usage);

      setResponse(assistantResponse);
      setTokenUsage(prev => [...prev, { threadId, query, assistantResponse, usage }]);
    } catch (error) {
      console.error('Error:', error);
      setTokenUsage(prev => [...prev, { threadId, query, error: error.message }]);
      setResponse('Error: ' + error.message);
    }

    setLoading(false);
  };

  const handleRunTests = async () => {
    setLoading(true);
    setTokenUsage([]);
    setResponse('');

    for (let i = 0; i < tests.length; i++) {
      const query = tests[i];
      let threadId = '';
      try {
        // Crear hilo
        const threadResponse = await callApi('createThread');
        threadId = threadResponse.id;

        // Añadir mensaje al hilo
        await callApi('addMessageToThread', { threadId, message: query });

        // Ejecutar asistente en el hilo
        const runResponse = await callApi('runAssistantOnThread', { threadId, assistantName: 'ProjectAssistant' });
        const runId = runResponse.id;

        // Esperar a que el run se complete
        let runStatus = 'queued';
        while (runStatus === 'queued' || runStatus === 'running') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
          const statusResponse = await callApi('getTokenUsage', { threadId, runId });
          runStatus = statusResponse.status;
        }

        // Obtener respuesta del asistente
        const assistantResponse = await callApi('getAssistantResponse', { threadId });

        // Obtener uso de tokens
        const usage = await callApi('getTokenUsage', { threadId, runId });

        console.log(`Tokens used for query "${query}":`, usage);

        setTokenUsage(prev => [...prev, { threadId, query, assistantResponse, usage }]);
      } catch (error) {
        console.error('Error:', error);
        setTokenUsage(prev => [...prev, { threadId, query, error: error.message }]);
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test OpenAI Assistant</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query"
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button type="submit" disabled={loading}>Submit</button>
      </form>
      <button onClick={handleRunTests} disabled={loading} style={{ marginTop: '10px' }}>Run Tests</button>
      {loading && <p>Loading...</p>}
      {response && (
        <div>
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
      {tokenUsage.length > 0 && (
        <div>
          <h2>Token Usage:</h2>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thread ID</TableCell>
                  <TableCell>Query</TableCell>
                  <TableCell>Response</TableCell>
                  <TableCell>Prompt Tokens</TableCell>
                  <TableCell>Completion Tokens</TableCell>
                  <TableCell>Total Tokens</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokenUsage.map((usage, index) => (
                  <TableRow key={index}>
                    <TableCell>{usage.threadId}</TableCell>
                    <TableCell>{usage.query}</TableCell>
                    <TableCell>{usage.assistantResponse || 'N/A'}</TableCell>
                    <TableCell>{usage.usage?.prompt_tokens || 'N/A'}</TableCell>
                    <TableCell>{usage.usage?.completion_tokens || 'N/A'}</TableCell>
                    <TableCell>{usage.usage?.total_tokens || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}

export default TestAssistant;
