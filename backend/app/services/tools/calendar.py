"""
Calendar Tool
Provides the current date and time to the AI.
"""

from langchain.tools import tool
from datetime import datetime
import pytz

@tool
def get_current_datetime(timezone: str = "UTC") -> str:
    """
    Get the current date and time.
    Provide the timezone as a string (e.g., 'America/New_York', 'UTC').
    If no timezone is specified, defaults to UTC.
    """
    try:
        tz = pytz.timezone(timezone)
        now = datetime.now(tz)
        return now.strftime("%Y-%m-%d %H:%M:%S %Z")
    except Exception as e:
        return f"Error retrieving time for timezone {timezone}: {str(e)}"
