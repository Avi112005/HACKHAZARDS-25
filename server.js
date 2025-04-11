const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// === /api/chat ===
app.post('/api/chat', async (req, res) => {
  const { message, language } = req.body;

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: `You are a multilingual assistant. Respond in this language: ${language}.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1
    });

    const reply = chatCompletion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// === /api/vision ===
app.post('/api/vision', async (req, res) => {
    const { image_prompt } = req.body;
  
    try {
      const result = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: image_prompt
          }
        ],
        temperature: 1,
        max_completion_tokens: 1024
      });
  
      res.json({ reply: result.choices[0].message.content });
    } catch (err) {
      console.error("Vision API error:", err);
      res.status(500).json({ error: 'Vision processing failed' });
    }
  });
  
// === /api/stt (speech-to-text) ===
const upload = multer({ dest: 'uploads/' });
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  const audioFilePath = req.file.path;

  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: "whisper-large-v3",
      response_format: "verbose_json"
    });

    res.json({ text: transcription.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transcription failed' });
  } finally {
    fs.unlinkSync(audioFilePath);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`GroqMate Assistant API running at http://localhost:${PORT}`);
});
