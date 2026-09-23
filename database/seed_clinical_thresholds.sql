-- Seed data for ClinicalThresholds, derived from docs/clinical_truth_matrix.md.
-- Safe to re-run: clears existing rows before inserting the current set.

DELETE FROM ClinicalThresholds;

-- Table 1: Sleep Duration (source: https://www.cdc.gov/sleep/about/index.htm)
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('SLEEP', 'UNIVERSAL', 'RECOMMENDED_GOAL_FLOOR', 7.0, 99999.99, 'DISPLAY_GOAL_NOTICE', 'The CDC recommends a minimum of 7.0 hours of sleep for adults. Consider setting a goal of at least 7.0 hours');

-- Table 2: Physical Activity (source: https://www.cdc.gov/physical-activity-basics/benefits/)
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('PHYSICAL_ACTIVITY', 'UNIVERSAL', 'RECOMMENDED_GOAL_FLOOR', 7000, 99999.99, 'DISPLAY_GOAL_NOTICE', 'Your daily step goal is low. There is no official public health recommendation for a specific number of daily steps but research suggests that increasing daily walking contributes to better health. Consider setting a goal of at least 7,000 steps per day or gradually increasing your goal over time if you''re just getting started');

-- Table 3: Water Intake (source: https://www.nationalacademies.org/read/11537/chapter/15)
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('WATER_INTAKE', 'FEMALE', 'RECOMMENDED_GOAL_FLOOR', 9.0, 99999.99, 'DISPLAY_GOAL_NOTICE', 'Your daily water intake is low. General health guidelines suggest that most adult women consume about 9 cups of fluids from beverages each day. Consider increasing your goal if it aligns with your personal hydration needs.'),
('WATER_INTAKE', 'MALE', 'RECOMMENDED_GOAL_FLOOR', 13.0, 99999.99, 'DISPLAY_GOAL_NOTICE', 'Your daily water intake is low. General health guidelines suggest that most adult men consume about 13 cups of fluids from beverages each day. Consider increasing your goal if it aligns with your personal hydration needs.');

-- Table 4: Body Mass Index (source: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html)
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('BODY_MASS_INDEX', 'UNIVERSAL', 'Underweight', -999.99, 18.5, 'LOG_WARNING_AND_BANNER', 'Your BMI falls below the healthy weight range. If this is unexpected or you''re concerned about your weight or health, consider speaking with a healthcare professional.'),
('BODY_MASS_INDEX', 'UNIVERSAL', 'Healthy Weight', 18.5, 25.0, 'LOG_SUCCESS_AND_BANNER', 'Your BMI falls within the healthy weight range. Maintaining a balanced diet and regular physical activity can support your overall health.'),
('BODY_MASS_INDEX', 'UNIVERSAL', 'Overweight', 25.0, 30.0, 'LOG_WARNING_AND_BANNER', 'Your BMI falls within the overweight range.. Small, sustainable lifestyle changes can help improve your overall health. Consider discussing your health goals with a professional if needed.'),
('BODY_MASS_INDEX', 'UNIVERSAL', 'Obesity', 30.0, 99999.99, 'LOG_WARNING_AND_BANNER', 'Your BMI falls within the obesity range. BMI is a screening tool and does not diagnose health conditions. If you''re concerned about your weight or health, consider speaking with a healthcare professional.');

-- Table 5: Blood Pressure (source: https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings)
-- Decomposed into independent SYSTOLIC/DIASTOLIC rows: app takes the worse of the two classifications.
-- Crisis boundary nudged from strict ">180"/">120" to inclusive integer equivalents (>=181/>=121)
-- since systolic_mmhg/diastolic_mmhg are INT and max_value is an exclusive upper bound.
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('BLOOD_PRESSURE', 'SYSTOLIC', 'Normal Blood Pressure', -999.99, 120, 'LOG_SUCCESS_AND_BANNER', 'Your blood pressure falls within the normal range. Keep up healthy habits such as regular physical activity, a balanced diet, and routine health checkups.'),
('BLOOD_PRESSURE', 'SYSTOLIC', 'Elevated Blood Pressure', 120, 130, 'LOG_WARNING_AND_BANNER', 'Your blood pressure is above the normal range. Maintaining a healthy lifestyle may help prevent hypertension. Consider monitoring your blood pressure regularly.'),
('BLOOD_PRESSURE', 'SYSTOLIC', 'Stage 1 Hypertension', 130, 140, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 1 hypertension range. Continue monitoring your blood pressure and discuss your results with a healthcare professional if readings remain elevated.'),
('BLOOD_PRESSURE', 'SYSTOLIC', 'Stage 2 Hypertension', 140, 181, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 2 hypertension range. Consider contacting a healthcare professional to discuss your blood pressure and appropriate next steps.'),
('BLOOD_PRESSURE', 'SYSTOLIC', 'Hypertensive Crisis', 181, 99999.99, 'LOG_CRITICAL_AND_BANNER', 'Your blood pressure reading is extremely high. If this reading is accurate, seek immediate medical attention, especially if you have symptoms such as chest pain, shortness of breath, severe headache, or vision changes.'),
('BLOOD_PRESSURE', 'DIASTOLIC', 'Normal Blood Pressure', -999.99, 80, 'LOG_SUCCESS_AND_BANNER', 'Your blood pressure falls within the normal range. Keep up healthy habits such as regular physical activity, a balanced diet, and routine health checkups.'),
('BLOOD_PRESSURE', 'DIASTOLIC', 'Stage 1 Hypertension', 80, 90, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 1 hypertension range. Continue monitoring your blood pressure and discuss your results with a healthcare professional if readings remain elevated.'),
('BLOOD_PRESSURE', 'DIASTOLIC', 'Stage 2 Hypertension', 90, 121, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 2 hypertension range. Consider contacting a healthcare professional to discuss your blood pressure and appropriate next steps.'),
('BLOOD_PRESSURE', 'DIASTOLIC', 'Hypertensive Crisis', 121, 99999.99, 'LOG_CRITICAL_AND_BANNER', 'Your blood pressure reading is extremely high. If this reading is accurate, seek immediate medical attention, especially if you have symptoms such as chest pain, shortness of breath, severe headache, or vision changes.');

-- Table 6: Blood Glucose (source: https://diabetes.org/about-diabetes/diagnosis)
-- All entries assumed fasting (FPG) per the matrix's own scope note.
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('BLOOD_GLUCOSE', 'FASTING', 'Hypoglycemia', -999.99, 70, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose is below the normal range. Follow your healthcare provider''s guidance for treating low blood sugar. If symptoms are severe or do not improve, seek immediate medical attention.'),
('BLOOD_GLUCOSE', 'FASTING', 'Normal Fasting Blood Glucose', 70, 100, 'LOG_SUCCESS_AND_BANNER', 'Your fasting blood glucose falls within the normal range. Keep up your healthy habits and continue monitoring as recommended.'),
('BLOOD_GLUCOSE', 'FASTING', 'Prediabetes Range', 100, 126, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose falls within the prediabetes range. Maintaining a healthy diet and regular physical activity may help reduce your risk of developing Type 2 diabetes. Consider discussing your results with a healthcare professional.'),
('BLOOD_GLUCOSE', 'FASTING', 'Diabetes Range', 126, 99999.99, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose falls within the diabetes range. Diabetes is generally diagnosed after repeat testing by a healthcare professional. Consider discussing your results with your healthcare provider.');

-- Table 7: Blood Oxygen Saturation (source: https://gwinnettlung.com/blog/decoding-pulse-oximetry-readings-what-each-number-means/)
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('BLOOD_OXYGEN', 'UNIVERSAL', 'Severely Low Oxygen Saturation', -999.99, 90, 'LOG_CRITICAL_AND_BANNER', 'Your blood oxygen saturation is critically low. If this reading is accurate, seek immediate medical evaluation, especially if you have shortness of breath, chest pain, or difficulty breathing.'),
('BLOOD_OXYGEN', 'UNIVERSAL', 'Low Oxygen Saturation', 90, 95, 'LOG_WARNING_AND_BANNER', 'Your blood oxygen saturation is below the normal range. Continue monitoring your readings and consider contacting your healthcare provider if they remain low or you develop symptoms.'),
('BLOOD_OXYGEN', 'UNIVERSAL', 'Normal Oxygen Saturation', 95, 99999.99, 'LOG_SUCCESS_AND_BANNER', 'Your blood oxygen saturation falls within the normal range. Continue monitoring as recommended.');

-- Table 8: Peak Flow Rate (source: https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma/treatment/devices/peak-flow)
-- Values are the percentage of the user's personal best, hence UNIVERSAL sub_metric.
INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message) VALUES
('PEAK_FLOW_RATE', 'UNIVERSAL', 'Red Zone (Medical Alert)', -999.99, 50, 'LOG_CRITICAL_AND_BANNER', 'Your peak flow rate is critically low, falling within the red zone (below 50% of your personal best). Seek immediate medical evaluation or emergency care as directed by your healthcare professional.'),
('PEAK_FLOW_RATE', 'UNIVERSAL', 'Yellow Zone (Caution)', 50, 80, 'LOG_WARNING_AND_BANNER', 'Your peak flow rate falls within the caution yellow zone (50% to 79% of your personal best). Monitor your symptoms closely and consult your personal asthma action plan or healthcare provider.'),
('PEAK_FLOW_RATE', 'UNIVERSAL', 'Green Zone (Stable)', 80, 99999.99, 'LOG_SUCCESS_AND_BANNER', 'Your peak flow rate falls within the normal green zone (80% or higher of your personal best). Continue monitoring as recommended by your healthcare provider.');
