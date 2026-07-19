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
| `metric_type` | `ENUM('BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BLOOD_OXYGEN', 'BODY_MASS_INDEX', 'PEAK_FLOW_RATE', 'WATER_INTAKE', 'PHYSICAL_ACTIVITY', 'SLEEP')` | `NOT NULL` | The high-level tracking module being evaluated. All specific system metrics are enumerated here |
| `sub_metric` | `ENUM('SYSTOLIC', 'DIASTOLIC', 'FASTING', 'POST_PRANDIAL', 'UNIVERSAL', 'FEMALE', 'MALE')` | `NOT NULL` | The specific metric component, clinical condition, or demographic breakdown being isolated |
| `classification` | `VARCHAR(50)` | `NOT NULL` | The clinical tier label or configuration flag (e.g., `'Hypoglycemia'`, `'Stage 1 Hypertension'`, `'RECOMMENDED_GOAL_FLOOR'`) |
| `min_value` | `DECIMAL(8,2)` | `NOT NULL` | The lower inclusive boundary for this specific rule. Use `-999.99` if no lower limit exists. For behavioral goal-validation metrics, (`PhysicalActivity`, `Sleep`, `WaterIntake`, this column holds the baseline recommended target floor. The `max_value` for these records is set to the upper open-ended placeholder (999.99) |
| `max_value` | `DECIMAL(8,2)` | `NOT NULL` | The upper exclusive boundary for this specific rule (use `99,999.99` if no upper limit exists) |
| `alert_state` | `ENUM('LOG_SUCCESS_AND_BANNER', 'LOG_WARNING_AND_BANNER', 'LOG_CRITICAL_AND_BANNER', 'DISPLAY_GOAL_NOTICE')` | `NOT NULL` | The exact UI and log state flag dispatched by the validation engine. Behavioral goal evaluation rows utilize `'DISPLAY_GOAL_NOTICE'` |
| `alert_message` | `TEXT` | `NOT NULL` | The clinical feedback or goal adjustment recommendation string displayed directly to the end-user |

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
| `spo2_percentage` | `INT` | `NOT NULL` | The blood oxygen saturation percentage |
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
* **Design Decision:** By keeping health attributes separate from the `Users` table, the system avoids mixing authentication records with clinical data if not needed. While height is usually a stable physical trait for adults, the schema uses an `updated_at` field

### `MetricGoals`
* **Purpose:** Stores a user's active goal configurations for hours of sleep, steps, water intake, and peak flow. All other metrics  tracked by VitalPilot will follow standards which will be stored in the `ClinicalThresholds` table.
* **Design Decision:** This data is isolated into a separate table rather than being appended to the `UserHealthProfiles` table to optimize transactional lookups. Because metric goals change independently of a user's identity, keeping these goals separate allows for frequent user adjustments and adding/removing new metrics in the future without altering the core profile schemas. The `updated_at` field tracks when the user last modified a specific goal which will allow this goal to be stored in the `MetricGoalsHistory` table whenever the user modifies or removes a goal.
* **Additional Constraints:** For sleep, steps, and water, the user will enter a daily goal that will be used to evaluate each daily entry. The backend will use the recommended institutional health guidelines researched in the Clinical Truth Matrix to determine if the user's goal is suboptimal. If so, the system will provide a recommended goal to the user and allow the user to enter a new goal if they choose. After the goal is established, all future evaluations will be made against this goal. The recommended guidelines researched for these three metrics will be stored in the `ClinicalThresholds` table but will not be used to evaluate inputted metrics.

### `MetricGoalsHistory`
* **Purpose:** Acts as an append-only table to store historical goal modifications over time. 
* **Design Decision:** To prevent rewriting a patient's medical tracking history, temporal analysis requires knowing what a user's target was on any given day and time. When a a goal is modified or removed, the previous threshold is appended here. The `updated_at` timestamp from `MetricGoals` becomes the historical record's `valid_from` boundary and the current date when the user is making this modification becomes the `valid_to` boundary. This allows the backend to evaluate and display past compliance (e.g. "You met your goal 25 of the last 30 days" against the exact targets active during those specific 30 days).

### `ClinicalThresholds`
* **Purpose:** Serves as the centralized source for all the institutional health guidelines researched in the Clinical Truth Matrix. This ensures no hardcoded medical values or behavioral threshold constants in the backend code.
* **Sub-Metric & Boundary Application:** 
    * `UNIVERSAL` is applied to simple, non-demographic metrics that evaluate to a single scalar value.
    * `MALE`/`FEMALE` sub-metrics are used to dynamically route sex-dependent guidelines such as the NASEM daily water intake benchmarks.
    * `SYSTOLIC`/`DIASTOLIC` sub-metrics break down blood pressure readings into individual rows.
    * A lower boundary value of `-999.99` is explicitly used as a placeholder to represent a range with no minimum floor (e.g. hypoglycemia which checks if blood glucose is below 70 mg/dl)
    * An open-ended upper boundary uses `999.99` as a placeholder to represent a range with no maximum ceiling (e.g. the recommended daily step goal is a minimum value with no maximum)
* **Goal Validation Guardrails:** Behavioral goal-tracking modules (`PhysicalActivity`, `Sleep`, `WaterIntake`) utilize specific rows flagged as `RECOMMENDED_GOAL_FLOOR`. The validation engine cross-references these specific records at the moment of account configuration to audit a user's target selection before committing it to the active tracking schema.
* **Design Decision:** The `classification` field is left as a flexibile string (`VARCHAR`) rather than an `ENUM` to easily accommodate the wide variety of medical tier labels. This also prevents the system from breaking or requiring complex database migrations if clinical guidelines change in the future. `DECIMAL(8, 2)` is used as the data type for the minimum and maximum values and `99,999.99` is used as the upper threshold placehold to accomadate for the recommended daily step goal.
* **Scope & Versioning Constraint:** For the current scope of this project, a dedicated `ClinicalThresholdsHistory` table is omitted. Because institutional clinical standards change infrequently, the `ClinicalThresholds` table provides the current state of truth. Historical continuity for behavioral metrics, specifically `PhysicalActivity`, `Sleep`, and `WaterIntake`, is naturally preserved by storing the user's custom target values inside their personal timeline tables at the exact moment of creation, avoiding unnecessary architectural overhead while ensuring long-term data integrity. 

### Biometric & Activity Log Tables
* **Standardized Structure:** Every time-series logging table implements a uniform layout: a unique internal `log_id` primary key, a `user_id` foreign key referencing the core `Users` table , raw metric value data types, and a `logged_at` or `recorded_at` timestamp.
* **Additional Constraints:** The backend will enforce domain-specific validation rules. For metrics that are recorded once daily such as `PhysicalActivity` or `Sleep`, the backend will block multiple daily entries or safely update the existing entry for that date. Other constraints such as preventing the input of an impossible value will be enforced by the backend.
* **Normalizaton and Redundancy:** In strict alignment with database normalization principles, no clinical classifications or alert states are stored directly in the log tables. Storing a label such as "Stage 2 Hypertension" alongside a raw blood pressure reading introduces data redundancy. Instead, classifications are obtained at runtime by querying the `ClinicalThresholds` table. This will also limit the numbers of changes that will need to be made to the database if guidelines are modified. *Note: While this database design maintains this normalization for data integrity, we may consider selective denormalization later if retrievals, particularly by the AI chatbot, lead to suboptimal performance* 
* **Metric-Specific Verification Logic:**
    * `BloodGlucose`: Raw entries are cross-referenced against fasting rows in the `ClinicalThresholds` table to determine glycemic ranges.
    * `BloodOxygenSaturation`: Readings are verified against standard hypoxemia thresholds in the `ClinicalThresholds` table to flag low blood oxygen states.
    * `BloodPressure`: Records distinct systolic and diastolic values, using the `ClinicalThresholds` table to determine where the individual components fall within the clinical tiers.
    * `BodyMassIndex`: Stores the user's weight entry. The backend will dynamically calculate the user's BMI with this weight entry and by cross-referencing it with the height active in the `UserHealthProfiles` table. The `recorded_at` field in this table ensures that historical BMI calculations remain accurate even if a user updates their physic height later.
    * `PeakFlowRate`: Measures lung function in Liters per Minute. The system evaluates the reading by dividing the logged flow rate by the user's active personal best peak flow baseline found in the `MetricGoals` table. The `logged_at` timestamp ensures historical calculations are accurate against future baseline shifts.
    * `PhysicalActivity` & `Sleep`: Daily totals are directly compared against the current or historical goals in the `MetricGoals` and `MetricGoalsHistory` tables respectively.
    * `WaterIntake`: Captures incremental fluid inputs throughout the day, summing them up to measure total daily fluid ounces or cups against the current and historical goals n the `MetricGoals` and `MetricGoalsHistory` tables respectively.

### `ChatMessages`
* **Purpose:** Records every transactional exchange between the user and the AI chatbot as a distinct chronological row.
* **Design Decision:** A `sender_role` field with the enumeration (`user`, `AI`) is used identify the author of the chat message. This table provides the AI chatbot with historical context and allows the clinical report generator to parse text histories for symptom tracking.