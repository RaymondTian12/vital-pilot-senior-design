# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Mobile UI and API integration

The app uses the approved light-only cool-white/teal design. Shared components
live in `src/components/design`. A mobile-only Metro resolver keeps React and React DOM on the mobile workspace
versions so the separate Next.js app can retain its own versions.
Five tabs expose Home, Vitals, Pilot AI, Reports,
and Profile; Explore remains available from Home and Profile. All existing route
paths are retained. The Expo browser preview uses the same navigation and real
sign-out handler.

Registration, login, session restoration, logout, onboarding, and NPI doctor
search use the existing FastAPI API. Login and registration send JSON. Native
tokens use SecureStore; browser tokens remain in memory. Onboarding posts baseline
health details, selected vitals, and applicable goals to `/auth/questionnare`
(the current backend spelling). The database schema must be provisioned first.
The backend still has no profile read/update API or onboarding-complete flag.

Set `EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000` in this folder's
`.env.local` (see `.env.example`). Restart Expo after changing it. Keep database
credentials and signing secrets out of mobile configuration. A physical phone
cannot use localhost to reach your computer. Check `/health` from the phone;
Expo tunnels do not tunnel the backend. Use HTTPS for deployment.

Metrics, live AI, reporting/PDFs, password changes, and saved notification history
are not implemented by the backend. Their screens do not simulate successful
writes or clinical classifications. Profile's Sample preview switch enables
clearly labeled examples for unsupported features only. It defaults off, stays
in memory, resets on sign-out, and never calls a write API. Account identity,
onboarding, and doctor search always use real API state.

The one-second opening animation runs once per cold launch, concurrently with
session restoration. It uses Reanimated and the existing logo, and reduces to a
short fade when reduced motion is enabled. A slow session check shows a loading
state after the animation. Native splash configuration changes need a rebuilt
app to verify; Expo Go cannot validate the final native launch screen.

## Review and verification

From this folder:

```sh
npm run dev
npx tsc --noEmit
node --test tests/auth-api.test.cjs
```

Implementation screenshots and a replayable browser startup capture are in
`output/mobile-ui-review` at the repository root. Those captures use intercepted
test API responses, not live patient data. Browser verification covers account
creation/sign-in, all questionnaire steps and save errors, five tabs, doctor
search errors/retry, preview isolation, and sign-out reset. iOS and Android
bundles were exported; physical-device layout, keyboard, VoiceOver/TalkBack,
and native splash behavior still need device verification.

Manual device checks:

1. Register, sign in, complete onboarding, and verify a valid stored session restores.
2. Search providers, open details, and try the phone action where a number exists.
3. Toggle preview; verify examples never become saved readings or reports.
4. Sign out and back in; preview must be off and no previous-session alerts remain.
5. Check small screens, large accessibility text, keyboard visibility, reduced
   motion, cold launch, and background/resume while the device is set to dark mode.

## Expo SDK 57

The mobile workspace uses Expo 57.0.27, React Native 0.86.3, React 19.2.3,
and TypeScript 6.0.3. Install workspace dependencies from the repository root
with `npm ci`. The root React Native override keeps native peer dependencies on
the same SDK-compatible version; the separate web app keeps its React 19.2.4.
The build-properties plugin enables iOS scene support for Xcode 27/iOS 27.
The launcher uses a square canvas asset; the in-app and splash logos are unchanged.

Stop the old Expo server, then restart with a cleared cache:

```sh
cd /Users/datphan/vital-pilot-senior-design/vitalpilot/frontend/mobile
npm run dev -- --clear
```

Use an Expo Go version compatible with SDK 57, or rebuild any existing custom
development client after this native dependency upgrade. To verify compatibility:

```sh
npx expo install --check
npx expo-doctor
npx tsc --noEmit
node --test tests/auth-api.test.cjs
```

## Welcome introduction

Welcome is a four-page, horizontally paged introduction: meet VitalPilot, choose
a daily tracking routine, understand the planned insights, and find care. Each
page has a distinct code-native illustration. Swiping moves the scene and copy
together with subtle illustration parallax. Continue and progress controls also
navigate pages; Create account appears on the final page. Skip and Sign in are
always available. Reduced motion disables parallax and animated page jumps.
Content scrolls vertically on small screens or with large text, while navigation
stays reachable. Screenshots of the four pages are in the UI review gallery.
# Google sign-in (iPhone development build)

Google sign-in is configured for bundle ID `com.vitalpilot.mobile` using the team's
Web and iOS OAuth client IDs. No Firebase or OAuth client secret is used in the app.
Existing password login and application-issued JWT sessions remain supported.

Before testing, deploy the updated Python backend and apply the additive migration
`database/migrations/20261012_google_auth.sql` to your intended development database
using your normal database administration tool. This migration is not applied by
starting the app. Fresh databases created from `database/schema.sql` include the
new identity table. The backend accepts tokens for the configured Web client ID;
`GOOGLE_WEB_CLIENT_ID` can override that public ID in the backend environment.

From this mobile directory, build and launch the iOS development app:

```sh
npx expo run:ios
```

For subsequent development sessions:

```sh
npx expo start --dev-client
```

The first command requires Xcode and installs the native Google SDK; scanning with
Expo Go will not enable Google login. Add your Google account as a test user in
Google Auth Platform while the OAuth application is in Testing. Android and browser
Google login are not yet configured and show an unavailable state.

Google verifies identity on the backend before a local JWT is issued. New Google
users continue to the questionnaire. Google subjects are stored separately from
email; an existing password account is not automatically linked by matching email.

## On-demand clinic photos

Set `GOOGLE_PLACES_API_KEY` only in the backend environment/root `.env`. Enable
Places API (New), configure billing, and restrict the key to that API. The phone
never receives the API key. Expanding a provider's details initiates a lookup;
normal doctor search does not request photos. Matching requires the same street
address and either a matching phone number or doctor surname. Ambiguous matches
keep the illustration. A matched listing photo is not guaranteed to depict the
exterior or an individual doctor. Google Maps and author attribution appear with
photos. Photo URLs are not persisted and image disk caching is disabled.

The backend defaults to 20 lookup attempts per day **per process** using
`GOOGLE_PLACES_DAILY_LOOKUP_LIMIT`. This counter resets on restart and is not a
billing guarantee. Configure Google Cloud quotas separately. Search requests
include contact/website fields and may trigger Enterprise pricing; photo media
requests have their own pricing. Test on a physical device before release.
