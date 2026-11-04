"""Context-aware per-reading guidance. Missing context/configuration fails closed.

Snapshots preserve the context and goals used at save time. Legacy entries are
explicitly evaluated against current settings and never assumed fasting.
"""
import json
from datetime import date, datetime
from decimal import Decimal

SOURCE = {
    'BLOOD_GLUCOSE': 'https://diabetes.org/about-diabetes/diagnosis',
    'BLOOD_OXYGEN': 'https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics',
    'BODY_MASS_INDEX': 'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',
    'PEAK_FLOW_RATE': 'https://www.lung.org/lung-health-diseases/lung-disease-lookup/asthma/treatment/devices/peak-flow',
}
GOALS = {'SLEEP': ('Sleep', 'duration_hours'), 'PHYSICAL_ACTIVITY': ('Steps', 'steps_taken'), 'WATER_INTAKE': ('Water', 'amount_cups')}


def load_settings(cursor, user_id):
    cursor.execute('SELECT metric_type, sub_metric, classification, min_value, max_value, alert_state, alert_message FROM ClinicalThresholds')
    thresholds = cursor.fetchall()
    cursor.execute('SELECT metric_type, goal_value FROM MetricGoals WHERE user_id = %s ORDER BY updated_at DESC, goal_id DESC', (user_id,))
    goals = {}
    for name, value in cursor.fetchall():
        if name not in goals and value is not None and Decimal(str(value)) > 0:
            goals[name] = float(value)
    cursor.execute('SELECT date_of_birth FROM UserHealthProfiles WHERE user_id = %s', (user_id,))
    profile = cursor.fetchone()
    return {'thresholds': thresholds, 'goals': goals, 'dob': profile[0] if profile else None}


def assess(record, settings, context=None, legacy=False):
    context = dict(context or {})
    kind = record['metric_type']
    category = 'goal' if kind in GOALS else 'health'
    result = {'status': 'unavailable', 'category': category, 'classification': 'Classification unavailable',
              'alert_state': 'UNAVAILABLE', 'guidance': 'This reading is saved, but a configured reference range is unavailable. This is not a normal or clear result.',
              'next_action': 'add_context', 'basis': 'Current settings for an older reading' if legacy else 'Settings and context at save time',
              'source_url': SOURCE.get(kind), 'context': context}
    def missing(message):
        return {**result, 'status': 'needs_context', 'classification': 'More context needed', 'guidance': message}
    if kind in GOALS:
        name, field = GOALS[kind]
        goal = context.get('goal_value', settings['goals'].get(name))
        if goal is None or goal <= 0:
            return missing('No personal goal is saved for this habit. Save a personal goal before comparing this entry. A missing goal is not a medical warning.')
        met = float(record[field]) >= float(goal)
        context['goal_value'] = float(goal)
        return {**result, 'status': 'classified', 'classification': 'Goal achieved' if met else 'Below your personal goal',
                'alert_state': 'LOG_SUCCESS_AND_BANNER' if met else 'LOG_WARNING_AND_BANNER', 'next_action': 'none',
                'guidance': f"Your latest entry is {'at or above' if met else 'below'} your saved {name.lower()} goal of {goal:g}. This compares one entry with your personal goal; it is not a medical assessment.", 'context': context}
    if kind == 'BLOOD_GLUCOSE':
        value, sub = record['glucose_mgdl'], 'FASTING'
        if value >= 70 and context.get('glucose_context') != 'fasting':
            return missing('Fasting ranges require at least 8 hours without food or drinks other than water. This entry was not confirmed fasting, so it is not labeled normal, prediabetes, or diabetes. Discuss unexpected readings with your healthcare professional.')
    elif kind == 'BLOOD_OXYGEN':
        value, sub = record['spo2_percentage'], 'UNIVERSAL'
    elif kind == 'BODY_MASS_INDEX':
        dob = settings.get('dob')
        if isinstance(dob, str): dob = date.fromisoformat(dob[:10])
        measured = record['recorded_at']
        if isinstance(measured, str): measured = datetime.fromisoformat(measured.replace('Z', '+00:00'))
        age = None if not dob else measured.year - dob.year - ((measured.month, measured.day) < (dob.month, dob.day))
        if age is None or age < 20:
            return missing('Adult BMI categories apply from age 20. A valid date of birth and an appropriate age-specific assessment are needed; the weight and BMI remain saved.')
        value, sub = record['bmi_value'], 'UNIVERSAL'
        context['age_at_reading'] = age
    elif kind == 'PEAK_FLOW_RATE':
        best = context.get('peak_personal_best')
        if not best or best <= 0:
            return missing('Enter your established personal-best peak flow to calculate an action-plan zone. Your highest recent entry or an arbitrary goal is not assumed to be your personal best.')
        value, sub = float(record['flow_rate_lmin']) / float(best) * 100, 'UNIVERSAL'
        context['percent_personal_best'] = round(value, 1)
    else:
        return result
    matches = [row for row in settings['thresholds'] if row[0] == kind and row[1] == sub and Decimal(str(row[3])) <= Decimal(str(value)) < Decimal(str(row[4]))]
    if len(matches) != 1:
        return result
    _, _, label, _, _, alert, message = matches[0]
    if alert not in ('LOG_SUCCESS_AND_BANNER', 'LOG_WARNING_AND_BANNER', 'LOG_CRITICAL_AND_BANNER'):
        return result
    if kind == 'BLOOD_GLUCOSE':
        message += ' Home meter readings are for tracking; diagnosis requires healthcare-professional evaluation and appropriate testing.'
        if value < 70:
            label = 'Severely low blood glucose' if 'CRITICAL' in alert else 'Low blood glucose'
            result['source_url'] = 'https://www.cdc.gov/diabetes/treatment/treatment-low-blood-sugar-hypoglycemia.html'
            message = 'Your glucose is below the configured low-glucose threshold. Follow your clinician’s low-blood-sugar plan. Seek emergency help for severe symptoms, confusion, seizure, fainting, or inability to swallow safely.'
    if kind == 'BLOOD_OXYGEN':
        message += ' Pulse oximeters can be inaccurate. Consider symptoms and your clinician’s target range; serious symptoms need urgent care even if this number looks normal.'
    return {**result, 'status': 'classified', 'classification': label, 'alert_state': alert, 'guidance': message,
            'next_action': 'urgent' if 'CRITICAL' in alert else 'review' if 'WARNING' in alert else 'none', 'context': context}


def save_assessment(cursor, user_id, record, settings, context):
    result = assess(record, settings, context)
    cursor.execute('INSERT INTO MetricAssessments (user_id, metric_type, log_id, context_json, assessment_json) VALUES (%s, %s, %s, %s, %s)',
                   (user_id, record['metric_type'], record['log_id'], json.dumps(result['context']), json.dumps(result)))
    return result


def attach_assessments(cursor, user_id, records, settings=None):
    if not records:
        return
    settings = settings or load_settings(cursor, user_id)
    # Bounded by the owning history/summary query; each user/metric is isolated.
    by_kind = {}
    for record in records:
        if record['metric_type'] != 'BLOOD_PRESSURE': by_kind.setdefault(record['metric_type'], []).append(record)
    for kind, rows in by_kind.items():
        cursor.execute('SELECT log_id, assessment_json FROM MetricAssessments WHERE user_id = %s AND metric_type = %s AND log_id IN (' + ', '.join(['%s'] * len(rows)) + ')',
                       (user_id, kind, *(record['log_id'] for record in rows)))
        snapshots = {row[0]: json.loads(row[1]) if isinstance(row[1], (str, bytes)) else row[1] for row in cursor.fetchall()}
        for record in rows:
            record['classification'] = snapshots.get(record['log_id']) or assess(record, settings, legacy=True)


def overall_result(records, today_start, end_at, truncated=()):
    health = {'BLOOD_PRESSURE', 'BLOOD_GLUCOSE', 'BLOOD_OXYGEN', 'BODY_MASS_INDEX', 'PEAK_FLOW_RATE'}
    today = [record for record in records if today_start <= record['recorded_at'] < end_at]
    latest = {}
    for record in sorted(today, key=lambda r: (r['recorded_at'], r['log_id']), reverse=True):
        latest.setdefault(record['metric_type'], record)
    urgent, warnings, unknown = [], [], []
    for record in today:
        kind = record['metric_type']
        if kind not in health:
            continue
        assessment = record.get('classification')
        level = 'unknown'
        if kind == 'BLOOD_PRESSURE':
            assessment = assessment or {}
            components = [assessment.get('systolic'), assessment.get('diastolic')]
            if any(c and 'CRITICAL' in c.get('alert_state', '') for c in components) or record['systolic_mmhg'] > 180 or record['diastolic_mmhg'] > 120:
                level = 'urgent'
            elif assessment.get('status') == 'classified' and assessment.get('overall'):
                alert = assessment['overall']['alert_state']
                level = 'review' if 'WARNING' in alert else 'none' if 'SUCCESS' in alert else 'unknown'
            label = assessment.get('overall', {}).get('classification') if assessment.get('overall') else 'Blood pressure needs review'
        else:
            label = (assessment or {}).get('classification', 'Classification unavailable')
            if assessment and assessment.get('status') == 'classified': level = assessment['next_action']
        reason = {'metric_type': kind, 'log_id': record['log_id'], 'recorded_at': record['recorded_at'], 'classification': label}
        if level == 'urgent': urgent.append(reason)
        elif level == 'review': warnings.append(reason)
        elif level not in ('none',) and latest[kind]['log_id'] == record['log_id']:
            unknown.append(reason)
    def one_per_metric(items):
        selected = {}
        for item in items: selected.setdefault(item['metric_type'], item)
        return list(selected.values())
    urgent, warnings, unknown = (one_per_metric(items) for items in (urgent, warnings, unknown))
    missing = sorted(health - latest.keys())
    if urgent:
        status, title, message = 'urgent', 'Urgent reading needs attention', 'One or more saved readings today triggered a critical alert. Review the urgent guidance below. Do not wait for a routine appointment if you have severe symptoms.'
    elif warnings:
        status, title, message = 'needs_review', 'Some health readings need review', 'One or more saved readings today triggered a warning. Review the guidance and contact your healthcare professional as appropriate.'
    elif missing or unknown or truncated:
        status, title, message = 'incomplete', 'More readings or context needed', 'A complete reference-based review is not available. Some health readings, measurement context, or configured ranges are missing. Missing information is not a normal result.'
    else:
        status, title, message = 'no_alerts', 'No alerts in assessed health readings', 'The available health readings today did not trigger the configured alerts. This is not a diagnosis or a guarantee of overall health; symptoms and your clinician’s advice still matter.'
    habits = [record.get('classification') for kind, record in latest.items() if kind in GOALS]
    return {'status': status, 'title': title, 'message': message, 'urgent_readings': urgent, 'warning_readings': warnings,
            'unclassified_readings': unknown, 'missing_health_metrics': missing,
            'habit_goals_met': sum(bool(a and a.get('status') == 'classified' and a.get('alert_state') == 'LOG_SUCCESS_AND_BANNER') for a in habits),
            'habit_goals_below': sum(bool(a and a.get('status') == 'classified' and a.get('alert_state') == 'LOG_WARNING_AND_BANNER') for a in habits),
            'habit_goals_unknown': sum(not a or a.get('status') != 'classified' for a in habits),
            'logged_metric_count': len(latest)}
