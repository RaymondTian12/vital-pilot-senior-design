# Doctor portal setup

The patient app can grant and revoke read access to registered providers. A provider signs in with the normal email/password screen and is routed to the doctor portal. The portal lists only patients with an active grant and shows their saved metric readings.

## Database

Apply `database/migrations/20261101_provider_portal.sql` and then `database/migrations/20261101_provider_registration.sql` to an existing database before using the portal. The first changes new assignments to `PENDING`, revokes old active assignments that were created before the consent UI, removes duplicate assignment pairs, and adds a unique pair constraint. The second adds provider verification status; existing providers start as pending review. `database/schema.sql` contains both definitions for fresh databases.

## Provider accounts

The sign-in screen has **Register as a doctor**. Doctor registration creates a provider account with `PENDING` verification. The doctor can sign in and see their status, but cannot see patient records or appear in the approved care directory while pending. An administrator can list applications with `python -m backend.review_provider --list`, independently verify the clinician's identity, NPI, and active license, then run `python -m backend.review_provider EMAIL --approve` or `--reject`. The approval command requires a verification confirmation. The doctor can refresh the portal to see the result.

For a clinician already verified by an administrator, `python -m backend.provision_provider` creates an approved account directly. Public patient signup and Google signup still create patient accounts. Do not change a patient account's role without also creating its matching `Providers` record.

## Patient flow

In **Profile → Share with doctors**, the patient can open the registered care directory. **Share my readings** requires confirmation and activates access for that provider. The same screen lists current grants and allows removal. Removal blocks future doctor API reads immediately.

## Doctor flow

The doctor portal lists authorized patients and opens their recorded metrics. The API checks the signed-in provider's `Providers` row, `APPROVED` verification, and an active assignment for the requested patient on every read. It does not allow providers to change patient readings.

## Local review

Backend checks: `jwt_secret_key=isolated-test-key python -m unittest discover -s backend/tests -q` (using the project's backend dependencies).

The mobile app needs its npm dependencies and `EXPO_PUBLIC_API_BASE_URL`. End-to-end review additionally needs a database with the migration, a provisioned provider account, and a patient account with a completed health profile.
