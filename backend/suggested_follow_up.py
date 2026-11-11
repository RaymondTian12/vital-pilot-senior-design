"""Directory follow-up derived from assessments, never new clinical thresholds."""

HABITS = {"SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"}


def suggested_follow_up(metric_type, assessment):
    if metric_type in HABITS:
        return None
    assessment = assessment or {}
    components = []
    if metric_type == "BLOOD_PRESSURE":
        components = [assessment.get(name) or {} for name in ("systolic", "diastolic")]
        complete = assessment.get("status") == "classified" and bool(
            assessment.get("overall")
        )
        evaluated = [assessment.get("overall") or {}, *components]
        urgent = any("CRITICAL" in item.get("alert_state", "") for item in evaluated)
        review = any("WARNING" in item.get("alert_state", "") for item in evaluated)
        missing = "One or both blood-pressure values could not be assessed. Review the missing assessment with your healthcare professional."
    else:
        complete = (
            assessment.get("status") == "classified"
            and assessment.get("category") == "health"
        )
        urgent = complete and assessment.get("next_action") == "urgent"
        review = complete and assessment.get("next_action") == "review"
        missing = (
            assessment.get("guidance")
            or "More assessment context is needed. This does not mean the reading is normal or clear."
        )
    # A recognized critical BP component must survive an incomplete overall result.
    if not urgent and not complete:
        return {
            "status": "needs_context",
            "explanation": missing,
            "primary_specialty_group": None,
            "alternative_specialty_groups": [],
        }
    if not urgent and not review:
        return None
    explanation = (
        "Follow the urgent guidance for this reading. Do not wait for a routine appointment. The provider directory is for follow-up care."
        if urgent
        else "Discuss this assessed reading with a primary care provider, who can review it in context and help decide whether specialist care is needed."
    )
    alternatives = {"BLOOD_PRESSURE": ["cardiology"], "PEAK_FLOW_RATE": ["pulmonology"]}
    return {
        "status": "urgent" if urgent else "review",
        "explanation": explanation,
        "primary_specialty_group": "primary_care",
        "alternative_specialty_groups": alternatives.get(metric_type, []),
    }


def attach_follow_up(records):
    """Enrich response records without modifying persisted assessment snapshots."""
    for record in records:
        record["suggested_follow_up"] = suggested_follow_up(
            record["metric_type"], record.get("classification")
        )
    return records
