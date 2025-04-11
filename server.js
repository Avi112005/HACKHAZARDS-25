const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const Groq = require('groq-sdk');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Groq SDK
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// === POST /api/chat ===
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const chatCompletion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that always explains answers in clear, descriptive paragraphs unless code-only is requested."
          },
          {
            role: "user",
            content: message
          }
        ]
      });
            

    const reply = chatCompletion.choices[0]?.message?.content || "Sorry, no response received.";
    res.json({ reply });
  } catch (error) {
    console.error("Groq SDK Error:", error);
    res.status(500).json({ error: 'Groq API failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GroqMate backend running at http://localhost:${PORT}`);
});
