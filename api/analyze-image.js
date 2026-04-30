const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Set larger timeout if possible (Vercel max is 10s on hobby plan)
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

  try {
    const isGeminiDirect = !!process.env.GEMINI_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "sk-9aa9be1d95d96de8-c5nbd8-a7ca10f4";

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: isGeminiDirect ? "https://generativelanguage.googleapis.com/v1beta/openai/" : "https://api.krouter.net/v1"
    });

    const response = await openai.chat.completions.create({
      model: isGeminiDirect ? "gemini-1.5-pro" : "cx/gpt-5.5",
      messages: [
        {
          role: "system",
          content: `You are an expert Vietnamese construction and appliance price estimator. 
Analyze the provided quotation image. Extract the products and return ONLY a valid JSON array of objects. 
Do not wrap it in markdown block. Just the raw JSON array.
Each object must have these exact keys:
- "name": (String) Name of the item
- "brand": (String) Brand if available, else ""
- "dvt": (String) Unit (e.g. "Cái", "Bộ")
- "sl": (Number) Quantity
- "dg": (Number) Unit price listed in the image (Đơn giá báo)
- "tt": (Number) Total price listed in the image (Thành tiền)
- "ref": (String) Format: "X" representing the estimated market price (Giá thị trường) based on your knowledge. E.g. "15000000".
- "mmax": (Number) The maximum market price estimated (Number only). Same as ref if it's a single number.
- "note": (String) A short Vietnamese note on whether the price in the image is reasonable compared to the market.

Return ONLY the JSON array.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the data from this quotation image." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    let raw = response.choices[0].message.content.trim();
    if (raw.startsWith('```json')) {
      raw = raw.substring(7, raw.length - 3).trim();
    } else if (raw.startsWith('```')) {
      raw = raw.substring(3, raw.length - 3).trim();
    }

    const jsonArr = JSON.parse(raw);
    res.status(200).json({ data: jsonArr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to process image" });
  }
};
