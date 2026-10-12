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
export default function Doctors() {
  const [city, setCity] = useState("Arlington");
  const [state, setState] = useState("TX");
  const [specialty, setSpecialty] = useState("All");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [queried, setQueried] = useState(false);
  const [photos, setPhotos] = useState<Record<string, ClinicPhoto>>({});
  const [photoBusy, setPhotoBusy] = useState<string | null>(null);
  const photoAttempted = useRef(new Set<string>());
  async function showDetails(key: string) {
    if(details === key){setDetails(null);return;}
    setDetails(key);
    if(photoAttempted.current.has(key))return;
    photoAttempted.current.add(key);setPhotoBusy(key);
    const searchId=requestId.current;
    try { const result=await api.clinicPhoto(key);if(searchId===requestId.current)setPhotos(p=>({...p,[key]:result})); }
    catch(e){if(searchId===requestId.current)setPhotos(p=>({...p,[key]:{photo_url:null,message:e instanceof Error?e.message:"Practice photo unavailable."}}));}
    finally {setPhotoBusy(p=>p===key?null:p);}
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
    setPhotos({});photoAttempted.current.clear();setPhotoBusy(null);
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
          <Text style={ui.heading}>{doctors.length} {doctors.length === 1 ? "provider" : "providers"}</Text>
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
        const expanded = details === key;
        const phoneAction = action === `${key}:call`;
        const mapAction = action === `${key}:map`;
        return (
          <Card key={key}>
            {!d.photo_url?.startsWith("https://") && (
              <ClinicVisual
                photo={d.clinic_photo_url}
                location={
                  [d.city, d.state].filter(Boolean).join(", ") ||
                  "Practice location"
                }
              />
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
                {photoBusy === key && <Text style={ui.small} accessibilityLiveRegion="polite">Looking for a matching practice photo…</Text>}
                {photos[key]?.photo_url && <View style={{gap:8}}>
                  <Image source={{uri:photos[key].photo_url!}} cachePolicy="none" contentFit="cover" style={{height:200,width:"100%",borderRadius:16}} accessibilityLabel={`Practice listing photo for ${photos[key].place_name || name}`} onError={()=>setPhotos(p=>({...p,[key]:{...p[key],photo_url:null,message:"Practice photo could not be loaded."}}))}/>
                  <Text style={ui.small}>{photos[key].place_name} · Photo from a matched practice listing</Text>
                  <Pressable accessibilityRole="link" onPress={()=>void open(photos[key].maps_url || "https://maps.google.com")} style={{minHeight:48,justifyContent:"center"}}><Text style={ui.link}>Google Maps</Text></Pressable>
                  {photos[key].attributions?.map((a,i)=><Pressable key={i} accessibilityRole="link" disabled={!a.uri} style={{minHeight:48,justifyContent:"center"}} onPress={()=>{const url=a.uri?.startsWith("//")?`https:${a.uri}`:a.uri;if(url?.startsWith("https://"))void open(url);}}><Text style={ui.small}>Photo: {a.displayName}</Text></Pressable>)}
                </View>}
                {photos[key] && !photos[key].photo_url && <Text style={ui.small}>{photos[key].message}</Text>}
                {photos[key]?.website?.startsWith("https://") && <Button secondary onPress={()=>void open(photos[key].website!)}>Visit matched practice website</Button>}
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
