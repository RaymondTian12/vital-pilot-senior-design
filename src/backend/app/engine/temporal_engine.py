"""
Temporal Logic Engine for VitalPilot
Evaluates rolling time-window trends, sustained clinical threshold alerts, 
and behavioral streaks based on user telemetry logs.
"""

from typing import List, Dict, Any, Set
from datetime import date, timedelta


def calculate_logging_streak(log_dates: Set[date], today: date = None) -> Dict[str, Any]:
    """
    Calculates current continuous daily logging streak and identifies badge unlocks.
    
    :param log_dates: Set of unique `date` objects when the user submitted a log.
    :param today: Current date (defaults to date.today()).
    :return: Dict containing current_streak, longest_streak, and unlocked_badges.
    """
    if today is None:
        today = date.today()

    current_streak = 0
    check_date = today

    # If user hasn't logged today yet, check if yesterday was part of an active streak
    if check_date not in log_dates:
        check_date = today - timedelta(days=1)

    # Count backward continuously
    while check_date in log_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Evaluate Badge Unlocks
    unlocked_badges = []
    if current_streak >= 7:
        unlocked_badges.append("BADGE-STREAK-07")
    if current_streak >= 30:
        unlocked_badges.append("BADGE-STREAK-30")
    if current_streak >= 90:
        unlocked_badges.append("BADGE-STREAK-90")

    return {
        "current_streak": current_streak,
        "unlocked_badges": unlocked_badges
    }