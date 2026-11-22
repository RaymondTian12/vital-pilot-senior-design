# VitalPilot

VitalPilot is a full-stack chronic-condition health monitoring platform. Patients log vitals (blood pressure, blood glucose, blood oxygen, BMI, peak flow, sleep, water intake, physical activity) from a mobile app; a backend evaluates every reading against clinical thresholds and tracks sustained/chronic patterns over time, raising alerts and connecting patients to healthcare providers. The system also includes an AI chatbot, AI-generated clinical reports, and role-based provider/admin portals.

Developed for CSE 4316-17 Senior Design at UT Arlington (Summer 2026 – Fall 2026) by The Vital Engineers.

## Architecture

- **Mobile client** (`vitalpilot/frontend/mobile`): React Native + Expo (TypeScript).
- **Backend** (`backend`): Python, FastAPI.
- **Database**: MySQL.

The mobile app talks to the backend exclusively over authenticated HTTPS; the backend enforces auth, validates input, and runs all clinical/temporal evaluation logic against the database.

## Prerequisites

- Node.js 22.13+ (LTS) and npm
- Python 3.9+
- A MySQL server (local install, Docker container, or a hosted instance such as Aiven/PlanetScale/RDS) and a way to run `.sql` files against it (`mysql` CLI, a GUI client, etc.)

## 1. Clone and install dependencies

```sh
git clone https://github.com/RaymondTian12/vital-pilot-senior-design.git
cd vital-pilot-senior-design
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
npm ci
```

## 2. Set up a fresh database

Create an empty MySQL database (any name), then run the schema and the clinical threshold seed against it, in this order:

```sh
mysql -h <host> -P <port> -u <user> -p <database> < database/schema.sql
mysql -h <host> -P <port> -u <user> -p <database> < database/seed_clinical_thresholds.sql
```

`schema.sql` creates every table the application needs. The clinical threshold seed is required — without it, vitals cannot be classified (e.g., blood pressure staging). The `database/migrations/` folder is **not** needed for a fresh install; those files only exist to upgrade an already-running VitalPilot database with existing data.

## 3. Configure the backend

Create a `.env` file at the repository root:

```dotenv
dbname=<your database name>
dbhost=<your database host>
dbport=<your database port>
dbuser=<your database user>
dbpassword=<your database password>
jwt_secret_key=<any long random string>
```

Optional, feature-specific variables (the app runs without these; the related features are simply disabled):

```dotenv
# Enables the AI chatbot and AI-generated clinical report summaries.
GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-3.5-flash
GEMINI_REPORT_MODEL=gemini-3.5-flash

# Enables Google sign-in.
GOOGLE_WEB_CLIENT_ID=

# Enables doctor photos in the "Find a doctor" directory.
GOOGLE_PLACES_API_KEY=
```

## 4. Configure the mobile app

Create `vitalpilot/frontend/mobile/.env.local`:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

Use your computer's LAN IP (not `localhost`) so a physical phone on the same Wi-Fi network can reach the backend — e.g. `ipconfig getifaddr en0` on macOS. If you're only testing in a browser on the same machine, `http://localhost:8000` works instead.

## 5. Run the app

Terminal 1 — backend, from the repository root:

```sh
.venv/bin/uvicorn backend.app:app --env-file .env --host 0.0.0.0 --port 8000
```

Terminal 2 — mobile app:

```sh
cd vitalpilot/frontend/mobile
npx expo start --dev-client --clear --port 8081
```

Open the Expo dev client on your phone (same Wi-Fi network) via the QR code, or press `w` to open it in a browser. Google sign-in and some native device features require a development build rather than Expo Go:

```sh
cd vitalpilot/frontend/mobile
npx expo run:ios --device
```

## 6. Run the automated tests

Backend:

```sh
.venv/bin/python -m unittest discover -s backend/tests -p 'test_*.py'
```

Mobile:

```sh
cd vitalpilot/frontend/mobile
npx tsc --noEmit
node --test tests/*.test.cjs
```

## Further documentation

See [`docs/`](docs/) for feature-specific documentation (AI/PDF report setup, provider portal, metric charts, database design, etc.) and [`docs/local_development.md`](docs/local_development.md) for additional day-to-day development notes.
