use defaultdb;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient', 'provider', 'admin') NOT NULL DEFAULT 'patient',
    date_created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE UserHealthProfiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    baseline_height_in DECIMAL(4, 2) NOT NULL,
    sex ENUM('Female', 'Male') NOT NULL,
    date_of_birth DATE NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE Providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    npi VARCHAR(10) NOT NULL UNIQUE,
    specialty VARCHAR(100) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    clinic_name VARCHAR(255) NULL,
    clinic_phone VARCHAR(20) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE PatientProviderAssignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    patient_profile_id INT NOT NULL,
    assignment_status ENUM('ACTIVE', 'PENDING', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES Providers(provider_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE
);
 
CREATE TABLE MetricGoals (
    goal_id INT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type ENUM('Sleep', 'Steps', 'Water', 'Peak Flow') NOT NULL,
    goal_value DECIMAL(6, 2) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE MetricGoalsHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type ENUM('Sleep', 'Steps', 'Water', 'Peak Flow') NOT NULL,
    old_value DECIMAL(6, 2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE ClinicalThresholds (
    threshold_id INT AUTO_INCREMENT PRIMARY KEY,
    metric_type ENUM(
        'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BLOOD_OXYGEN', 'BODY_MASS_INDEX',
        'PEAK_FLOW_RATE', 'WATER_INTAKE', 'PHYSICAL_ACTIVITY', 'SLEEP'
    ) NOT NULL,
    sub_metric ENUM(
        'SYSTOLIC', 'DIASTOLIC', 'FASTING', 'POST_PRANDIAL',
        'UNIVERSAL', 'FEMALE', 'MALE'
    ) NOT NULL,
    classification VARCHAR(50) NOT NULL,
    min_value DECIMAL(8, 2) NOT NULL,
    max_value DECIMAL(8, 2) NOT NULL,
    alert_state ENUM(
        'LOG_SUCCESS_AND_BANNER', 'LOG_WARNING_AND_BANNER',
        'LOG_CRITICAL_AND_BANNER', 'DISPLAY_GOAL_NOTICE'
    ) NOT NULL,
    alert_message TEXT NOT NULL
);
 
CREATE TABLE BloodGlucose (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    glucose_mgdl INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE BloodOxygenSaturation (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    spo2_percentage INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE BloodPressure (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    systolic_mmhg INT NOT NULL,
    diastolic_mmhg INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE BodyMassIndex (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    weight_lbs DECIMAL(5, 2) NOT NULL,
    bmi_value DECIMAL(4, 1) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE PeakFlowRate (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    flow_rate_lmin INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE PhysicalActivity (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    steps_taken INT NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE Sleep (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    duration_hours DECIMAL(4, 2) NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE WaterIntake (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount_cups DECIMAL(4, 2) NOT NULL,
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE ChatMessages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sender_role ENUM('user', 'AI') NOT NULL,
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
 
CREATE TABLE ClinicalReports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_profile_id INT NOT NULL,
    generated_by_user_id INT NOT NULL,
    report_title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    summary_text TEXT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_kb INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by_user_id) REFERENCES users(user_id)
);
 
CREATE TABLE Badges (
    badge_id VARCHAR(50) PRIMARY KEY,
    badge_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
 
CREATE TABLE UserBadges (
    user_badge_id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES UserHealthProfiles(profile_id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES Badges(badge_id) ON DELETE CASCADE
);