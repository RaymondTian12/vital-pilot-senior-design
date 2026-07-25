# Clinical Truth Matrix: Biometric Baseline Logic


This document details the deterministic baseline evaluation rules and clinical thresholds for tracking lifestyle conditions and other key health metrics within the platform. The logic mapped out represents the static, transactional validation rules executed upon an individual log entry. This specification explicitly covers baseline and dynamic user goals. It does not detail temporal window tracking, historical rolling averages, or backend database configuration schemas. This matrix reflects the baseline configurations for the initial release version of the platform. Because the architecture relies on a modular, metric-driven design rather than individual disease definitions, these thresholds, alert states, and tracking metrics are subject to modification as updated clinical guidelines or new biometric inputs are integrated into the core engine.

## Table 1: Sleep Duration

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hours_slept >= user_sleep_goal` | Daily Input | Goal Achieved | Dynamic User Goal | LOG_SUCCESS_AND_BANNER | "Great job! You met your sleep goal for today. Consistent, quality sleep is an important part of overall health. Keep up the good work!" |
| `hours_slept < user_sleep_goal` | Daily Input | Goal Deficit | Dynamic User Goal | LOG_WARNING_AND_BANNER | "You didn't reach your sleep goal today. Getting enough sleep consistently can support your physical and mental well-being. Try to get a little more rest tonight." |
| `user_sleep_goal < 7.0` | Profile Setting | Suboptimal Sleep Alert | Fixed Baseline | DISPLAY_GOAL_NOTICE | "The CDC recommends a minimum of 7.0 hours of sleep for adults. Consider setting a goal of at least 7.0 hours" |

**Source:** https://www.cdc.gov/sleep/about/index.htm

The CDC guidelines for sleep recommended daily for adults will be used to evaluate if a patient's defined sleep goal is adequate. These guidelines will only be used whenever the patient enter's a new sleep goal. For standard daily inputs, the alerts will be determined based off of the user's defined goal.

## Table 2: Physical Activity

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `steps_taken >= user_step_goal` | Daily Input | Goal Achieved | Dynamic User Goal | LOG_SUCCESS_AND_BANNER | "Great job! You reached your daily step goal. Regular walking can support your overall health and well-being. Keep up the great work!" |
| `steps_taken < user_step_goal` | Daily Input | Goal Deficit | Dynamic User Goal | LOG_WARNING_AND_BANNER | "You didn't reach your daily step goal today. Every step counts, so keep moving and try again tomorrow." |
| `user_step_goal < 7000` | Profile Setting | Suboptimal Physical Activity Alert | Fixed Baseline | DISPLAY_GOAL_NOTICE | "Your daily step goal is low. There is no official public health recommendation for a specific number of daily steps but research suggests that increasing daily walking contributes to better health. Consider setting a goal of at least 7,000 steps per day or gradually increasing your goal over time if you're just getting started" |

**Source:** https://www.cdc.gov/physical-activity-basics/benefits/

The CDC guidelines for daily physical activity will be used to evaluate if a patient's defined daily steps goal is adequate. The CDC does not provide a set recommended guideline but provides stats from studies such as the risk of premature death leveling off at about 6,000 to 8,000 steps per day for adults 60 or older. As a result, we will use a derived baseline of 7,000 steps per day.

## Table 3: Water Intake

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `water_intake >= user_water_goal` | Daily Input | Goal Achieved | Dynamic User Goal | LOG_SUCCESS_AND_BANNER | "Great job! You reached your daily water intake goal. Staying hydrated helps support your overall health. Keep up the great work!" |
| `water_intake < user_water_goal` | Daily Input | Goal Deficit | Dynamic User Goal | LOG_WARNING_AND_BANNER | "You didn't reach your daily water intake goal today. Staying hydrated is an important part of maintaining your health. Try to drink a little more water tomorrow." |
| `user_water_goal < 9.0 AND sex == female` | Profile Setting | Suboptimal Water Intake Alert | Fixed Baseline | DISPLAY_GOAL_NOTICE | "Your daily water intake is low. General health guidelines suggest that most adult women consume about 9 cups of fluids from beverages each day. Consider increasing your goal if it aligns with your personal hydration needs." |
| `user_water_goal < 13.0 AND sex == male` | Profile Setting | Suboptimal Water Intake Alert | Fixed Baseline | DISPLAY_GOAL_NOTICE | "Your daily water intake is low. General health guidelines suggest that most adult men consume about 13 cups of fluids from beverages each day. Consider increasing your goal if it aligns with your personal hydration needs." |

**Source:** https://www.nationalacademies.org/read/11537/chapter/15

The National Academies of Science, Engineering, and Medicine (NASEM) water intake guidelines for adult men and women will be used as the fixed baseline values.

## Table 4: Body Mass Intake (BMI)

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `calculated_bmi < 18.5` | Weight Log Entry | Underweight | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your BMI falls below the healthy weight range. If this is unexpected or you're concerned about your weight or health, consider speaking with a healthcare professional." |
| `18.5 <= calculated_bmi < 25.0` | Weight Log Entry | Healthy Weight | Fixed Baseline | LOG_SUCCESS_AND_BANNER | "Your BMI falls within the healthy weight range. Maintaining a balanced diet and regular physical activity can support your overall health." |
| `25.0 <= calculated_bmi < 30.0` | Weight Log Entry | Overweight | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your BMI falls within the overweight range.. Small, sustainable lifestyle changes can help improve your overall health. Consider discussing your health goals with a professional if needed." |
| `calculated_bmi >= 30.0` | Weight Log Entry | Obesity | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your BMI falls within the obesity range. BMI is a screening tool and does not diagnose health conditions. If you're concerned about your weight or health, consider speaking with a healthcare professional." |

**Source:** https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html

The threshold BMI categories for adults from the CDC will be used for tracking obesity. Because BMI is a useful screening tool and not a diagnosis, we will avoid labeling the patient and describe the BMI.

## Table 5: Blood Pressure

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `systolic_mmhg < 120 AND diastolic_mmhg < 80` | Blood Pressure Entry | Normal Blood Pressure | Fixed Baseline | LOG_SUCCESS_AND_BANNER | "Your blood pressure falls within the normal range. Keep up healthy habits such as regular physical activity, a balanced diet, and routine health checkups." |
| `120 <= systolic_mmhg < 130 AND diastolic_mmhg < 80` | Blood Pressure Entry | Elevated Blood Pressure | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your blood pressure is above the normal range. Maintaining a healthy lifestyle may help prevent hypertension. Consider monitoring your blood pressure regularly." |
| `130 <= systolic_mmhg < 140 OR 80 <= diastolic_mmhg < 90` | Blood Pressure Entry | Stage 1 Hypertension | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your blood pressure falls within the Stage 1 hypertension range. Continue monitoring your blood pressure and discuss your results with a healthcare professional if readings remain elevated." |
| `systolic_mmhg >= 140 OR diastolic_mmhg >= 90` | Blood Pressure Entry | Stage 2 Hypertension | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your blood pressure falls within the Stage 2 hypertension range. Consider contacting a healthcare professional to discuss your blood pressure and appropriate next steps." |
| `systolic_mmhg > 180 OR diastolic_mmhg > 120` | Blood Pressure Entry | Hypertensive Crisis | Fixed Baseline | LOG_CRITICAL_AND_BANNER | "Your blood pressure reading is extremely high. If this reading is accurate, seek immediate medical attention, especially if you have symptoms such as chest pain, shortness of breath, severe headache, or vision changes." |

**Source:** https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings

The blood pressure categories are referenced from the AHA. According to the AHA, the >180/>120 blood pressure classification is either severe hypertension (if no symptoms) with a recommendation to call a healthcare professional or hypertensive emergency (if chest pain, shortness of breath, back pain, numbness, weakness, change in vision or difficulty speaking symptoms present) with a recommendation to call 911. Because we cannot tell if the patient has any symptoms, we will use a more general critical warning to seek medical evaluation.

## Table 6: Blood Glucose

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `blood_glucose < 70` | Blood Glucose Entry | Hypoglycemia | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your fasting blood glucose is below the normal range. Follow your healthcare provider's guidance for treating low blood sugar. If symptoms are severe or do not improve, seek immediate medical attention." |
| `70 <= blood_glucose < 100` | Blood Glucose Entry | Normal Fasting Blood Glucose | Fixed Baseline | LOG_SUCCESS_AND_BANNER | "Your fasting blood glucose falls within the normal range. Keep up your healthy habits and continue monitoring as recommended." |
| `100 <= blood_glucose < 126` | Blood Glucose Entry | Prediabetes Range | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your fasting blood glucose falls within the prediabetes range. Maintaining a healthy diet and regular physical activity may help reduce your risk of developing Type 2 diabetes. Consider discussing your results with a healthcare professional." |
| `blood_glucose >= 126` | Blood Glucose Entry | Diabetes Range | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your fasting blood glucose falls within the diabetes range. Diabetes is generally diagnosed after repeat testing by a healthcare professional. Consider discussing your results with your healthcare provider." |

**Source:** https://diabetes.org/about-diabetes/diagnosis

This application assumes all blood glucose entries are fasting blood glucose (FPG) measurements obtained after at least an 8-hour fast. Blood glucose classifications are based on the American Diabetes Association (ADA) diagnostic criteria. The hypoglycemia threshold (<70 mg/dL) follows ADA guidance for clinically significant low blood glucose. Note this feature is intended for blood glucose tracking rather than comprehensive diabetes management.

## Table 7: Blood Oxygen Saturation

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `spO2 >= 95%` | Blood Oxygen Saturation Entry | Normal Oxygen Saturation | Fixed Baseline | LOG_SUCCESS_AND_BANNER | "Your blood oxygen saturation falls within the normal range. Continue monitoring as recommended." |
| `90% <= spO2 < 95%` | Blood Oxygen Saturation Entry | Low Oxygen Saturation | Fixed Baseline | LOG_WARNING_AND_BANNER | "Your blood oxygen saturation is below the normal range. Continue monitoring your readings and consider contacting your healthcare provider if they remain low or you develop symptoms." |
| `spO2 < 90%` | Blood Oxygen Saturation Entry | Severely Low Oxygen Saturation | Fixed Baseline | LOG_CRITICAL_AND_BANNER | "Your blood oxygen saturation is critically low. If this reading is accurate, seek immediate medical evaluation, especially if you have shortness of breath, chest pain, or difficulty breathing." |

**Source:** https://gwinnettlung.com/blog/decoding-pulse-oximetry-readings-what-each-number-means/

These thresholds are modeled directly from peer-reviewed clinical guidelines published by Gwinnett Pulmonary & Sleep, an active professional practice of board-certified pulmonologists. These clinical benchmarks perfectly align with the consumer safety criteria established by the U.S. Food and Drug Administration (FDA) and the World Health Organization (WHO).

## Table 8: Peak Flow Rate

| Condition | Evaluation Target | Classification | Logic Type | Alert State | Alert Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `pef_percentage >= 80` | Peak Flow Log | Green Zone (Stable) | Dynamic User Baseline | LOG_SUCCESS_AND_BANNER | "Your peak flow rate falls within the normal green zone (80% or higher of your personal best). Continue monitoring as recommended by your healthcare provider." |
| `50 <= pef_percentage < 80` | Peak Flow Log | Yellow Zone (Caution) | Dynamic User Baseline | LOG_WARNING_AND_BANNER | "Your peak flow rate falls within the caution yellow zone (50% to 79% of your personal best). Monitor your symptoms closely and consult your personal asthma action plan or healthcare provider". |
| `pef_percentage < 50` | Peak Flow Log | Red Zone (Medical Alert) | Dynamic User Baseline | LOG_CRITICAL_AND_BANNER | "Your peak flow rate is critically low, falling within the red zone (below 50% of your personal best). Seek immediate medical evaluation or emergency care as directed by your healthcare professional." |

**Source:** https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma/treatment/devices/peak-flow

This is dynamic user baseline as the percentage is calculated based on the user's best peak flow rate.
