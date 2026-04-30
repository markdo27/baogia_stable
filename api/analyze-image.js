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
            { text: `You are an expert Vietnamese construction and appliance price estimator and data extractor.
Analyze the provided quotation/invoice image very carefully.
Extract every product listed in the image and return ONLY a valid JSON array of objects.
Do not miss any items. If an item has a price, you MUST extract it accurately.

Each object must have these exact keys (use Number type for prices, 0 if missing):
- "name": (String) Name of the item exactly as written in the image.
- "brand": (String) Extract the brand from the name (e.g., "Panasonic", "Aqua", "Toto", "Daikin"). If none, use "".
- "dvt": (String) Unit (e.g., "Cái", "Bộ", "M2"). Default to "Cái" if not found.
- "sl": (Number) Quantity. Default to 1.
- "dg": (Number) Unit price (Đơn giá) exactly as listed in the image. Remove commas/dots, return raw integer (e.g. 15000000).
- "tt": (Number) Total price (Thành tiền) exactly as listed in the image. Remove commas/dots, return raw integer.
- "ref": (String) Use Google Search to find the current LOWEST market retail price in Vietnam for this exact brand and model (e.g. at Dien May Xanh, Shopee, Lazada, Tiki). Return as plain string number, e.g. "14500000". If unknown, use "0".
- "mmax": (Number) The exact same value as "ref", but as a Number. If unknown, use 0.
- "note": (String) A short Vietnamese comment evaluating if the quoted price (dg) is expensive, cheap, or reasonable compared to the market price (mmax).

CRITICAL RULES:
1. "dg" and "tt" MUST be exact numbers extracted from the image. Do NOT guess them. Look for columns like "Đơn giá", "Giá", "Thành tiền".
2. "mmax" MUST be your own knowledge-based estimation, NOT extracted from the image.
3. You must escape any double quotes inside strings (e.g. "Ống 1/2\\""). Make sure the JSON is perfectly well-formed.` },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      tools: [
        {
          google_search: {}
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8000,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
