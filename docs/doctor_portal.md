# Doctor portal setup

The patient app can grant and revoke read access to registered providers. A provider signs in with the normal email/password screen and is routed to the doctor portal. The portal lists only patients with an active grant and shows their saved metric readings.

## Database

Apply `database/migrations/20261101_provider_portal.sql` and then `database/migrations/20261101_provider_registration.sql` to an existing database before using the portal. The first changes new assignments to `PENDING`, revokes old active assignments that were created before the consent UI, removes duplicate assignment pairs, and adds a unique pair constraint. The second adds provider verification status; existing providers start as pending review. `database/schema.sql` contains both definitions for fresh databases.

## Provider accounts

The sign-in screen has **Register as a doctor**. Doctor registration creates a provider account with `PENDING` verification. The doctor can sign in and see their status, but cannot see patient records or appear in the approved care directory while pending. An administrator can list applications with `python -m backend.review_provider --list`, independently verify the clinician's identity, NPI, and active license, then run `python -m backend.review_provider EMAIL --approve` or `--reject`. The approval command requires a verification confirmation. The doctor can refresh the portal to see the result.

For a clinician already verified by an administrator, `python -m backend.provision_provider` creates an approved account directly. Public patient signup and Google signup still create patient accounts. Do not change a patient account's role without also creating its matching `Providers` record.

## Admin portal

Apply `database/migrations/20261102_admin_portal.sql` before using the admin portal on an existing database. It creates `ProviderReviews` to record decisions, reviewers, notes, and timestamps. On a fresh database, `database/schema.sql` includes this table.

Create the first admin from a trusted backend terminal with `python -m backend.bootstrap_admin --first-name NAME --last-name NAME --email EMAIL`. The command prompts privately for a password and refuses to run once an admin exists. There is no public admin signup. The admin signs in through the normal sign-in screen and is routed to **Admin portal**.

The portal lists pending, approved, and rejected applications. Before approval, the admin must independently check identity and the active state license, enter a review note, and confirm those checks in the form. The NPI Registry link helps compare the submitted NPI, but an NPI record does not establish identity or licensure. Approval and rejection require an admin session on the API; a pending application can be decided once. The existing `review_provider` command remains available for backend-only review, but its decisions are not written to `ProviderReviews`.

The admin can also search patient and doctor accounts, suspend or restore non-admin access with a required reason, and edit the four welcome panels. Apply `20261102_admin_accounts.sql` before starting this version of the API, then `20261102_welcome_content.sql`. Suspension blocks both new sign-ins and existing tokens; neither the account directory nor welcome editor exposes patient health records. The admin cannot change user roles or suspend another admin through the portal.

To add another admin, an existing admin opens **Admin team**, enters a teammate's name and unused email, and creates a one-time invitation. The code is shown only once and expires after 48 hours. Share the code privately; the teammate opens **Have an admin invitation?** from admin sign-in and sets their own password. Codes are stored only as hashes. An admin can revoke an unused invitation. Apply `database/migrations/20261103_admin_invites_and_doctor_removal.sql` before using this flow.

The doctor review tabs include **Removed**. Removing an approved doctor requires a note and explicit confirmation, records an audit decision, and revokes all existing patient sharing in the same transaction. Reapproving a rejected or removed doctor requires fresh identity and active-license verification. Previously revoked patient grants do not resume; patients must share again. The doctor account remains for audit purposes and can sign in to see its status, but cannot read patient records while removed.

## Patient flow

In **Profile → Share with doctors**, the patient can open the registered care directory. **Share my readings** requires confirmation and activates access for that provider. The same screen lists current grants and allows removal. Removal blocks future doctor API reads immediately.

## Doctor flow

The doctor portal lists authorized patients and opens their recorded metrics. The API checks the signed-in provider's `Providers` row, `APPROVED` verification, and an active assignment for the requested patient on every read. It does not allow providers to change patient readings.

## Local review

Backend checks: `jwt_secret_key=isolated-test-key python -m unittest discover -s backend/tests -q` (using the project's backend dependencies).

The mobile app needs its npm dependencies and `EXPO_PUBLIC_API_BASE_URL`. End-to-end review additionally needs a database with the migration, a provisioned provider account, and a patient account with a completed health profile.
