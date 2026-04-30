const OpenAI = require('openai');
const fs = require('fs');

async function test() {
  const openai = new OpenAI({
    apiKey: "sk-9aa9be1d95d96de8-c5nbd8-a7ca10f4",
    baseURL: "https://api.krouter.net/v1"
  });

  // 1x1 pixel base64 image
  const dummyImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  console.log("Sending request to KRouter...");
  const startTime = Date.now();
  
  try {
    const response = await openai.chat.completions.create({
      model: "cx/gpt-5.5",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is this image?" },
            { type: "image_url", image_url: { url: dummyImage } }
          ]
        }
      ],
      max_tokens: 50
    });
    
    console.log("Success! Time taken:", (Date.now() - startTime) / 1000, "seconds");
    console.log("Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("API Error:", err.message);
  }
}

test();
