import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  // This check is for development; in the target environment, the key is assumed to be set.
  console.warn("API_KEY environment variable not found. Weather feature will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "DISABLED" });

export const fetchWeather = async (
  lat,
  lon
) => {
  if (!process.env.API_KEY || process.env.API_KEY === "DISABLED") {
    throw new Error("API key is not configured.");
  }

  const prompt = `
    Based on a Google Search for the current weather at latitude ${lat} and longitude ${lon},
    provide the following information in a single, valid JSON object.
    
    The JSON object must have these exact keys and value types:
    - "city": string (e.g., "Mountain View")
    - "temperature": number (in Celsius)
    - "condition": string (e.g., "Clear", "Partly Cloudy", "Rain")
    - "humidity": number (percentage, e.g., 65)
    - "windSpeed": number (in km/h)
    - "icon": string (a single emoji representing the weather, e.g., "☀️", "☁️", "🌧️")

    IMPORTANT: Your entire response must be ONLY the raw JSON object, without any surrounding text, explanations, or markdown formatting like \`\`\`json ... \`\`\`.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    // First, try to parse directly. If it fails, try cleaning.
    let weatherData;
    try {
        weatherData = JSON.parse(text);
    } catch {
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        weatherData = JSON.parse(cleanedText);
    }
    

    // Validate essential fields
    if (!weatherData.city || typeof weatherData.temperature !== 'number') {
        throw new Error('Parsed weather data is missing essential fields.');
    }

    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []);

    return { weatherData, sources };
  } catch (error) {
    console.error("Error fetching or parsing weather data:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse weather data from the AI. The response was not valid JSON.");
    }
    throw new Error("Could not fetch weather data. Please try again later.");
  }
};

export const fetchWeatherByCity = async (
  city
) => {
  if (!process.env.API_KEY || process.env.API_KEY === "DISABLED") {
    throw new Error("API key is not configured.");
  }

  const prompt = `
    Based on a Google Search for the current weather in "${city}",
    provide the following information in a single, valid JSON object.
    
    The JSON object must have these exact keys and value types:
    - "city": string (The official name of the city found, e.g., "Chennai")
    - "temperature": number (in Celsius)
    - "condition": string (e.g., "Clear", "Partly Cloudy", "Rain")
    - "humidity": number (percentage, e.g., 65)
    - "windSpeed": number (in km/h)
    - "icon": string (a single emoji representing the weather, e.g., "☀️", "☁️", "🌧️")

    IMPORTANT: Your entire response must be ONLY the raw JSON object, without any surrounding text, explanations, or markdown formatting like \`\`\`json ... \`\`\`.
    If you cannot find the city, your entire response must be ONLY the following JSON object: {"error": "City not found"}.
  `;

  try {
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
    } catch {
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedJson = JSON.parse(cleanedText);
    }

    if (parsedJson.error) {
        throw new Error(parsedJson.error);
    }

    const weatherData = parsedJson;

    // Validate essential fields
    if (!weatherData.city || typeof weatherData.temperature !== 'number') {
        throw new Error('Parsed weather data is missing essential fields.');
    }

    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []);

    return { weatherData, sources };
  } catch (error) {
    console.error(`Error fetching weather for city "${city}":`, error);
    if (error instanceof SyntaxError) {
      throw new Error("Failed to parse weather data from the AI. The response was not valid JSON.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`Could not fetch weather data for "${city}".`);
  }
};
