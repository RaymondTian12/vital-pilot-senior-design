export type ChatRole = "user" | "assistant";
export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};
export type AuthUser = {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: "patient" | "provider" | "admin";
  created_at: string;
};
export type AdminProvider = {
  provider_id: number;
  first_name: string;
  last_name: string;
  email: string;
  npi: string;
  specialty: string;
  license_state: string;
  license_number: string;
  verification_status: "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";
  created_at: string;
};
export type AdminAccount = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: "patient" | "provider" | "admin";
  created_at: string;
  is_active: boolean;
};
export type SignInResponse = {
  message: string;
  access_token: string;
  user: AuthUser;
};
export type SignUpResponse = {
  message: string;
  user: AuthUser;
};
export type ChatContextSelection = {
  metric_types: VitalType[];
  start_at: string;
  end_at: string;
  timezone_name: string;
};
export type ChatContext = {
  start_at: string;
  end_at: string;
  generated_at: string;
  timezone_name: string;
  note: string;
  metrics: {
    metric: VitalType;
    unit: string;
    assessment_counts: { label: string; alert_state: string; count: number }[];
    summary: {
      count: number;
      days_logged: number;
      values: Record<string, { min: number; max: number; avg: number }>;
    };
    latest: null | {
      recorded_at: string;
      values: Record<string, number | null>;
      assessment: string;
      guidance: string;
    };
  }[];
};
export type ChatResponse = { reply: string; context?: ChatContext | null };
export type BPComponent = {
  classification: string;
  alert_state: string;
  alert_message: string;
};
export type BPClassification = {
  systolic: BPComponent | null;
  diastolic: BPComponent | null;
  overall: BPComponent | null;
  status: "classified" | "unclassified";
  unclassified_components: string[];
};
export type BloodPressureReading = {
  suggested_follow_up?: SuggestedFollowUp | null;
  log_id: number;
  metric_type: "BLOOD_PRESSURE";
  systolic_mmhg: number;
  diastolic_mmhg: number;
  recorded_at: string;
  classification: BPClassification;
};
export type BloodPressurePage = {
  metric_type: "BLOOD_PRESSURE";
  count: number;
  records: BloodPressureReading[];
};
export type VitalType =
  | "BLOOD_PRESSURE"
  | "BLOOD_GLUCOSE"
  | "BLOOD_OXYGEN"
  | "BODY_MASS_INDEX"
  | "PEAK_FLOW_RATE"
  | "WATER_INTAKE"
  | "PHYSICAL_ACTIVITY"
  | "SLEEP";
export type QuestionnaireRequest = {
  gender: "male" | "female";
  dob: string;
  height_feet: number;
  height_inches: number;
  weight: number;
  selectedVitals: VitalType[];
  steps_goal?: number;
  water_goal?: number;
  sleep_goal?: number;
  peak_flow_goal?: number;
};
export type Doctor = {
  distance_miles?: number | null;
  npi: number | string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  specialty: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  address: string | null;
  address_line_2?: string | null;
  postal_code?: string | null;
  credential?: string | null;
  fax?: string | null;
  registry_status?: string | null;
  last_updated?: string | null;
  taxonomies?: string[];
  registry_url?: string;
  matched_specialty?: string | null;
  matched_specialty_is_primary?: boolean;
  portrait_url?: string | null;
  portrait_source_url?: string | null;
  portrait_attribution?: string | null;
  photo_url?: string | null;
  website?: string | null;
  clinic_photo_url?: string | null;
};
export type ClinicPhoto = {
  source?: "places" | "street_view";
  image_date?: string;
  photo_url: string | null;
  message: string;
  place_name?: string;
  website?: string;
  maps_url?: string;
  attributions?: {
    displayName: string;
    uri?: string;
  }[];
};

export type OtherVitalType = Exclude<VitalType, "BLOOD_PRESSURE">;
export type OtherMetricReading = {
  classification?: MetricAssessment | null;
  suggested_follow_up?: SuggestedFollowUp | null;
  log_id: number;
  metric_type: OtherVitalType;
  recorded_at: string;
  // True when this save replaced an existing entry for today (goal
  // metrics only -- sleep, steps, water intake) rather than adding a new
  // one; see ONE_PER_DAY_METRICS in backend/routers/metrics.py.
  updated?: boolean;
  glucose_mgdl?: number;
  spo2_percentage?: number;
  flow_rate_lmin?: number;
  weight_lbs?: number;
  bmi_value?: number;
  duration_hours?: number;
  steps_taken?: number;
  amount_cups?: number;
};
export type SavedMetricReading = BloodPressureReading | OtherMetricReading;

export type MetricAssessment = {
  status: "classified" | "needs_context" | "unavailable";
  category: "health" | "goal";
  classification: string;
  alert_state: string;
  guidance: string;
  next_action: "none" | "review" | "urgent" | "add_context";
  basis: string;
  source_url: string | null;
  context: Record<string, string | number>;
};

export type FollowUpSpecialty =
  | "primary_care"
  | "cardiology"
  | "pulmonology"
  | "endocrinology";
export type SuggestedFollowUp = {
  status: "review" | "urgent" | "needs_context";
  explanation: string;
  primary_specialty_group: FollowUpSpecialty | null;
  alternative_specialty_groups: FollowUpSpecialty[];
};
