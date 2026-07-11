require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let tasks = []; 

app.post('/api/generate-subtasks', async (req, res) => {
  try {
    const { taskName } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `Break down this task into 3 short, actionable subtasks: ${taskName}`;
    
    let result;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (err) {
        const isOverloaded = err.message && (err.message.includes('503') || err.message.includes('Service Unavailable'));
        if (isOverloaded && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        } else {
          throw err;
        }
      }
    }
    
    res.json({ subtasks: result.response.text() });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate subtasks" });
  }
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = req.body;
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);
  
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...req.body };
    res.json(tasks[index]);
  } else {
    res.status(404).json({ error: "Task not found" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});