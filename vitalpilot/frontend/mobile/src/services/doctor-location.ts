import { Platform } from "react-native";

const names = "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|Puerto Rico|Guam|American Samoa|Northern Mariana Islands|United States Virgin Islands".split("|");
const codes = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU AS MP VI".split(" ");
export function searchArea(address: { city?: string | null; subregion?: string | null; region?: string | null; isoCountryCode?: string | null }) {
  if (address.isoCountryCode !== "US") throw new Error("This directory covers U.S. providers. Enter a U.S. city and state manually.");
  const region = address.region?.trim() ?? "";
  const state = codes.includes(region.toUpperCase()) ? region.toUpperCase() : codes[names.findIndex((name) => name.toLowerCase() === region.toLowerCase())];
  const city = address.city?.trim();
  if (!city || !state) throw new Error("We couldn’t identify your city and state. Please enter them manually.");
  return { city, state };
}
export async function locateDoctorSearchArea() {
  if (Platform.OS === "web") throw new Error("Enter your city and state manually in the browser. Device location is available in the iPhone and Android app.");
  // Deferred require lets older development clients show an actionable error.
  let location: typeof import("expo-location");
  try { location = require("expo-location"); }
  catch { throw new Error("Location needs an updated development build. Rebuild the app, or enter your city and state manually."); }
  if (!(await location.hasServicesEnabledAsync())) throw new Error("Location services are off. Enable them in Settings or enter your city and state manually.");
  const permission = await location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new Error("Location permission wasn’t granted. You can still enter your city and state manually.");
  const position = await location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced });
  const addresses = await location.reverseGeocodeAsync(position.coords);
  if (!addresses[0]) throw new Error("We couldn’t identify your area. Enter your city and state manually.");
  return searchArea(addresses[0]);
}
