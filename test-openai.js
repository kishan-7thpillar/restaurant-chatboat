// Simple script to test OpenAI API key
require('dotenv').config();
const { OpenAI } = require('openai');

console.log('Testing OpenAI API key...');
console.log('API Key available:', process.env.OPENAI_API_KEY ? 'Yes (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'No');

async function testOpenAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, this is a test!' }],
    });

    console.log('✅ OpenAI API key is working correctly!');
    console.log('Response:', completion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error testing OpenAI API key:', error.message);
  }
}

testOpenAI();
