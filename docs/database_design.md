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

### UserHealthProfiles
*Extends the core identity table to isolate baseline physiological and demographic characteristics. This data provides the core benchmarks required for dynamic clinical matrix calculations (such as age-gated alerts or sex-specific thresholds) while keeping authentication records separated from medical data.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `profile_id` | `SERIAL` | `PRIMARY KEY` | Unique internal identifier for the health profile |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL`, `UNIQUE` | References `Users.user_id` (`ON DELETE CASCADE`) |
| `baseline_height_in` | `DECIMAL(4, 2)` | `NOT NULL` | The baseline height captured during onboarding to pre-populate logs |
| `sex` | `ENUM('Female', 'Male')` | `NOT NULL` | The user's sex for clinical baselines |
| `date_of_birth` | `DATE` | `NOT NULL` | The user's birthdate which is used to dynamically calculate age if needed |
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Tracks the last modification of physical profile characteristics. |

### MetricGoals
*Tracks the user's active goal configurations. This table is optimized for low-latency, real-time transactional lookups by the conditional validation engine.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `goal_id` | `INT` | `PRIMARY KEY` | Unique identifier for the metric goal |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `metric_type` | `ENUM('Sleep', 'Steps', 'Water', 'Peak Flow')` | `NOT NULL` | Health metric associated with the goal |
| `goal_value` | `DECIMAl(6, 2)` | `NOT NULL` | Current active goal target | 
| `updated_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Tracks when the user last modified this specific goal threshold |

### MetricGoalsHistory
*Serves as an append-only table that captures historical goal changes over time enabling retroactive temporal health analytics and trend reporting.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `history_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the audit record |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `metric_type` | `ENUM('Sleep', 'Steps', 'Water', 'Peak Flow')` | `NOT NULL` | The metric tracked |
| `old_value` | `DECIMAL(6, 2)` | `NOT NULL` | The goal value before the modification |
| `valid_from` | `TIMESTAMP` | `NOT NULL` | The timestamp when the goal originally became active |
| `valid_to` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The timestamp when this goal was replaced or deactivated |

### ClinicalThresholds
Stores static, institutional health guidelines. This table uses a single row per constraint boundary to eliminate null values completely, maximize schema scalability, and enforce strict state boundaries through custom enumerations.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `threshold_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for the specific clinical rule |
| `metric_type` | `ENUM('BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BLOOD_OXYGEN', 'WATER_INTAKE', 'PHYSICAL_ACTIVITY')` | `NOT NULL` | The high-level tracking module being evaluated |
| `sub_metric` | `ENUM('SYSTOLIC', 'DIASTOLIC', 'FASTING', 'UNIVERSAL', 'FEMALE', 'MALE')` | `NOT NULL` | The specific metric component or demographic breakdown being isolated |
| `classification` | `VARCHAR(50)` | `NOT NULL` | The clinical tier label (e.g., `'Hypoglycemia'`, `'Stage 1 Hypertension'`) |
| `min_value` | `DECIMAL(6,2)` | `NOT NULL` | The lower inclusive boundary for this specific rule (use `-999.99` if no lower limit exists) |
| `max_value` | `DECIMAL(6,2)` | `NOT NULL` | The upper exclusive boundary for this specific rule (use `999.99` if no upper limit exists) |
| `alert_state` | `ENUM('LOG_SUCCESS_AND_BANNER', 'LOG_WARNING_AND_BANNER', 'LOG_CRITICAL_AND_BANNER', 'DISPLAY_GOAL_NOTICE')` | `NOT NULL` | The exact UI and log state flag dispatched by the validation engine |
| `alert_message` | `TEXT` | `NOT NULL` | The clinical feedback string displayed directly to the end-user. |

### BloodGlucose
*Stores chronological, time-series entries of user fasting blood glucose measurements. All records assume a baseline 8-hour fast to facilitate standardized evaluation against the American Diabetes Association diagnostic criteria.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific blood glucose log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `glucose_mgdl` | `INT` | `NOT NULL` | The fasting blood glucose reading measured in mg/dL |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the reading was taken | 

### BloodOxygenSaturation
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific blood oxygen saturation log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `spO2_percentage` | `INT` | `NOT NULL` | The blood oxygen saturation percentage |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the reading was taken |

### BloodPressure
*Stores chronological, time-series biometric entries for tracking blood pressure. Captures both systolic and diastolic metrics within a single record to facilitate paired clinical threshold evaluations.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific blood pressure log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` | 
| `systolic_mmhg` | `INT` | `NOT NULL` | The top number representing arterial pressure during heartbeats |
| `diastolic_mmhg` | `INT` | `NOT NULL` | The bottom number representing arterial pressure between heartbeats |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the reading was taken | 

### BodyMassIndex
*Stores chronological, time-series entries of user weight metrics to track and compute Body Mass Index over time.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific weight/BMI log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `weight_lbs` | `DECIMAL(5, 2)` | `NOT NULL` | The user's logged weight in pounds |
| `bmi_value` | `DECIMAL(4, 1)` | `NOT NULL` | Calculated BMI value using the user's recorded height and weight at the time of the weight entry |
| `recorded_at` | `TIMESTAMP` | `NOT NULL` | The precise date and time the BMI was calculated and recorded |

### PeakFlowRate
*Stores chronological, time-series entries of user Peak Expiratory Flow (PEF) measurements. These records capture lung function readings in Liters per Minute along with their calculated percentage relative to the user's personal baseline to evaluate asthma action plan zones.
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific steps log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `flow_rate_lmin` | `INT` | `NOT NULL` | The raw peak expiratory flow rate measured in Liters per Minute (L/min) |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the reading was taken | 

### PhysicalActivity
*Stores chronological, time-series entries of user physical activity measured via daily step counts. These logs allow for real-time summation to evaluate daily progress against user-configured targets and clinical activity benchmarks.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific steps log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `steps_taken` | `INT` | `NOT NULL` | The number of steps taken |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the step count was logged | 

### Sleep
*Stores chronological, time-series entries of user sleep durations. This table captures total sleep time as a direct numerical value, optimizing the schema for manual duration entry and immediate goal evaluation.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific sleep log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `duration_hours` | `DECIMAL(4, 2)` | `NOT NULL` | The total hours of sleep |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the sleep durantion was logged | 

### WaterIntake
*Stores chronological, time-series entries of user water consumption. These records enable real-time aggregation of daily fluid intake to evaluate against user-defined goals and sex baselines.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for this specific water intake log |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `amount_cups` |  `DECIMAL(4, 2)` | `NOT NULL` | The volume of water consumed measured in cups |
| `logged_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time the water intake was logged | 

### ChatMessages
*Stores the complete chronological history of conversations between users and the AI assistant. A single table manages the bidirectional dialogue loop by categorizing the origin of each record via sender roles, ensuring identical storage throughput for both user inputs and assistant replies.*
| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `message_id` | `SERIAL` | `PRIMARY KEY` | Unique identifier for every single chat message. |
| `user_id` | `INT` | `FOREIGN KEY`, `NOT NULL` | References `Users.user_id` with `ON DELETE CASCADE` |
| `sender_role` | `ENUM('user', 'AI')` | `NOT NULL` | Identifies the author of the message string to structure conversation context arrays cleanly. |
| `message_content` | `TEXT` | `NOT NULL` | The raw text content of the message prompt or completion string. |
| `sent_at` | `TIMESTAMP` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | The precise date and time when the chat message transaction concluded |

## 3. Design Logic & Architectural Decisions
### `Users`
* **Purpose:** Stores a user's credentials and authentication data required for system access.
* **Design Decision:** Medical, health, and metric data are isolated from this relation. This ensures that authentication processes are completely separated from sensitive health data. The `date_created` parameter establishes a baseline for the user's account lifecycle.

### `UserHealthProfiles`
* **Purpose:** Stores health-specific attributes required for clinical calculations such as sex for daily water intake goals and height for BMI.
* **Design Decision:** By keeping health attributes separate from the `Users` table, the system avoids mixing authentication records with clinical data if not needed. While height is usually a stable physical trait for adults, the schema uses an `updated_at` parameter