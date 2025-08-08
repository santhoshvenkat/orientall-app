// netlify/functions/weather.js
const { GoogleGenAI } = require("@google/genai");

// Access the API key from environment variables
const { API_KEY } = process.env;

if (!API_KEY) {
  // This check prevents the function from running without a key.
  // The key must be set in the Netlify UI.
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getPrompt = (lat, lon, city) => {
    const location = city ? `in "${city}"` : `at latitude ${lat} and longitude ${lon}`;
    const cityNotFoundClause = city ? `If you cannot find the city, your entire response must be ONLY the following JSON object: {"error": "City not found"}.` : '';

    return `
    Based on a Google Search for the current weather ${location},
    provide the following information in a single, valid JSON object.
    
    The JSON object must have these exact keys and value types:
    - "city": string (The official name of the city found)
    - "temperature": number (in Celsius)
    - "condition": string (e.g., "Clear", "Partly Cloudy", "Rain")
    - "humidity": number (percentage, e.g., 65)
    - "windSpeed": number (in km/h)
    - "icon": string (a single emoji representing the weather, e.g., "☀️", "☁️", "🌧️")

    IMPORTANT: Your entire response must be ONLY the raw JSON object, without any surrounding text, explanations, or markdown formatting like \`\`\`json ... \`\`\`.
    ${cityNotFoundClause}
  `;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { lat, lon, city } = event.queryStringParameters;

        if (!((lat && lon) || city)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing location data: provide lat/lon or city." }),
            };
        }

        const prompt = getPrompt(lat, lon, city);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        let parsedJson;

        try {
            parsedJson = JSON.parse(text);
        } catch (e) {
            // Attempt to clean the response if parsing fails
            const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedJson = JSON.parse(cleanedText);
        }
        
        const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []);
        const finalResponse = { weatherData: parsedJson, sources };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalResponse),
        };
    } catch (error) {
        console.error("Error in weather function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch weather data from the AI service." }),
        };
    }
};
