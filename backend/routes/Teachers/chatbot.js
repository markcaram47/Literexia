// routes/Teachers/chatbot.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai').default;

// Initialize OpenAI client with your secret key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/chatbot/ask
 * Request body: { prompt: string, model?: string }
 * Returns: { reply: string }
 */
router.post('/ask', async (req, res) => {
  const { prompt, model = 'gpt-4' } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }
  
  try {
    // Call the Chat Completions endpoint
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
      presence_penalty: 0.6,
      frequency_penalty: 0.5
    });
    
    const reply = completion.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate chatbot response' });
  }
});

// Test route to verify API is working
router.get('/test', (req, res) => {
  res.json({ message: 'Chatbot API is working!' });
});

module.exports = router;