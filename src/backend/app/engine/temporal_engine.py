"""
Temporal Logic Engine for VitalPilot
Evaluates rolling time-window trends, sustained clinical threshold alerts, 
and behavioral streaks based on user telemetry logs.
"""

from typing import List, Dict, Any, Optional, Set, Callable, Tuple
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

def evaluate_consecutive_condition(
    logs: List[Dict[str, Any]],
    condition: Callable[[Dict[str, Any]], bool],
    k_consecutive_days: int = 3,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Evaluates whether a clinical condition has persisted across k consecutive logged days.
    
    :param logs: Collection of telemetry records (each must contain 'timestamp').
    :param condition: Callable returning True if record meets the target condition.
    :param k_consecutive_days: Required number of consecutive days (default: 3).
    :param reference_date: Evaluation anchor date (defaults to date.today()).
    :return: Dict containing triggered status and consecutive day count.
    """
    if reference_date is None:
        reference_date = date.today()

    # Aggregate logs by calendar date (takes the latest or worst reading per day)
    daily_eval: Dict[date, bool] = {}
    for log in logs:
        ts = log.get("timestamp")
        if ts is None:
            continue
        log_date = ts.date() if isinstance(ts, datetime) else ts
        # If any log on that day meets the condition, mark day as matching
        if condition(log):
            daily_eval[log_date] = True
        elif log_date not in daily_eval:
            daily_eval[log_date] = False

    # Count backward from reference date
    consecutive_count = 0
    curr_date = reference_date

    # If reference date has no log, check yesterday
    if curr_date not in daily_eval:
        curr_date -= timedelta(days=1)

    while curr_date in daily_eval and daily_eval[curr_date]:
        consecutive_count += 1
        curr_date -= timedelta(days=1)

    return {
        "triggered": consecutive_count >= k_consecutive_days,
        "consecutive_days": consecutive_count,
        "required_consecutive_days": k_consecutive_days
    }


def evaluate_clinical_reset(
    logs: List[Dict[str, Any]],
    is_normal_condition: Callable[[Dict[str, Any]], bool],
    required_normal_days: int = 3,
    reference_date: Optional[date] = None
) -> bool:
    """
    Evaluates whether an active alert state can be cleared based on m consecutive
    days of logs returning within normal clinical baseline ranges.
    """
    result = evaluate_consecutive_condition(
        logs=logs,
        condition=is_normal_condition,
        k_consecutive_days=required_normal_days,
        reference_date=reference_date
    )
    return result["triggered"]


def calculate_rolling_averages(
    logs: List[Dict[str, Any]],
    value_key: str,
    window_days: int = 7,
    reference_date: Optional[date] = None
) -> Optional[float]:
    """
    Calculates unweighted Simple Moving Average (SMA) over a sliding calendar window.
    Omit unlogged days from denominator to prevent mathematical distortion.
    
    :param logs: Telemetry logs with 'timestamp' and value_key.
    :param value_key: The numeric metric key (e.g., 'systolic', 'glucose_value').
    :param window_days: Size of rolling calendar window (e.g., 7 or 30 days).
    :param reference_date: Evaluation date.
    :return: Moving average float or None if no valid logs exist in window.
    """
    if reference_date is None:
        reference_date = date.today()

    cutoff_date = reference_date - timedelta(days=window_days)
    valid_values = []

    for log in logs:
        ts = log.get("timestamp")
        if ts is None:
            continue
        log_date = ts.date() if isinstance(ts, datetime) else ts

        if cutoff_date < log_date <= reference_date:
            val = log.get(value_key)
            if val is not None and isinstance(val, (int, float)):
                valid_values.append(val)

    if not valid_values:
        return None

    return round(sum(valid_values) / len(valid_values), 2)


def classify_trend_velocity(
    logs: List[Dict[str, Any]],
    value_key: str,
    baseline_avg: float,
    velocity_threshold: float,
    window_days: int = 7,
    reference_date: Optional[date] = None
) -> str:
    """
    Classifies trend direction and velocity:
    - RAPIDLY_INCREASING: Metric slope exceeds velocity threshold over window.
    - STEADY_ELEVATION: Consistently positive slope over extended window without spike.
    - STABLE: Metric variation remains within +/- 5% of baseline average.
    - IMPROVING: Continuous progression toward baseline.
    """
    if reference_date is None:
        reference_date = date.today()

    cutoff = reference_date - timedelta(days=window_days)
    
    # Extract chronological daily values
    dated_values: List[Tuple[date, float]] = []
    for log in logs:
        ts = log.get("timestamp")
        if ts is None:
            continue
        log_date = ts.date() if isinstance(ts, datetime) else ts
        if cutoff < log_date <= reference_date:
            val = log.get(value_key)
            if val is not None and isinstance(val, (int, float)):
                dated_values.append((log_date, float(val)))

    dated_values.sort(key=lambda x: x[0])

    if len(dated_values) < 2:
        return "INSUFFICIENT_DATA"

    # Compute daily rate of change (slope)
    total_delta = dated_values[-1][1] - dated_values[0][1]
    days_span = max((dated_values[-1][0] - dated_values[0][0]).days, 1)
    daily_slope = total_delta / days_span

    recent_avg = sum(v for _, v in dated_values) / len(dated_values)

    if daily_slope > velocity_threshold:
        return "RAPIDLY_INCREASING"
    
    # Check if stable within +/- 5%
    lower_bound = baseline_avg * 0.95
    upper_bound = baseline_avg * 1.05
    if lower_bound <= recent_avg <= upper_bound:
        return "STABLE"

    if daily_slope > 0 and recent_avg > baseline_avg:
        return "STEADY_ELEVATION"

    if (daily_slope < 0 and recent_avg > baseline_avg) or (daily_slope > 0 and recent_avg < baseline_avg):
        return "IMPROVING"

    return "STABLE"