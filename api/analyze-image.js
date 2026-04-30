module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Set larger timeout if possible (Vercel max is 10s on hobby plan)
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel environment variables." });
    }

    // Strip out data:image/jpeg;base64, prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: `You are an expert Vietnamese construction and appliance price estimator. 
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

Return ONLY the JSON array.` },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return res.status(response.status).json({ error: "Gemini API Error: " + errorText });
    }

    const data = await response.json();
    if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
      return res.status(500).json({ error: "Invalid response format from Gemini" });
    }

    let raw = data.candidates[0].content.parts[0].text.trim();
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
