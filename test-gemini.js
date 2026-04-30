const OpenAI = require('openai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY; // I will pass this from command line
  console.log("API Key exists:", !!apiKey);
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-1.5-pro",
      messages: [{ role: "user", content: "Say hello" }]
    });
    console.log("Success:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error Status:", err.status);
    console.error("Error Message:", err.message);
    if (err.response && err.response.data) {
      console.error("Error Data:", err.response.data);
    } else {
      console.error("Error full:", err);
    }
  }
}

test();
