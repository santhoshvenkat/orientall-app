import { GoogleGenAI } from "@google/genai";
import { WeatherData, GroundingSource } from '../types';

if (!process.env.API_KEY) {
  // This warning is for development; the app will show a more detailed error in the UI.
  console.warn("API_KEY environment variable not found.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "DISABLED" });

const createWeatherPrompt = (locationQuery: string) => `
    Based on a Google Search for the current weather ${locationQuery},
    provide the following information in a single, valid JSON object, and nothing else.
    If you cannot find the weather for the location, return a JSON object with an error message, for example: {"error": "Location not found"}.
    The successful JSON object must have these exact keys and value types:
    - "city": string (e.g., "Mountain View")
    - "temperature": number (in Celsius)
    - "condition": string (e.g., "Clear", "Partly Cloudy", "Rain")
    - "humidity": number (percentage, e.g., 65)
    - "windSpeed": number (in km/h)
    - "icon": string (a single emoji representing the weather, e.g., "☀️", "☁️", "🌧️")
  `;

const getWeatherData = async (prompt: string): Promise<{ weatherData: WeatherData; sources: GroundingSource[] }> => {
  // Enhanced check for API Key with a user-friendly error message.
  if (!process.env.API_KEY || process.env.API_KEY === 'DISABLED') {
    throw new Error("API Key is Missing: To use the weather feature, set your Google AI API key in your Netlify project. Go to Site configuration > Build & deploy > Environment variables, and add a variable with the key 'API_KEY'. You must redeploy your site after adding the key.");
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("The AI returned an empty response. This can happen if the model is temporarily unavailable. Please try again later.");
    }

    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
        console.error("Malformed AI Response:", cleanedText);
        throw new Error(`The AI returned data in an unexpected format. Please try a different location.`);
    }

    const parsedData: WeatherData & { error?: string } = JSON.parse(cleanedText);

    if (parsedData.error) {
        throw new Error(parsedData.error);
    }
    
    const weatherData = parsedData as WeatherData;

    if (!weatherData.city || typeof weatherData.temperature !== 'number') {
        throw new Error('The AI returned incomplete weather data. Please try again.');
    }

    const sources = (response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []) as GroundingSource[];

    return { weatherData, sources };
  } catch (error) {
    console.error("Error in getWeatherData:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID") || error.message.includes("permission_denied")) {
            throw new Error("Invalid API Key: The API key you provided is not valid. Please double-check the key in your Netlify Environment Variables. Make sure there are no extra spaces or typos.");
        }
        if (error.message.includes("Location not found")) {
            throw new Error("Sorry, we could not find weather data for that location. Please try a different city.");
        }
        if (error.message.match(/5\d\d/) || error.message.toLowerCase().includes('service unavailable')) {
            throw new Error("The weather service is temporarily unavailable. Please try again in a few minutes.");
        }
        // Pass through our specific, user-facing errors
        if (error.message.startsWith("API Key is Missing:") || error.message.startsWith("Invalid API Key:")) {
            throw error;
        }
        // Use the message from other errors thrown in the try block
        throw new Error(error.message);
    }
    throw new Error("An unexpected error occurred while fetching weather data.");
  }
};

export const fetchWeatherByCoords = async (
  lat: number,
  lon: number
): Promise<{ weatherData: WeatherData; sources: GroundingSource[] }> => {
  const prompt = createWeatherPrompt(`at latitude ${lat} and longitude ${lon}`);
  return getWeatherData(prompt);
};

export const fetchWeatherByCity = async (
  city: string
): Promise<{ weatherData: WeatherData; sources: GroundingSource[] }> => {
  const prompt = createWeatherPrompt(`for the city "${city}"`);
  return getWeatherData(prompt);
};
