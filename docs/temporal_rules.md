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