import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/analyze', async (req, res) => {
  const { code, task } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'No code provided.' });
  }

  const systemPrompt = task === 'review'
    ? 'Perform a concise peer code review focusing on bugs, security, and performance. Use bullet points.'
    : 'Analyze this code for bugs, edge cases, and memory leaks. Provide concise corrections and the fixed code snippet.';

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: code }
      ],
      model: 'gemma2-9b-it',
      temperature: 0.2,
      max_tokens: 1024
    });

    const output = chatCompletion.choices[0]?.message?.content || 'No output generated.';
    res.json({ result: output });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Model failed to respond. Check API key or quota.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});