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

## Connect to the existing FastAPI backend

Only the authentication endpoints currently exist. The mobile app supports real
registration, login, `/auth/me` session restoration, and logout. Native tokens
are saved with Expo SecureStore; the browser preview keeps tokens in memory.
Registration leads to sign-in, then the existing questionnaire. Questionnaire,
health metrics, reports, profile editing, and chat are not persisted by this integration.

Set `EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000` in this folder's
`.env.local` (see `.env.example`). Never copy database credentials or the JWT
signing secret into the mobile folder. Restart Expo after changing the URL.
Your phone and the backend computer must be on a network that allows them to
communicate; university/guest Wi-Fi may isolate devices. Check the URL's `/health`
page in the phone's browser first. An Expo tunnel does not tunnel the backend.

From this folder, run `npm run dev` and open the app in Expo Go. Keep the existing
backend running on port 8000, bound to `0.0.0.0`. A physical phone cannot use
`localhost` to reach your computer. The separate website is unaffected. The Expo
browser preview needs backend CORS support, which is outside this mobile change.

The current backend requires login/register fields in URL query parameters.
The mobile client matches that contract. Passwords can therefore appear in backend
access logs; use a test-only password. Moving credentials to JSON request bodies
requires a backend teammate's change. Use HTTPS for a deployed API.

Manual verification:
1. Register a test account; verify duplicate registration displays the server error.
2. Sign in with a wrong password, then the correct password.
3. Check that home/profile show the signed-in name and email.
4. Close and reopen the app; a valid stored session should load through `/auth/me`.
5. Sign out; protected screens should no longer be accessible.
6. Stop the backend; sign-in should show an error rather than simulate success.

Run request-contract checks with `node --test tests/auth-api.test.cjs`, and type
checks with `npx tsc --noEmit` from this folder. Root workspace lockfile updates
were intentionally left outside the mobile-only scope; if your team uses `npm ci`,
the workspace maintainer needs to refresh the root lockfile for `expo-secure-store`.
