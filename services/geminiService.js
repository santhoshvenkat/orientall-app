const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown server error occurred.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const fetchWeather = async (lat, lon) => {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    return handleResponse(response);
};

export const fetchWeatherByCity = async (city) => {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await handleResponse(response);
    
    // The serverless function sends back { weatherData: { error: '...' } }
    if (data.weatherData && data.weatherData.error) {
        throw new Error(data.weatherData.error);
    }
    
    return data;
};
