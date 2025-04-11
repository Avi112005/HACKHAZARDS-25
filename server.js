const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// === Groq Chat API ===
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
        { role: "user", content: message }
      ],
      temperature: 1,
      max_completion_tokens: 1024
    });

    const reply = chatCompletion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Groq Chat API error:", error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// === Gemini 1.5 Flash Vision API ===
app.post('/api/vision', async (req, res) => {
  const { base64Image, message } = req.body;
  if (!base64Image) return res.status(400).json({ error: 'No image provided.' });

  try {
    const base64Data = base64Image.split(',')[1];
    const mimeType = base64Image.match(/^data:(image\/[a-z]+);base64/)?.[1] || 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: message || 'Describe this image.' },
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            }
          ]
        }
      ]
    });

    const reply = await result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error("Gemini Vision API error:", err.message || err);
    res.status(500).json({ error: 'Gemini Vision processing failed' });
  }
});

// === Groq STT API ===
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
    console.error("STT error:", err);
    res.status(500).json({ error: 'Transcription failed' });
  } finally {
    fs.unlinkSync(audioFilePath);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 GroqMate API running at http://localhost:${PORT}`);
});
