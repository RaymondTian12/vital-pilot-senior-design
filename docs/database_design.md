# Database Design

## 1. Overview
This document specifies the database schema design and relational architecture for VitalPilot. The data layer is designed around a modular, metric-driven framework optimized for high-throughput biometric logging. 

Rather than tightly coupling the database engine to static disease states, this architecture treats user inputs as pure, time-series data streams linked dynamically to customizable user profile configuration tables. This approach ensures maximum schema scalability, absolute data integrity via cascading rules, and full support for retrospective temporal analytics.

## 2. Tables
### Users
*Stores core authentication credentials and basic profile attributes required for system access and identity management.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `SERIAL`| `PRIMARY KEY` | Unique identifier for each user|
| `first_name` | `VARCHAR(50)` | `NOT NULL` | User's first name |
| `last_name` | `VARCHAR(50)` | `NOT NULL` | User's last name |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE`| User's email address used for login |
| `password_hash` | `VARCHAR(255)`| `NOT NULL` | Securely hashed password|
| `date_created` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Date and time the user account was created|

### MetricGoals
*Tracks the user's active goal configurations. This table is optimized for low-latency, real-time transactional lookups by the conditional validation engine.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `goal_id` | `INT` | `PRIMARY KEY` | Unique identifier for the metric goal |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `metric_type` | `ENUM('Sleep', 'Steps', 'Water', 'Peak Flow')` | `NOT NULL` | Health metric associated with the goal |
| `goal_value` | `NUMERIC(6, 2)` | `NOT NULL` | Current active goal target | 
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Tracks when the user last modified this specific goal threshold |

### MetricGoalsHistory
*Serves as an append-only table that captures historical goal changes over time enabling retroactive temporal health analytics and trend reporting.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `history_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the audit record |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `metric_type` | `ENUM('Sleep', 'Steps', 'Water', 'Peak Flow')` | `NOT NULL` | The metric tracked |
| `old_value` | `NUMERIC(6,2)` | `NOT NULL` | The goal value before the modification |
| `valid_from` | `TIMESTAMP` | `NOT NULL` | The timestamp when the goal originally became active |
| `valid_to` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The timestamp when this goal was replaced or deactivated |

### BloodPressure
*Stores chronological, time-series biometric entries for tracking blood pressure. Captures both systolic and diastolic metrics within a single record to facilitate paired clinical threshold evaluations.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific blood pressure log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` | 
| `systolic_mmhg` | `INT` | `NOT NULL` | The top number representing arterial pressure during heartbeats |
| `diastolic_mmhg` | `INT` | `NOT NULL` | The bottom number representing arterial pressure between heartbeats |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the reading was taken | 