"""
Temporal Logic Engine for VitalPilot
Evaluates rolling time-window trends, sustained clinical threshold alerts, 
and behavioral streaks based on user telemetry logs.
"""

from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta


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

def evaluate_persistent_condition(
    logs: List[Dict[str, Any]],
    condition: Callable[[Dict[str, Any]], bool],
    window_days: int = 30,
    min_days_required: int = 12,
    reference_date: datetime | None = None
) -> Dict[str, Any]:
    """
    Evaluates whether a condition has occurred on a minimum number of
    distinct calendar days within a rolling time window.

    Parameters
    ----------
    logs : list[dict]
        Collection of metric records. Each record must contain a
        'timestamp' field.

    condition : Callable
        Function that accepts a log and returns True if the log meets
        the condition being evaluated.

    window_days : int
        Size of the rolling evaluation window.

    min_days_required : int
        Minimum number of distinct days required to trigger.

    reference_date : datetime, optional
        Date/time used as "today". Defaults to datetime.now().

    Returns
    -------
    dict
    """
    if reference_date is None:
        reference_date = datetime.now()

    cutoff = reference_date - timedelta(days=window_days)

    matching_days = set()

    for log in logs:

        timestamp = log.get("timestamp")

        if timestamp is None:
            continue

        if timestamp < cutoff:
            continue

        if condition(log):
            matching_days.add(timestamp.date())

    return {
        "triggered": len(matching_days) >= min_days_required,
        "matching_days_count": len(matching_days),
        "window_days": window_days,
        "required_days": min_days_required
    }