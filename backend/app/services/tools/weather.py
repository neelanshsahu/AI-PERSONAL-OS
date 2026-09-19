"""
Weather Tool
Fetches current weather for a location using the free Open-Meteo API.
"""

from langchain.tools import tool
import requests

@tool
def get_weather(latitude: float, longitude: float) -> str:
    """
    Get the current weather for a specific latitude and longitude.
    Always use a geocoding tool or external knowledge to find the lat/long first if you only have a city name.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current_weather=true"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        current = data.get("current_weather", {})
        
        if not current:
            return "Weather data not available for these coordinates."
            
        temp = current.get("temperature")
        windspeed = current.get("windspeed")
        
        return f"Current temperature is {temp}°C with wind speed of {windspeed} km/h."
    except Exception as e:
        return f"Failed to retrieve weather: {str(e)}"
