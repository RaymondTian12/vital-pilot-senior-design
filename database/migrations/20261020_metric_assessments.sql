-- Add classification snapshots and context without changing existing readings.
CREATE TABLE IF NOT EXISTS MetricAssessments (
    user_id BIGINT UNSIGNED NOT NULL,
    metric_type VARCHAR(32) NOT NULL,
    log_id BIGINT UNSIGNED NOT NULL,
    context_json JSON NOT NULL,
    assessment_json JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, metric_type, log_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);


-- Fill only entirely absent metric configurations; preserve existing/custom rows.
START TRANSACTION;

INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message)
SELECT seed.metric_type, seed.sub_metric, seed.classification, seed.min_value, seed.max_value, seed.alert_state, seed.alert_message
FROM (
  SELECT 'BODY_MASS_INDEX' AS metric_type, 'UNIVERSAL' AS sub_metric, 'Underweight' AS classification, -999.99 AS min_value, 18.5 AS max_value, 'LOG_WARNING_AND_BANNER' AS alert_state, 'Your BMI falls below the healthy weight range. If this is unexpected or you''re concerned about your weight or health, consider speaking with a healthcare professional.' AS alert_message
  UNION ALL
  SELECT 'BODY_MASS_INDEX', 'UNIVERSAL', 'Healthy Weight', 18.5, 25.0, 'LOG_SUCCESS_AND_BANNER', 'Your BMI falls within the healthy weight range. Maintaining a balanced diet and regular physical activity can support your overall health.'
  UNION ALL
  SELECT 'BODY_MASS_INDEX', 'UNIVERSAL', 'Overweight', 25.0, 30.0, 'LOG_WARNING_AND_BANNER', 'Your BMI falls within the overweight range. Small, sustainable lifestyle changes can help improve your overall health. Consider discussing your health goals with a professional if needed.'
  UNION ALL
  SELECT 'BODY_MASS_INDEX', 'UNIVERSAL', 'Obesity', 30.0, 99999.99, 'LOG_WARNING_AND_BANNER', 'Your BMI falls within the obesity range. BMI is a screening tool and does not diagnose health conditions. If you''re concerned about your weight or health, consider speaking with a healthcare professional.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM ClinicalThresholds WHERE metric_type = 'BODY_MASS_INDEX');

INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message)
SELECT seed.metric_type, seed.sub_metric, seed.classification, seed.min_value, seed.max_value, seed.alert_state, seed.alert_message
FROM (
  SELECT 'BLOOD_GLUCOSE' AS metric_type, 'FASTING' AS sub_metric, 'Severely Low Blood Glucose' AS classification, -999.99 AS min_value, 55 AS max_value, 'LOG_CRITICAL_AND_BANNER' AS alert_state, 'Your blood glucose is severely low. Follow your clinician''s emergency low-blood-sugar plan and seek urgent medical help. For severe symptoms, confusion, fainting, seizure, or inability to swallow safely, call emergency services.' AS alert_message
  UNION ALL
  SELECT 'BLOOD_GLUCOSE', 'FASTING', 'Hypoglycemia', 55, 70, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose is below the normal range. Follow your healthcare provider''s guidance for treating low blood sugar. If symptoms are severe or do not improve, seek immediate medical attention.'
  UNION ALL
  SELECT 'BLOOD_GLUCOSE', 'FASTING', 'Normal Fasting Blood Glucose', 70, 100, 'LOG_SUCCESS_AND_BANNER', 'Your fasting blood glucose falls within the normal range. Keep up your healthy habits and continue monitoring as recommended.'
  UNION ALL
  SELECT 'BLOOD_GLUCOSE', 'FASTING', 'Prediabetes Range', 100, 126, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose falls within the prediabetes range. Maintaining a healthy diet and regular physical activity may help reduce your risk of developing Type 2 diabetes. Consider discussing your results with a healthcare professional.'
  UNION ALL
  SELECT 'BLOOD_GLUCOSE', 'FASTING', 'Diabetes Range', 126, 99999.99, 'LOG_WARNING_AND_BANNER', 'Your fasting blood glucose falls within the diabetes range. Diabetes is generally diagnosed after repeat testing by a healthcare professional. Consider discussing your results with your healthcare provider.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM ClinicalThresholds WHERE metric_type = 'BLOOD_GLUCOSE');

INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message)
SELECT seed.metric_type, seed.sub_metric, seed.classification, seed.min_value, seed.max_value, seed.alert_state, seed.alert_message
FROM (
  SELECT 'BLOOD_OXYGEN' AS metric_type, 'UNIVERSAL' AS sub_metric, 'Severely Low Oxygen Saturation' AS classification, -999.99 AS min_value, 90 AS max_value, 'LOG_CRITICAL_AND_BANNER' AS alert_state, 'Your blood oxygen saturation is critically low. If this reading is accurate, seek immediate medical evaluation, especially if you have shortness of breath, chest pain, or difficulty breathing.' AS alert_message
  UNION ALL
  SELECT 'BLOOD_OXYGEN', 'UNIVERSAL', 'Low Oxygen Saturation', 90, 95, 'LOG_WARNING_AND_BANNER', 'Your blood oxygen saturation is below the normal range. Continue monitoring your readings and consider contacting your healthcare provider if they remain low or you develop symptoms.'
  UNION ALL
  SELECT 'BLOOD_OXYGEN', 'UNIVERSAL', 'Normal Oxygen Saturation', 95, 99999.99, 'LOG_SUCCESS_AND_BANNER', 'Your blood oxygen saturation falls within the normal range. Continue monitoring as recommended.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM ClinicalThresholds WHERE metric_type = 'BLOOD_OXYGEN');

INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message)
SELECT seed.metric_type, seed.sub_metric, seed.classification, seed.min_value, seed.max_value, seed.alert_state, seed.alert_message
FROM (
  SELECT 'PEAK_FLOW_RATE' AS metric_type, 'UNIVERSAL' AS sub_metric, 'Red Zone (Medical Alert)' AS classification, -999.99 AS min_value, 50 AS max_value, 'LOG_CRITICAL_AND_BANNER' AS alert_state, 'Your peak flow rate is critically low, falling within the red zone (below 50% of your personal best). Seek immediate medical evaluation or emergency care as directed by your healthcare professional.' AS alert_message
  UNION ALL
  SELECT 'PEAK_FLOW_RATE', 'UNIVERSAL', 'Yellow Zone (Caution)', 50, 80, 'LOG_WARNING_AND_BANNER', 'Your peak flow rate falls within the caution yellow zone (50% to 79% of your personal best). Monitor your symptoms closely and consult your personal asthma action plan or healthcare provider.'
  UNION ALL
  SELECT 'PEAK_FLOW_RATE', 'UNIVERSAL', 'Green Zone (Stable)', 80, 99999.99, 'LOG_SUCCESS_AND_BANNER', 'Your peak flow rate falls within the normal green zone (80% or higher of your personal best). Continue monitoring as recommended by your healthcare provider.'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM ClinicalThresholds WHERE metric_type = 'PEAK_FLOW_RATE');

COMMIT;
