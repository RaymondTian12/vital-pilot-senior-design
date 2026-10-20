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
export type SignInResponse = {
  message: string;
  access_token: string;
  user: AuthUser;
};
export type SignUpResponse = {
  message: string;
  user: AuthUser;
};
export type ChatResponse = {
  text: string;
};
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
