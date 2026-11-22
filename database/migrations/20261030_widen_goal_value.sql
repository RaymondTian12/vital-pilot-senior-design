-- MetricGoals.goal_value and MetricGoalsHistory.old_value were DECIMAL(6, 2),
-- capping at 9999.99. A steps goal like 10000 overflows that, causing
-- "Out of range value for column 'goal_value'" on questionnaire save.
-- Widen both to DECIMAL(8, 2) (max 999999.99) to comfortably hold any
-- realistic goal value. Safe to run on existing data: widening a DECIMAL
-- column never truncates existing values.

ALTER TABLE MetricGoals
    MODIFY COLUMN goal_value DECIMAL(8, 2) NOT NULL;

ALTER TABLE MetricGoalsHistory
    MODIFY COLUMN old_value DECIMAL(8, 2) NOT NULL;
