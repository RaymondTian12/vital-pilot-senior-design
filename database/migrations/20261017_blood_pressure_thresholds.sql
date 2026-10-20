-- Restore the repository BP thresholds only when no BP configuration exists.
-- Existing thresholds and saved readings are preserved.
START TRANSACTION;

INSERT INTO ClinicalThresholds (metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message)
SELECT seed.metric_type, seed.sub_metric, seed.classification, seed.min_value, seed.max_value, seed.alert_state, seed.alert_message
FROM (
  SELECT 'BLOOD_PRESSURE' AS metric_type, 'SYSTOLIC' AS sub_metric, 'Normal Blood Pressure' AS classification, -999.99 AS min_value, 120 AS max_value, 'LOG_SUCCESS_AND_BANNER' AS alert_state, 'Your blood pressure falls within the normal range. Keep up healthy habits such as regular physical activity, a balanced diet, and routine health checkups.' AS alert_message
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'SYSTOLIC', 'Elevated Blood Pressure', 120, 130, 'LOG_WARNING_AND_BANNER', 'Your blood pressure is above the normal range. Maintaining a healthy lifestyle may help prevent hypertension. Consider monitoring your blood pressure regularly.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'SYSTOLIC', 'Stage 1 Hypertension', 130, 140, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 1 hypertension range. Continue monitoring your blood pressure and discuss your results with a healthcare professional if readings remain elevated.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'SYSTOLIC', 'Stage 2 Hypertension', 140, 181, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 2 hypertension range. Consider contacting a healthcare professional to discuss your blood pressure and appropriate next steps.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'SYSTOLIC', 'Hypertensive Crisis', 181, 99999.99, 'LOG_CRITICAL_AND_BANNER', 'Your blood pressure reading is extremely high. If this reading is accurate, seek immediate medical attention, especially if you have symptoms such as chest pain, shortness of breath, severe headache, or vision changes.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'DIASTOLIC', 'Normal Blood Pressure', -999.99, 80, 'LOG_SUCCESS_AND_BANNER', 'Your blood pressure falls within the normal range. Keep up healthy habits such as regular physical activity, a balanced diet, and routine health checkups.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'DIASTOLIC', 'Stage 1 Hypertension', 80, 90, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 1 hypertension range. Continue monitoring your blood pressure and discuss your results with a healthcare professional if readings remain elevated.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'DIASTOLIC', 'Stage 2 Hypertension', 90, 121, 'LOG_WARNING_AND_BANNER', 'Your blood pressure falls within the Stage 2 hypertension range. Consider contacting a healthcare professional to discuss your blood pressure and appropriate next steps.'
  UNION ALL
  SELECT 'BLOOD_PRESSURE', 'DIASTOLIC', 'Hypertensive Crisis', 121, 99999.99, 'LOG_CRITICAL_AND_BANNER', 'Your blood pressure reading is extremely high. If this reading is accurate, seek immediate medical attention, especially if you have symptoms such as chest pain, shortness of breath, severe headache, or vision changes.'
) AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM ClinicalThresholds WHERE metric_type = 'BLOOD_PRESSURE'
);

COMMIT;
