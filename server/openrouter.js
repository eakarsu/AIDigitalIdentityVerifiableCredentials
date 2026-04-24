const https = require('https');
require('dotenv').config();

async function callOpenRouter(prompt, systemPrompt = 'You are an expert AI assistant specializing in digital identity, verifiable credentials, decentralized identifiers, and identity security. Provide detailed, professional responses.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Digital Identity Platform'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.choices && parsed.choices[0]) {
            resolve({
              content: parsed.choices[0].message.content,
              model: parsed.model,
              usage: parsed.usage,
              id: parsed.id
            });
          } else {
            resolve({ content: 'AI service temporarily unavailable. Please check your OpenRouter API key.', model, usage: null, id: null });
          }
        } catch (e) {
          resolve({ content: 'AI service temporarily unavailable. Please check your OpenRouter API key.', model, usage: null, id: null });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ content: 'AI service connection error. Please verify your OpenRouter API key and network connection.', model, usage: null, id: null });
    });

    req.write(body);
    req.end();
  });
}

module.exports = { callOpenRouter };
