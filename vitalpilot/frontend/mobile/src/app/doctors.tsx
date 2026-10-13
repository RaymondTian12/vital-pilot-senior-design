import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { api } from "@/services/api";
import type { Doctor, ClinicPhoto } from "@/types/vitalpilot";
import {
  Button,
  Card,
  Chip,
  Empty,
  Field,
  Heading,
  Notice,
  Screen,
  ui,
} from "@/components/design/ui";
import { Icon } from "@/components/design/icon";
import { ClinicVisual } from "@/components/design/clinic-visual";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
const specialties: Record<string, string> = {
  All: "",
  Cardiology: "Cardiovascular Disease",
  "Primary care": "Family Medicine",
  Endocrinology: "Endocrinology, Diabetes & Metabolism",
};
type LocalClinic = {
  source: number;
  aspectRatio: number;
  title: string;
  label: string;
  sourceUrl?: string;
};
function getLocalClinic(doctor: Doctor): LocalClinic | null {
  const first = doctor.first_name?.trim().toLowerCase(),
    last = doctor.last_name?.trim().toLowerCase();
  const city = doctor.city?.trim().toLowerCase();
  if (
    String(doctor.npi) === "1922505080" &&
    first === "abdulmuttaleb" &&
    last === "al soufi" &&
    city === "pine bluff" &&
    doctor.state?.trim().toUpperCase() === "AR" &&
    /1600\s+w(?:est)?\s+40th/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/abdulmuttaleb-clinic.jpeg"),
      aspectRatio: 1320 / 741,
      title: "Jefferson Regional · Pine Bluff, AR",
      label: "Clinic image supplied for Abdulmuttaleb Al Soufi",
    };
  }
  if (
    String(doctor.npi) === "1932858016" &&
    first === "joshua" &&
    last === "allen" &&
    city === "aurora" &&
    doctor.state?.trim().toUpperCase() === "CO" &&
    /1400\s+s(?:outh)?\s+potomac/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/joshua-clinic.jpeg"),
      aspectRatio: 1320 / 1195,
      title: "1400 S Potomac Street · Aurora, CO",
      label: "Clinic image supplied for Joshua Allen",
    };
  }
  if (
    String(doctor.npi) === "1275282048" &&
    first === "susmitha" &&
    last === "aluri" &&
    city === "lawton" &&
    doctor.state?.trim().toUpperCase() === "OK" &&
    /3401\s+w(?:est)?\s+gore/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/susmitha-clinic.jpeg"),
      aspectRatio: 1320 / 864,
      title: "Comanche County Memorial Hospital · Lawton, OK",
      label: "Practice image supplied for Susmitha Aluri",
    };
  }
  if (doctor.state?.trim().toUpperCase() !== "TX") return null;
  if (
    String(doctor.npi) === "1073715165" &&
    first === "stacie" &&
    last === "bingaman" &&
    city === "arlington" &&
    /400\s+w(?:est)?\s+arbrook/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/arbrook-building.jpg"),
      aspectRatio: 1360 / 928,
      title: "400 W Arbrook Boulevard · Medical building",
      label: "Shared building exterior · Photo: Gateway Diagnostic Imaging",
      sourceUrl: "https://www.gatewaydiagnostic.com/locations/arlington/",
    };
  }
  if (
    String(doctor.npi) === "1669777850" &&
    first === "maria renela" &&
    last === "suller" &&
    city === "midlothian" &&
    /4431\s+e(?:ast)?\s+(?:(?:us|u\.?s\.?)\s+)?(?:highway|hwy)\s+287/i.test(
      doctor.address || "",
    )
  ) {
    return {
      source: require("../../assets/images/vitalpilot/midway-endocrinology.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Midway Midlothian",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/clinic/endocrinology-and-diabetes-midway-midlothian",
    };
  }
  if (
    String(doctor.npi) === "1043660178" &&
    first === "sarah" &&
    last === "abdellatif" &&
    city === "cedar hill" &&
    /950\s+(?:e(?:ast)?\s+)?belt\s+line/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/cedar-hill-clinic.png"),
      aspectRatio: 1200 / 798,
      title: "Methodist Family Health Center — Cedar Hill",
      label: "Clinic exterior · Photo: Methodist Health System",
      sourceUrl:
        "https://www.methodisthealthsystem.org/location/methodist-family-health-center-cedar-hill",
    };
  }
  if (
    String(doctor.npi) === "1417535154" &&
    first === "asha" &&
    last === "abraham" &&
    city === "dallas" &&
    /3500\s+w(?:est)?\s+wheatland/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/methodist-southwest.jpg"),
      aspectRatio: 505 / 326,
      title: "Methodist Southwest Medical Center",
      label: "Hospital campus exterior · Photo: Methodist Health System",
      sourceUrl:
        "https://www.methodisthealthsystem.org/methodist-southwest-medical-center",
    };
  }
  if (
    String(doctor.npi) === "1942942602" &&
    first === "bency" &&
    last === "abraham" &&
    city === "dallas" &&
    /1515\s+s(?:outh)?\s+buckner/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/pleasant-grove-clinic.webp"),
      aspectRatio: 1920 / 1440,
      title: "Oak Street Health — Pleasant Grove",
      label: "Clinic exterior · Photo: Oak Street Health",
      sourceUrl:
        "https://www.oakstreethealth.com/locations/dallas-tx/pleasant-grove-doctors-office",
    };
  }
  if (
    String(doctor.npi) === "1003306705" &&
    first === "karla" &&
    last === "acosta-monroe" &&
    city === "bryan" &&
    /2612\s+w(?:est)?\s+villa\s+maria/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/bryan-villa-maria.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Bryan West Villa Maria",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/clinic/bryan-west-villa-maria-road",
    };
  }
  if (
    String(doctor.npi) === "1457700163" &&
    first === "akhil" &&
    last === "agarwal" &&
    city === "austin" &&
    /11209\s+s(?:outh)?\s+(?:interstate|i[ -]?)\s*35/i.test(
      doctor.address || "",
    )
  ) {
    return {
      source: require("../../assets/images/vitalpilot/onion-creek-clinic.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Austin Onion Creek",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/clinic/austin-onion-creek",
    };
  }
  if (
    String(doctor.npi) === "1639583321" &&
    first === "mansoor" &&
    last === "ahmad" &&
    city === "killeen" &&
    /3801\s+scott\s+and\s+white/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/killeen-clinic.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Killeen",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl: "https://www.bswhealth.com/locations/clinic/killeen",
    };
  }
  if (
    String(doctor.npi) === "1598091092" &&
    first === "daniel" &&
    last === "addison" &&
    city === "dallas" &&
    /6202\s+harry\s+hines/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/utsw-cancer-outpatient.jpg"),
      aspectRatio: 1370 / 721,
      title: "UT Southwestern — Cancer Care Outpatient Building",
      label: "Practice building exterior · Photo: UT Southwestern",
      sourceUrl:
        "https://utswmed.org/locations/cancer-care-outpatient-building/",
    };
  }
  if (
    String(doctor.npi) === "1457328403" &&
    first === "tayo" &&
    last === "addo" &&
    city === "dallas" &&
    /2001\s+inwood/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/utsw-inwood.jpg"),
      aspectRatio: 1600 / 732,
      title: "UT Southwestern — West Campus Building 3",
      label: "Practice building exterior · Photo: UT Southwestern",
      sourceUrl: "https://utswmed.org/locations/wcb3/",
    };
  }
  if (
    String(doctor.npi) === "1326128695" &&
    first === "david" &&
    last === "aguilar" &&
    city === "dallas" &&
    /2001\s+inwood/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/utsw-inwood.jpg"),
      aspectRatio: 1600 / 732,
      title: "UT Southwestern — West Campus Building 3",
      label: "Practice building exterior · Photo: UT Southwestern",
      sourceUrl: "https://utswmed.org/locations/wcb3/",
    };
  }
  if (
    String(doctor.npi) === "1083252332" &&
    first === "ossama" &&
    last === "abou hassan" &&
    city === "temple" &&
    /2401\s+s(?:outh)?\s+31st/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/temple-hospital.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White Medical Center — Temple",
      label: "Practice building exterior · Photo: Baylor Scott & White Health",
      sourceUrl: "https://www.bswhealth.com/locations/hospital/temple",
    };
  }
  if (
    String(doctor.npi) === "1972846285" &&
    first === "farah" &&
    last === "al-saffar" &&
    city === "dallas" &&
    /3410\s+worth/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/sammons-building.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Sammons building",
      label: "Practice building exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/sammons-cancer-center-dallas",
    };
  }
  if (
    String(doctor.npi) === "1588906986" &&
    first === "amit" &&
    last === "alam" &&
    city === "dallas" &&
    /3410\s+worth/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/sammons-building.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Sammons building",
      label: "Practice building exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/sammons-cancer-center-dallas",
    };
  }
  if (
    String(doctor.npi) === "1316118300" &&
    first === "shema" &&
    last === "ahmad" &&
    city === "round rock" &&
    /425\s+university/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/round-rock-university.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Round Rock 425 University",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/clinic/round-rock-425-university",
    };
  }
  if (
    String(doctor.npi) === "1942356522" &&
    first === "tres" &&
    last === "barrera" &&
    city === "round rock" &&
    /425\s+university/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/round-rock-university.webp"),
      aspectRatio: 800 / 600,
      title: "Baylor Scott & White — Round Rock 425 University",
      label: "Clinic exterior · Photo: Baylor Scott & White Health",
      sourceUrl:
        "https://www.bswhealth.com/locations/clinic/round-rock-425-university",
    };
  }
  if (
    String(doctor.npi) === "1508956210" &&
    first === "leisha" &&
    last === "bevoni" &&
    city === "dallas" &&
    /8611\s+hillcrest/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/park-cities-building.jpg"),
      aspectRatio: 1600 / 732,
      title: "UT Southwestern — Park Cities",
      label: "Practice building exterior · Photo: UT Southwestern",
      sourceUrl: "https://utswmed.org/locations/park-cities/",
    };
  }
  if (
    String(doctor.npi) === "1841232444" &&
    first === "salomon" &&
    last === "banarer" &&
    city === "dallas" &&
    /7777\s+forest/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/medical-city-dallas.webp"),
      aspectRatio: 875 / 500,
      title: "Medical City Dallas · Hospital campus",
      label: "Hospital campus exterior · Photo: Medical City Healthcare",
      sourceUrl:
        "https://www.medicalcityhealthcare.com/locations/medical-city-dallas",
    };
  }
  if (
    String(doctor.npi) === "1144317850" &&
    first === "richard" &&
    last === "berger" &&
    city === "dallas" &&
    /7777\s+forest/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/medical-city-dallas.webp"),
      aspectRatio: 875 / 500,
      title: "Medical City Dallas · Hospital campus",
      label: "Hospital campus exterior · Photo: Medical City Healthcare",
      sourceUrl:
        "https://www.medicalcityhealthcare.com/locations/medical-city-dallas",
    };
  }
  const arbrookCardiologists: Record<string, [string, string]> = {
    "1962611830": ["aamir", "amin"],
    "1295799492": ["michael", "graceffo"],
    "1669436655": ["michael", "mitchell"],
    "1265431787": ["atif", "sohail"],
  };
  const arbrook = arbrookCardiologists[String(doctor.npi)];
  if (
    arbrook &&
    first === arbrook[0] &&
    last === arbrook[1] &&
    city === "arlington" &&
    /400\s+w(?:est)?\s+arbrook/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/arbrook-building.jpg"),
      aspectRatio: 1360 / 928,
      title: "400 W Arbrook Boulevard · Medical building",
      label: "Shared building exterior · Photo: Gateway Diagnostic Imaging",
      sourceUrl: "https://www.gatewaydiagnostic.com/locations/arlington/",
    };
  }
  const northArlingtonCardiologists: Record<string, [string, string]> = {
    "1497986533": ["manikumar", "bheemarasetti"],
    "1215991906": ["stuart", "lander"],
    "1477517456": ["stephen", "lenhoff"],
    "1669735734": ["shishir", "sharma"],
    "1578977856": ["thomas", "sperry"],
  };
  const northArlington = northArlingtonCardiologists[String(doctor.npi)];
  if (
    northArlington &&
    first === northArlington[0] &&
    last === northArlington[1] &&
    city === "arlington" &&
    /902\s+w(?:est)?\s+randol\s+mill/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/north-arlington-heartplace.webp"),
      aspectRatio: 938 / 524,
      title: "HeartPlace — North Arlington",
      label: "Practice building exterior · Photo: HeartPlace",
      sourceUrl: "https://www.heartplace.com/location/arlington-tx-3",
    };
  }
  const fielderProviders: Record<string, [string, string]> = {
    "1578523122": ["george", "anagnostis"],
    "1144281205": ["jim", "anagnostis"],
    "1023079019": ["donna", "baker"],
    "1750580262": ["shelle", "barber"],
  };
  const fielder = fielderProviders[String(doctor.npi)];
  if (
    fielder &&
    first === fielder[0] &&
    last === fielder[1] &&
    city === "arlington" &&
    /1300\s+s(?:outh)?\s+fielder/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/fielder-clinic.jpg"),
      aspectRatio: 721 / 441,
      title: "Catalyst Physician Group — Fielder",
      label: "Clinic exterior · Photo: Catalyst Physician Group",
      sourceUrl: "https://www.catalystphysiciangroup.com/location/fielder/",
    };
  }
  if (
    String(doctor.npi) === "1437110418" &&
    first === "cheri" &&
    last === "andrews" &&
    city === "arlington" &&
    /1926\s+s\.?\s*w\.?\s+green\s+oaks/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/green-oaks-clinic.jpg"),
      aspectRatio: 1000 / 667,
      title: "Catalyst Physician Group — SW Green Oaks",
      label: "Clinic exterior · Photo: Catalyst Physician Group",
      sourceUrl:
        "https://www.catalystphysiciangroup.com/location/sw-green-oaks/",
    };
  }
  if (
    String(doctor.npi) === "1720472970" &&
    first === "chad" &&
    last === "bartel" &&
    city === "arlington" &&
    /4100\s+n(?:orth)?\s+collins/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/viridian-clinic.jpg"),
      aspectRatio: 721 / 441,
      title: "Catalyst Physician Group — Viridian",
      label: "Clinic exterior · Photo: Catalyst Physician Group",
      sourceUrl: "https://www.catalystphysiciangroup.com/location/viridian/",
    };
  }
  if (
    String(doctor.npi) === "1154090264" &&
    first === "alyson" &&
    last === "barton" &&
    city === "arlington" &&
    /400\s+w(?:est)?\s+arbrook/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/arbrook-building.jpg"),
      aspectRatio: 1360 / 928,
      title: "400 W Arbrook Boulevard · Medical building",
      label: "Shared building exterior · Photo: Gateway Diagnostic Imaging",
      sourceUrl: "https://www.gatewaydiagnostic.com/locations/arlington/",
    };
  }

  if (
    String(doctor.npi) === "1750365839" &&
    first === "anjani" &&
    last === "amin" &&
    city === "arlington" &&
    /1540\s+w(?:est)?\s+(?:interstate|i[ -]?)\s*20/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/anjani-clinic.jpeg"),
      aspectRatio: 1320 / 1092,
      title: "WellMed · Arlington, TX",
      label: "Clinic image supplied for Anjani Amin · Google Street View",
    };
  }

  if (
    String(doctor.npi) === "1750030664" &&
    first === "bremmy" &&
    last === "alsbrooks" &&
    city === "arlington" &&
    /3301\s+matlock/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/bremmy-clinic.jpeg"),
      aspectRatio: 1320 / 736,
      title: "Medical City Arlington",
      label: "Practice image supplied for Bremmy Alsbrooks",
    };
  }

  if (
    first === "janet" &&
    last === "adeniran" &&
    city === "arlington" &&
    /6507\s+s(?:outh)?\s+cooper/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/janet-clinic.jpeg"),
      aspectRatio: 1320 / 1746,
      title: "Methodist Family Health Center — South Arlington",
      label: "Clinic image supplied for Janet Adeniran · Google Street View",
    };
  }
  if (
    first === "euginia" &&
    last === "agbatekwe" &&
    city === "bedford" &&
    /2700\s+tibbets/i.test(doctor.address || "")
  ) {
    return {
      source: require("../../assets/images/vitalpilot/euginia-clinic.jpeg"),
      aspectRatio: 1320 / 1009,
      title: "2700 Tibbets Drive · Bedford, TX",
      label: "Clinic image supplied for Euginia Agbatekwe · Google Street View",
    };
  }
  return null;
}
export default function Doctors() {
  const [city, setCity] = useState("Dallas");
  const [state, setState] = useState("TX");
  const [specialty, setSpecialty] = useState("All");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [queried, setQueried] = useState(false);
  const [photos, setPhotos] = useState<Record<string, ClinicPhoto>>({});
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const photoAttempted = useRef(new Set<string>());
  async function showDetails(key: string, retry = false) {
    if (details === key && !retry) {
      setDetails(null);
      return;
    }
    setDetails(key);
    if (doctors.some((d) => String(d.npi) === key && getLocalClinic(d))) return;
    if (retry) photoAttempted.current.delete(key);
    if (photoAttempted.current.has(key)) return;
    photoAttempted.current.add(key);
    setPhotoBusy(key);
    const searchId = requestId.current;
    try {
      const result = await api.clinicPhoto(key);
      if (searchId === requestId.current)
        setPhotos((p) => ({ ...p, [key]: result }));
    } catch (e) {
      if (searchId === requestId.current)
        setPhotos((p) => ({
          ...p,
          [key]: {
            photo_url: null,
            message:
              e instanceof Error ? e.message : "Practice photo unavailable.",
          },
        }));
    } finally {
      if (searchId === requestId.current)
        setPhotoBusy((p) => (p === key ? null : p));
    }
  }
  const [details, setDetails] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const requestId = useRef(0);
  useEffect(
    () => () => {
      requestId.current++;
    },
    [],
  );
  async function search() {
    if (busy) return;
    Keyboard.dismiss();
    if (state.trim() && !/^[A-Z]{2}$/.test(state.trim())) {
      setError("Enter a two-letter state code, such as TX.");
      return;
    }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    setDoctors([]);
    setPhotos({});
    photoAttempted.current.clear();
    setPhotoBusy(null);
    setDetails(null);
    setAction(null);
    try {
      const result = await api.searchDoctors({
        city,
        state,
        specialty: specialties[specialty],
      });
      if (id === requestId.current) {
        setDoctors(result.doctors);
        setQueried(true);
      }
    } catch (e) {
      if (id === requestId.current)
        setError(
          e instanceof Error
            ? e.message
            : "Unable to search providers. Please retry.",
        );
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setError(
        "Unable to open this link. Please use the contact information shown on the card.",
      );
    }
  }
  return (
    <Screen back>
      <View
        style={{
          backgroundColor: C.blue,
          borderRadius: 24,
          padding: 22,
          gap: 16,
        }}
      >
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Text style={ui.eyebrow}>YOUR NEXT STEP IN CARE</Text>
          <Icon name="doctor" size={36} />
        </View>
        <Heading
          title="Find your care team"
          subtitle="A clearer path to the right provider. Explore specialties, locations, and contact details."
        />
        <Text style={ui.small}>
          Provider information from the CMS NPI Registry
        </Text>
      </View>
      <Card>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Text style={ui.heading}>Where are you looking?</Text>
          <Icon name="search" />
        </View>
        <View style={[ui.row, { alignItems: "flex-start" }]}>
          <Field
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="City"
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <View style={{ width: 90 }}>
            <Field
              label="State"
              value={state}
              onChangeText={(v) =>
                setState(
                  v
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 2),
                )
              }
              placeholder="TX"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>
        <Text style={ui.body}>Specialty</Text>
        <View style={[ui.row, { flexWrap: "wrap", gap: 8 }]}>
          {Object.keys(specialties).map((v) => (
            <Chip
              key={v}
              selected={v === specialty}
              onPress={() => {
                Keyboard.dismiss();
                setSpecialty(v);
              }}
            >
              {v}
            </Chip>
          ))}
        </View>
        <Button icon="search" loading={busy} onPress={search}>
          Search providers
        </Button>
      </Card>
      {error ? (
        <>
          <Notice error>{error}</Notice>
          <Button secondary onPress={search}>
            Retry search
          </Button>
        </>
      ) : null}
      {busy && (
        <Text
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={ui.small}
        >
          Searching the provider directory…
        </Text>
      )}
      {!busy && !error && !doctors.length && (
        <Empty
          title={
            queried ? "No providers found" : "Care starts with a connection"
          }
          message={
            queried
              ? "Try a nearby city or a different specialty."
              : "Choose your location, then search to see provider profiles and contact options."
          }
          icon="doctor"
        />
      )}
      {!!doctors.length && (
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Text style={ui.heading}>
            {doctors.length} {doctors.length === 1 ? "provider" : "providers"}
          </Text>
          <Text style={ui.small}>Up to 20 results</Text>
        </View>
      )}
      {doctors.map((d) => {
        const key = String(d.npi);
        const name =
          [d.first_name, d.last_name].filter(Boolean).join(" ") || "Provider";
        const address = [
          d.address,
          d.address_line_2,
          [d.city, d.state, d.postal_code].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ");
        const initials =
          [d.first_name?.[0], d.last_name?.[0]].filter(Boolean).join("") ||
          "HC";
        const localClinic = getLocalClinic(d);
        const expanded = details === key;
        const phoneAction = action === `${key}:call`;
        const mapAction = action === `${key}:map`;
        return (
          <Card key={key}>
            {localClinic && (
              <View
                style={{
                  gap: 8,
                  backgroundColor: C.blue,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={localClinic.source}
                  contentFit="contain"
                  style={{
                    width: "100%",
                    aspectRatio: localClinic.aspectRatio,
                  }}
                  accessibilityLabel={localClinic.label}
                />
                <View style={{ padding: 12, gap: 4 }}>
                  <Text style={ui.body}>{localClinic.title}</Text>
                  <Text style={ui.small}>{localClinic.label}</Text>
                  {localClinic.sourceUrl && (
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel="View clinic photo source"
                      style={{ minHeight: 48, justifyContent: "center" }}
                      onPress={() => void open(localClinic.sourceUrl!)}
                    >
                      <Text style={ui.link}>View photo source</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {!localClinic &&
              !d.photo_url?.startsWith("https://") &&
              !photos[key]?.photo_url && (
                <ClinicVisual
                  photo={d.clinic_photo_url}
                  location={
                    [d.city, d.state].filter(Boolean).join(", ") ||
                    "Practice location"
                  }
                />
              )}
            {!localClinic && photos[key]?.photo_url && (
              <View style={{ gap: 8 }}>
                <Image
                  source={{ uri: photos[key].photo_url! }}
                  cachePolicy="none"
                  contentFit="contain"
                  style={{ height: 200, width: "100%", borderRadius: 16 }}
                  accessibilityLabel={
                    photos[key].source === "street_view"
                      ? "Street View near the practice address"
                      : `Practice listing photo for ${photos[key].place_name || name}`
                  }
                  onError={() =>
                    setPhotos((p) => ({
                      ...p,
                      [key]: {
                        ...p[key],
                        photo_url: null,
                        message: "Practice photo could not be loaded.",
                      },
                    }))
                  }
                />
                <Text style={ui.small}>
                  {photos[key].source === "street_view"
                    ? `Street View near the practice address${photos[key].image_date ? ` · ${photos[key].image_date}` : ""}`
                    : `${photos[key].place_name} · Photo from a matched practice listing`}
                </Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() =>
                    void open(photos[key].maps_url || "https://maps.google.com")
                  }
                  style={{ minHeight: 48, justifyContent: "center" }}
                >
                  <Text style={ui.link}>Google Maps</Text>
                </Pressable>
                {photos[key].attributions?.map((a, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="link"
                    disabled={!a.uri}
                    style={{ minHeight: 48, justifyContent: "center" }}
                    onPress={() => {
                      const url = a.uri?.startsWith("//")
                        ? `https:${a.uri}`
                        : a.uri;
                      if (url?.startsWith("https://")) void open(url);
                    }}
                  >
                    <Text style={ui.small}>Photo: {a.displayName}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {photos[key]?.source === "street_view" && (
              <Text style={ui.small}>
                May show nearby buildings rather than the exact entrance.
              </Text>
            )}
            <View style={[ui.row, { alignItems: "flex-start" }]}>
              {d.photo_url?.startsWith("https://") ? (
                <Image
                  source={{ uri: d.photo_url }}
                  style={{ height: 72, width: 72, borderRadius: 20 }}
                  accessibilityLabel={`Photo of ${name}`}
                />
              ) : (
                <View
                  style={{
                    height: 72,
                    width: 72,
                    borderRadius: 20,
                    backgroundColor: C.mint,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                  }}
                  accessibilityLabel="Provider avatar, photo unavailable"
                >
                  <Text style={[ui.heading, { color: C.primaryDark }]}>
                    {initials}
                  </Text>
                  <Icon name="doctor" size={20} />
                </View>
              )}
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={ui.heading}>{name}</Text>
                {d.credential && (
                  <Text style={[ui.small, { color: C.primaryDark }]}>
                    {d.credential}
                  </Text>
                )}
                <Text style={ui.small}>
                  {d.specialty || "Specialty not listed"}
                </Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: C.border }} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open map options for ${name}`}
              disabled={!d.address}
              onPress={() => setAction(mapAction ? null : `${key}:map`)}
              style={[
                ui.row,
                { alignItems: "flex-start", minHeight: 48, paddingVertical: 8 },
              ]}
            >
              <Icon name="pin" />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={ui.body}>
                  {[d.city, d.state].filter(Boolean).join(", ") ||
                    "Location not listed"}
                </Text>
                <Text style={ui.small}>
                  {d.address || "Address unavailable"}
                </Text>
                {d.address && <Text style={ui.link}>View on map ▾</Text>}
              </View>
            </Pressable>
            {mapAction && (
              <View
                style={{
                  backgroundColor: C.background,
                  borderRadius: 14,
                  padding: 12,
                  gap: 10,
                }}
              >
                <Text style={ui.body}>Open this practice address in</Text>
                <Button
                  secondary
                  onPress={() => {
                    setAction(null);
                    void open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                    );
                  }}
                >
                  Google Maps
                </Button>
                {Platform.OS === "ios" && (
                  <Button
                    secondary
                    onPress={() => {
                      setAction(null);
                      void open(
                        `https://maps.apple.com/?q=${encodeURIComponent(address)}`,
                      );
                    }}
                  >
                    Apple Maps
                  </Button>
                )}
                <Button secondary onPress={() => setAction(null)}>
                  Cancel
                </Button>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Phone ${d.phone || "unavailable"}, ${name}`}
              accessibilityState={{ expanded: phoneAction, disabled: !d.phone }}
              disabled={!d.phone}
              onPress={() => setAction(phoneAction ? null : `${key}:call`)}
              style={[ui.row, { minHeight: 48, paddingVertical: 8 }]}
            >
              <Icon name="phone" />
              <View style={{ flex: 1 }}>
                <Text style={ui.body}>{d.phone || "Phone not listed"}</Text>
                {d.phone && <Text style={ui.link}>Contact practice ▾</Text>}
              </View>
            </Pressable>
            {phoneAction && (
              <View
                style={{
                  backgroundColor: C.mint,
                  borderRadius: 14,
                  padding: 14,
                  gap: 12,
                }}
              >
                <Text style={ui.body}>Call {name}’s practice?</Text>
                <Text style={ui.small}>
                  Confirm appointment availability and contact details directly
                  with the practice.
                </Text>
                <Button
                  icon="phone"
                  onPress={() => {
                    setAction(null);
                    void open(`tel:${d.phone!.replace(/[^\d+]/g, "")}`);
                  }}
                >
                  Call {d.phone}
                </Button>
                <Button secondary onPress={() => setAction(null)}>
                  Cancel
                </Button>
              </View>
            )}
            <Button secondary onPress={() => void showDetails(key)}>
              {expanded ? "Hide details" : "View provider details"}
            </Button>
            {expanded && (
              <View style={{ gap: 14, paddingTop: 6 }}>
                {photoBusy === key && (
                  <Text style={ui.small} accessibilityLiveRegion="polite">
                    Looking for a matching practice photo…
                  </Text>
                )}
                {photos[key] && !photos[key].photo_url && (
                  <Text style={ui.small}>{photos[key].message}</Text>
                )}
                {photos[key] && !photos[key].photo_url && (
                  <Button
                    secondary
                    disabled={photoBusy === key}
                    onPress={() => void showDetails(key, true)}
                  >
                    Retry photo lookup
                  </Button>
                )}
                {photos[key]?.website?.startsWith("https://") && (
                  <Button
                    secondary
                    onPress={() => void open(photos[key].website!)}
                  >
                    Visit matched practice website
                  </Button>
                )}
                <Text style={ui.heading}>Practice & contact</Text>
                <Text style={ui.body}>
                  {address || "Practice address not listed"}
                </Text>
                <Text style={ui.small}>
                  Phone: {d.phone || "Not listed"}
                  {"\n"}Fax: {d.fax || "Not listed"}
                </Text>
                <Text style={ui.heading}>Professional information</Text>
                <Text style={ui.body}>
                  {(d.taxonomies?.length
                    ? d.taxonomies
                    : [d.specialty || "Specialty not listed"]
                  ).join("\n")}
                </Text>
                <Text style={ui.small}>
                  Credentials: {d.credential || "Not listed"}
                  {"\n"}NPI: {key}
                  {"\n"}Registry status:{" "}
                  {d.registry_status === "A"
                    ? "Active"
                    : d.registry_status === "D"
                      ? "Deactivated"
                      : d.registry_status || "Not listed"}
                  {"\n"}Last updated: {d.last_updated || "Not listed"}
                </Text>
                {d.website?.startsWith("https://") ? (
                  <Button secondary onPress={() => void open(d.website!)}>
                    Visit practice website
                  </Button>
                ) : (
                  <>
                    <Text style={ui.small}>
                      An official website is not supplied by this directory.
                      Search results may include unrelated providers.
                    </Text>
                    <Button
                      secondary
                      icon="search"
                      onPress={() =>
                        void open(
                          `https://www.google.com/search?q=${encodeURIComponent(`${name} ${d.credential || ""} ${d.city || ""} ${d.state || ""} practice website`)}`,
                        )
                      }
                    >
                      Find practice website
                    </Button>
                  </>
                )}
                <Button
                  secondary
                  onPress={() =>
                    void open(
                      `https://npiregistry.cms.hhs.gov/provider-view/${encodeURIComponent(key)}`,
                    )
                  }
                >
                  View original registry profile
                </Button>
              </View>
            )}
          </Card>
        );
      })}
      <Notice>
        Directory listings do not confirm availability, insurance coverage, or
        clinical quality. Contact the practice before visiting. Searching does
        not share your health information.
      </Notice>
    </Screen>
  );
}
