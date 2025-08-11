// netlify/functions/weather.js

import fetch from 'node-fetch';

export async function handler(event) {
  try {
    const API_KEY = process.env.WEATHER_API_KEY; // set in Netlify environment variables
    const { lat, lon, city } = event.queryStringParameters;

    let url;
    if (lat && lon) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    } else if (city) {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing location parameters' }),
      };
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
