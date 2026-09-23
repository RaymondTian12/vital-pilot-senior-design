# Temporal Rules & Time-Series Analytics Specification

This document defines the rolling time-window algorithms, sustained clinical threshold alerts, and trend evaluation logic for VitalPilot.

---

## Behavioral Goal & Streak Specification

### 1. Target Tracking Metrics (User-Configurable)
Daily streak progress is evaluated against the user's custom daily goals configured in their profile settings:

* **Sleep Duration:** Daily goal set by user (e.g., target: $N$ hours/day).
* **Physical Activity:** Daily goal set by user (e.g., target: $N$ steps/day).
* **Water Intake:** Daily goal set by user (e.g., target: $N$ fl oz/day).

---

### 2. Daily Completion & Streak Logic
* **Daily Goal Criteria:** A calendar day counts as completed for a metric if logged intake/activity meets or exceeds the user's configured target between 00:00:00 and 23:59:59 local time.
* **Continuous Streak Calculation:**
  * If the user's configured goal is met today and yesterday was completed, `current_streak` increments by `+1`.
  * If the user's configured goal is met today and yesterday was missed, `current_streak` resets to `1`.
* **Longest Streak:** If `current_streak` exceeds `longest_streak`, `longest_streak` updates to match `current_streak`.

---

### 3. Milestone Badges

| Badge ID | Badge Name | Unlock Requirement | Description |
| :--- | :--- | :--- | :--- |
| `BADGE-STREAK-07` | **7-Day Consistency** | `current_streak >= 7` | Met custom sleep, steps, or water goals for 7 consecutive days. |
| `BADGE-STREAK-30` | **30-Day Sentinel** | `current_streak >= 30` | Maintained custom target tracking for 30 consecutive days. |
| `BADGE-STREAK-90` | **Quarterly Master** | `current_streak >= 90` | Maintained custom target tracking for 90 consecutive days. |
| `BADGE-STREAK-MAX` | **Personal Best** | `current_streak > previous_longest` | Broke all-time personal streak record. |

## Clinical Sustained Threshold Rules
Defines the multi-day sliding window algorithms and sustained alert evaluation logic executed against historical biometric streams.

### 1. Multi-Day Elevation Window Logic
Evaluates chronological vital records to detect persistent out-of-bounds states requiring provider review or escalation:
* **Consecutive Elevation Rule:**
* If a biometric metric remains within an elevated/stage boundary (e.g., Blood Pressure $\ge \text{Stage 1}$) for $k \ge 3$ consecutive logged days, trigger `ALERT_SUSTAINED_ELEVATION`.
  * If the metric reaches a critical emergency threshold at any point, immediately escalate to `ALERT_CRITICAL_IMMEDIATE` bypassing multi-day evaluation.
* **Ratio-Based Rolling Window Rule:**
  * Evaluates the last $W = 30$ calendar days.
  * If $X \ge 5$ total days within the 30-day window fall into an elevated classification tier, flag the record with `TREND_CHRONIC_ELEVATION`. 

### 2. Time-Series Aggregation & Gap Handling
* **Rolling Moving Averages:**
  * **7-Day Simple Moving Average:** The unweighted mean of all recorded daily values over the most recent 7-day calendar window.
  * **30-Day Simple Moving Average:** The unweighted mean of all recorded daily values over the most recent 30-day calendar window.
* **Missing Data & Unlogged Days:**
  * Days without logs are omitted from moving average denominators rather than filled with zero values to prevent mathematical distortion.
  * For frontend chart visualization, missing points are linearly interpolated across continuous time axes without synthetic database insertion.

### 3. Trend Direction & AI Context Pipeline
* **Trend Velocity Classification:**
  * `RAPIDLY_INCREASING`: Daily rate of change exceeds the defined velocity threshold over a 7-day window.
  * `STEADY_ELEVATION`: Consistently positive rate of change over a 14 to 30-day window without individual critical spike events.
  * `STABLE`: Metric variation stays within plus or minus 5 percent of the baseline average.
  * `IMPROVING`: Continuous progression toward the target baseline range.
* **AI Summary Integration:**
  * Evaluated trend classifications, active alert flags, and rolling averages are directly supplied to the LLM system prompt context builder for automated clinical progress summary generation.