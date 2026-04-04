// DOM Elements
const form = document.getElementById('userLocation');
const submitBtn = document.getElementById('submitBtn');
const geoBtn = document.getElementById('geoBtn');
const destinationInput = document.getElementById('destination');
const errorMessage = document.getElementById('errorMessage');
const weatherSection = document.getElementById('weatherSection');
const suggestionsSection = document.getElementById('suggestionsSection');

// Event Listeners
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = destinationInput.value.trim();
    if (input) {
        await handleLocationSearch(input);
    }
});

geoBtn.addEventListener('click', async () => {
    hideError();
    geoBtn.disabled = true;
    geoBtn.textContent = 'Getting location...';
    
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser. Please enter a location manually.');
        geoBtn.disabled = false;
        geoBtn.textContent = 'Use Current Location';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await handleGeolocation(latitude, longitude);
            geoBtn.disabled = false;
            geoBtn.textContent = 'Use Current Location';
        },
        (error) => {
            let errorMsg = 'Unable to access your location. ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permission was denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'An error occurred.';
            }
            showError(errorMsg + ' Please enter a location manually.');
            geoBtn.disabled = false;
            geoBtn.textContent = 'Use Current Location';
        }
    );
});

// Fetch weather data using city name
async function handleLocationSearch(city) {
    hideError();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    
    try {
        const weather = await getWeather(city);
        await displayWeatherAndSuggestions(city, weather);
    } catch (error) {
        showError('Could not find weather data for that location. Please try another city.');
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Search Location';
    }
}

// Reverse geocode coordinates to get city name, then fetch weather
async function handleGeolocation(latitude, longitude) {
    hideError();
    
    try {
        // Reverse geocode: coordinates to city name
        const geoResponse = await fetch(`https://cse2004.com/api/geocode?latlng=${latitude},${longitude}`);
        if (!geoResponse.ok) throw new Error('Geocode failed');
        const geoData = await geoResponse.json();
        
        const city = geoData.results[0]?.formatted_address || `${latitude}, ${longitude}`;
        destinationInput.value = city;
        
        // Fetch weather for the coordinates
        const weather = await getWeatherByCoords(latitude, longitude);
        await displayWeatherAndSuggestions(city, weather);
    } catch (error) {
        showError('Unable to get location details. Please try entering a city manually.');
        console.error('Geolocation error:', error);
    }
}

// Fetch weather by city name (geocode + weather)
async function getWeather(city) {
    const geoResponse = await fetch(`https://cse2004.com/api/geocode?address=${city}`);
    if (!geoResponse.ok) throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
    }
    
    const lat = geoData.results[0].geometry.location.lat;
    const lng = geoData.results[0].geometry.location.lng;
    
    return getWeatherByCoords(lat, lng);
}

// Fetch weather by coordinates
async function getWeatherByCoords(lat, lng) {
    const weatherResponse = await fetch(`https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`);
    if (!weatherResponse.ok) throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
    return await weatherResponse.json();
}

// Display weather data and fetch suggestions
async function displayWeatherAndSuggestions(city, weather) {
    const tempF = weather.temperature.degrees;
    const tempC = ((tempF - 32) * 5 / 9).toFixed(1);
    const uv = weather.uvIndex;
    const weatherCond = weather.weatherCondition.description.text;
    const wind = weather.wind.speed.value;
    
    // Update UI with weather data
    document.getElementById('temp').textContent = `${tempF}°F / ${tempC}°C`;
    document.getElementById('uv').textContent = uv;
    document.getElementById('weather').textContent = weatherCond;
    document.getElementById('wind').textContent = `${wind} mph`;
    
    weatherSection.style.display = 'block';
    suggestionsSection.style.display = 'block';
    
    // Scroll to results
    weatherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Fetch activity suggestions
    await getActivitySuggestions(city, tempF, uv, weatherCond, wind);
}

// Get activity suggestions from AI
async function getActivitySuggestions(city, tempF, uv, weatherCond, wind) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.textContent = 'Loading suggestions...';
    
    try {
        const prompt = `List 5 things I can do at ${city} today based on the weather information: Temperature ${tempF}°F, UV Index ${uv}, Condition: ${weatherCond}, Wind: ${wind} mph. Format as a numbered list.`;
        
        const response = await fetch('https://cse2004.com/api/openai/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mjxi7hoe9t4q'
            },
            body: JSON.stringify({
                input: prompt
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get suggestions');
        }
        
        const data = await response.json();
        suggestionsDiv.textContent = data.text || 'No suggestions available';
    } catch (error) {
        console.error('Error getting suggestions:', error);
        suggestionsDiv.innerHTML = '<em>Unable to load suggestions. Try again or explore activities in the area based on the weather conditions above.</em>';
    }
}

// Helper functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
}