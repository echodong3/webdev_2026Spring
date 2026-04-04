const form = document.getElementById('userLocation');
const submitBtn = document.getElementById('submitBtn');
const geoBtn = document.getElementById('geoBtn');
const destinationInput = document.getElementById('destination');
const errorMessage = document.getElementById('errorMessage');
const weatherSection = document.getElementById('weatherSection');
const suggestionsSection = document.getElementById('suggestionsSection');
const locationLabel = document.getElementById('locationLabel');
const suggestionsDiv = document.getElementById('suggestions');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const input = destinationInput.value.trim();
    if (!input) return;

    await handleLocationSearch(input);
});

geoBtn.addEventListener('click', async () => {
    hideError();
    setGeoButtonLoading(true);

    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser. Please enter a location manually.');
        setGeoButtonLoading(false);
        return;
    }

    if (!window.isSecureContext) {
        showError('Location access requires a secure page (https or localhost). Please enter a location manually.');
        setGeoButtonLoading(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                await handleGeolocation(latitude, longitude);
            } finally {
                setGeoButtonLoading(false);
            }
        },
        (error) => {
            let errorMsg = 'Unable to access your location. ';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permission was denied.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'An unexpected error occurred.';
            }

            showError(`${errorMsg} Please enter a location manually.`);
            setGeoButtonLoading(false);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
});

async function handleLocationSearch(city) {
    hideError();
    hideResults();
    setSubmitButtonLoading(true);

    try {
        const weather = await getWeather(city);
        await displayWeatherAndSuggestions(city, weather);
    } catch (error) {
        console.error('Location search error:', error);
        showError('Could not find weather data for that location. Please try another city.');
    } finally {
        setSubmitButtonLoading(false);
    }
}

async function handleGeolocation(latitude, longitude) {
    hideError();
    hideResults();

    try {
        const geoResponse = await fetch(
            `https://cse2004.com/api/geocode?latlng=${latitude},${longitude}`
        );

        if (!geoResponse.ok) {
            throw new Error(`Geocoding failed with status ${geoResponse.status}`);
        }

        const geoData = await geoResponse.json();
        const city = geoData.results?.[0]?.formatted_address || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

        destinationInput.value = city;

        const weather = await getWeatherByCoords(latitude, longitude);
        await displayWeatherAndSuggestions(city, weather);
    } catch (error) {
        console.error('Geolocation error:', error);
        showError('Unable to get location details. Please try entering a city manually.');
    }
}

async function getWeather(city) {
    const geoResponse = await fetch(
        `https://cse2004.com/api/geocode?address=${encodeURIComponent(city)}`
    );

    if (!geoResponse.ok) {
        throw new Error(`Geocoding failed: ${geoResponse.statusText}`);
    }

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
    }

    const lat = geoData.results[0].geometry.location.lat;
    const lng = geoData.results[0].geometry.location.lng;

    return getWeatherByCoords(lat, lng);
}

async function getWeatherByCoords(lat, lng) {
    const weatherResponse = await fetch(
        `https://cse2004.com/api/weather?latitude=${lat}&longitude=${lng}`
    );

    if (!weatherResponse.ok) {
        throw new Error(`Weather API failed: ${weatherResponse.statusText}`);
    }

    return weatherResponse.json();
}

async function displayWeatherAndSuggestions(city, weather) {
    const tempF = weather?.temperature?.degrees ?? 'N/A';
    const tempC = typeof tempF === 'number'
        ? ((tempF - 32) * 5 / 9).toFixed(1)
        : 'N/A';
    const uv = weather?.uvIndex ?? 'N/A';
    const weatherCond = weather?.weatherCondition?.description?.text ?? 'Unavailable';
    const wind = weather?.wind?.speed?.value ?? 'N/A';

    locationLabel.textContent = `Showing results for ${city}`;
    document.getElementById('temp').textContent =
        typeof tempF === 'number' ? `${tempF}°F / ${tempC}°C` : 'N/A';
    document.getElementById('uv').textContent = uv;
    document.getElementById('weather').textContent = weatherCond;
    document.getElementById('wind').textContent =
        typeof wind === 'number' ? `${wind} mph` : 'N/A';
    tripTip.textContent = generateTripTip(tempF, uv, weatherCond, wind);

    weatherSection.classList.remove('hidden');
    suggestionsSection.classList.remove('hidden');

    suggestionsDiv.textContent = 'Loading suggestions...';

    weatherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await getActivitySuggestions(city, tempF, uv, weatherCond, wind);
}

async function getActivitySuggestions(city, tempF, uv, weatherCond, wind) {
    const prompt = `
You are helping a traveler plan their day.
Give exactly 5 practical and specific activity suggestions for ${city} based on this weather:
- Temperature: ${tempF}°F
- UV Index: ${uv}
- Condition: ${weatherCond}
- Wind: ${wind} mph

Requirements:
- Make the ideas realistic and varied
- Mention weather-aware advice when relevant
- Format as a numbered list
`.trim();

    try {
        const response = await fetch('https://cse2004.com/api/openai/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer mjxi7hoe9t4q'
            },
            body: JSON.stringify({ input: prompt })
        });

        if (!response.ok) {
            let message = 'Failed to get suggestions.';
            try {
                const errorData = await response.json();
                message = errorData.message || message;
            } catch {
                // Ignore JSON parse failure
            }
            throw new Error(message);
        }

        const data = await response.json();
        suggestionsDiv.textContent = data.text?.trim() || 'No suggestions available.';
    } catch (error) {
        console.error('Suggestion error:', error);
        suggestionsDiv.textContent =
            'Unable to load AI suggestions right now. You can still use the weather information above to plan your day.';
    }
}
const tripTip = document.getElementById('tripTip');

function generateTripTip(tempF, uv, weatherCond, wind) {
    if (weatherCond.toLowerCase().includes('rain')) {
        return 'Tip: Bring an umbrella and plan at least one indoor option.';
    }
    if (typeof uv === 'number' && uv >= 7) {
        return 'Tip: Strong sun today — sunscreen and shade are a good idea.';
    }
    if (typeof wind === 'number' && wind >= 20) {
        return 'Tip: It is pretty windy, so outdoor dining or loose layers may be less comfortable.';
    }
    if (typeof tempF === 'number' && tempF <= 45) {
        return 'Tip: Dress in layers if you plan to be outside for long.';
    }
    return 'Tip: Looks like a good day for flexible outdoor plans.';
}

function setSubmitButtonLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Loading...' : 'Search Location';
}

function setGeoButtonLoading(isLoading) {
    geoBtn.disabled = isLoading;
    geoBtn.textContent = isLoading ? 'Getting location...' : 'Use Current Location';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}

function hideResults() {
    weatherSection.classList.add('hidden');
    suggestionsSection.classList.add('hidden');
}