import { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

const COSTS = {
  gpt4: 0.06, // Cost per 1000 tokens in USD for GPT-4
  gpt35: 0.02, // Cost per 1000 tokens in USD for GPT-3.5
  googlePalm2: 0.02, // Cost per 1000 tokens in USD for Google PaLM 2
  anthropicClaude: 0.016, // Cost per 1000 tokens in USD for Anthropic Claude 3
  cohereCommand: 0.016 // Cost per 1000 tokens in USD for Cohere Command
};

const EXCHANGE_RATES = {
  usdToClp: 934.66, // Current exchange rate USD to CLP
  usdToUf: 0.028 // Current exchange rate USD to UF
};

const formatNumber = (number) => new Intl.NumberFormat('de-DE').format(number);
const formatUF = (number) => number.toFixed(2);

export default function Home() {
  const [users, setUsers] = useState('');
  const [consultationsPerDay, setConsultationsPerDay] = useState('');
  const [tokensPerConsultation, setTokensPerConsultation] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('usd');
  const [costs, setCosts] = useState(null);
  const [totalConsultations, setTotalConsultations] = useState(null);
  const [model, setModel] = useState('gpt4');
  const [possibleConsultations, setPossibleConsultations] = useState(null);

  const handleCalculateCosts = () => {
    const userCount = parseInt(users, 10);
    const consultations = parseInt(consultationsPerDay, 10) * 30; // Convert daily consultations to monthly
    const tokens = parseInt(tokensPerConsultation, 10);

    if (!isNaN(userCount) && !isNaN(consultations) && !isNaN(tokens)) {
      const totalTokens = tokens * consultations * userCount;
      const costDetails = {};

      Object.keys(COSTS).forEach(model => {
        const costPerTokenUsd = COSTS[model];
        const totalCostUsd = (totalTokens / 1000) * costPerTokenUsd;

        costDetails[model] = {
          usd: Math.round(totalCostUsd),
          clp: formatNumber(Math.round(totalCostUsd * EXCHANGE_RATES.usdToClp)),
          uf: formatUF(totalCostUsd * EXCHANGE_RATES.usdToUf),
          tokens: totalTokens,
          credits: Math.round(totalTokens / 1000)
        };
      });

      setTotalConsultations(consultations * userCount);
      setCosts(costDetails);
    } else {
      setCosts(null);
      setTotalConsultations(null);
    }
  };

  const handleCalculateConsultations = () => {
    const budgetAmount = parseFloat(budget);
    const tokens = parseInt(tokensPerConsultation, 10);

    if (!isNaN(budgetAmount) && !isNaN(tokens) && budgetAmount > 0 && tokens > 0) {
      const budgetInUsd = budgetCurrency === 'usd' ? budgetAmount : budgetAmount / EXCHANGE_RATES.usdToClp;
      const costPerTokenUsd = COSTS[model];
      const totalTokens = (budgetInUsd / costPerTokenUsd) * 1000;
      const totalConsultations = Math.floor(totalTokens / tokens);

      setPossibleConsultations(totalConsultations);
    } else {
      setPossibleConsultations(null);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI API Cost Calculator
        </Typography>
        <TextField
          label="Number of Users"
          variant="outlined"
          fullWidth
          value={users}
          onChange={(e) => setUsers(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Consultations per Day per User"
          variant="outlined"
          fullWidth
          value={consultationsPerDay}
          onChange={(e) => setConsultationsPerDay(e.target.value)}
          margin="normal"
        />
        <TextField
          label="Average Tokens per Consultation"
          variant="outlined"
          fullWidth
          value={tokensPerConsultation}
          onChange={(e) => setTokensPerConsultation(e.target.value)}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Model</InputLabel>
          <Select
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <MenuItem value="gpt4">GPT-4</MenuItem>
            <MenuItem value="gpt35">GPT-3.5</MenuItem>
            <MenuItem value="googlePalm2">Google PaLM 2</MenuItem>
            <MenuItem value="anthropicClaude">Anthropic Claude</MenuItem>
            <MenuItem value="cohereCommand">Cohere Command</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCalculateCosts}
        >
          Calculate Costs
        </Button>
        {totalConsultations !== null && (
          <Typography variant="h6" sx={{ mt: 4 }}>
            Total Monthly Consultations: {totalConsultations}
          </Typography>
        )}
        {costs && (
          <TableContainer component={Paper} sx={{ mt: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell align="right">Cost per 1000 Tokens (USD)</TableCell>
                  <TableCell align="right">USD</TableCell>
                  <TableCell align="right">CLP</TableCell>
                  <TableCell align="right">UF</TableCell>
                  <TableCell align="right">Tokens</TableCell>
                  <TableCell align="right">Credits</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(COSTS).map(model => (
                  <TableRow key={model}>
                    <TableCell>{model.toUpperCase().replace(/_/g, ' ')}</TableCell>
                    <TableCell align="right">${COSTS[model].toFixed(4)}</TableCell>
                    <TableCell align="right">${costs[model].usd}</TableCell>
                    <TableCell align="right">${costs[model].clp}</TableCell>
                    <TableCell align="right">{costs[model].uf}</TableCell>
                    <TableCell align="right">{costs[model].tokens}</TableCell>
                    <TableCell align="right">{costs[model].credits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Calculate Consultations from Budget
          </Typography>
          <TextField
            label="Budget"
            variant="outlined"
            fullWidth
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Currency</InputLabel>
            <Select
              value={budgetCurrency}
              onChange={(e) => setBudgetCurrency(e.target.value)}
            >
              <MenuItem value="usd">USD</MenuItem>
              <MenuItem value="clp">CLP</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCalculateConsultations}
          >
            Calculate Consultations
          </Button>
          {possibleConsultations !== null && (
            <Typography variant="h6" sx={{ mt: 4 }}>
              Possible Consultations with Budget: {possibleConsultations}
            </Typography>
          )}
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Explanation of Calculations:
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Cost Calculation:</strong> The total cost is calculated using the **number of users**, **consultations per day per user**, and **average tokens per consultation**. These values are multiplied to get the **total tokens**, which is then used to calculate the cost in **USD**, **CLP**, and **UF**.
          </Typography>
          <Typography variant="body1">
            <strong>Budget Calculation:</strong> The number of possible consultations is calculated using the **budget** and **average tokens per consultation**. The budget is converted to **USD** if specified in **CLP**. The budget in USD is divided by the cost per 1000 tokens to get the **total tokens**, which is then divided by the **average tokens per consultation** to get the possible consultations.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
