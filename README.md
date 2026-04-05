This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.



## Project Structure

The project is organized into a few major segments. Each segment has a clear responsibility.

- `src/app`: routing and page composition
- `src/app/api`: request/response and endpoint orchestration
- `src/components`: reusable UI
- `src/lib`: business logic + auth + data access
- SQL files: database structure and DB-level rules


### 1. App Pages and Routing

- Path: `src/app`
- Handles user-facing pages, layouts, and route-level composition.
- Includes dashboard flows, login/register pages, doctor pages, admin pages, and map/profile pages.
- Uses the Next.js App Router convention for nested routes.

### 2. API Layer (Backend Endpoints)

- Path: `src/app/api`
- Handles server-side HTTP endpoints (GET/POST/PATCH/DELETE).
- Responsible for request parsing, validation, authentication checks, and returning API responses.
- Includes modules such as auth, prescription, diagnostics, profile, doctor/admin actions, and location services.

### 3. UI Components

- Path: `src/components`
- Contains reusable UI building blocks used across pages.
- Split by domain (for example: `auth`, `admin`, `profile`) to keep features modular.
- Keeps page files cleaner by moving repeated UI and form logic into component files.

### 4. Core Library Layer

- Path: `src/lib`
- Contains non-UI core logic used by API routes and pages.
- Main responsibilities:
	- `src/lib/auth`: session token creation/verification, cookie config, current-user extraction, password hashing/verification.
	- `src/lib/repositories`: database query logic grouped by feature (users, appointments, prescriptions, test reports, etc.).
	- `src/lib/db.ts`: shared database connection/pool setup.
	- `src/lib/env.ts`: runtime environment variable validation.

### 6. Public Assets

- Path: `public`
- Stores static files served directly by Next.js.
- Includes uploaded test report files and other public assets.


### 7. Database SQL Queries 
- Most of the major sql queries are defined in the `src/lib/repositories` directory, organized by feature (users, appointments, prescriptions, test reports, etc.).
- **user-repository.ts**: contains queries related to user management, such as creating users, fetching user details, and updating user information.
- **appointment-repository.ts**: contains queries for managing appointments, including creating, updating, and fetching appointment details.
- **prescription-repository.ts**: contains queries for handling prescriptions, such as creating new prescriptions, fetching prescription details, and updating prescription status.
- **test-report-repository.ts**: contains queries related to test reports, including uploading new reports, fetching report details, and managing report status.

### Multiple Join and Aggregate SQL queries
- In [](src/lib/repositories/appointment-repository.ts#L501-544)

### 8. SQL Procedures
- Procedures are used for handling insertion logic in cases where insertion involved multiple tables and to ensure atomicity
- [`add-poi`](/triggers.sql#L215-253): This handles addition of new location (hospitals, diagnostic centers) by first making a insertion into the **Locations** table and then to the table of relevant type. Used in [add-poi endpoint](src/app/api/locations/add-poi/route.ts)
- [`add-chambers`](/triggers.sql#L255-277): This procedure simplifies addition of a new chamber for a doctor. It checks where the said chamber already exists (in which case it only updates relevant values to the **Chambers** table). Otherwise, it adds a new entry to the **Chambers** table.
Used in [chambers endpoint](src/app/api/doctor/chambers/route.ts).
- [`change-status`](/triggers.sql#L23-55): The workflow for accepting or rejecting requests for doctor status is:
	- **accepting**: This also updates the role of the user to doctor in **Users** table. 
	- **rejecting**: Delete the doctor from the **Doctors** table and add an entry to **RejectedDoctors** table.
	- It is essential to ensure that for both cases the account updating the status has Admin privileges and update and rejected update is accompanied with added information like, the cause, time when status update and the responsible account. This procedure handles all these in a single atomic block.

### 9. SQL Functions
- SQL functions were used for two purposes: firstly, ensure reusability of code blocks that were used multiple times throughout the codebase and secondly to handle workflows where the output is obtained through complex queries
- [`getDistrict`](/extras.sql#L1-14): The output is the district name of a relevant location obtained through multi-join on **Locations**, **Thanas** and **Districts** table.
- [`getDistSq`](/extras.sql#L17-29): Simple function to determine distance between two locations based on coordinates
- [`addressStirng`](/extras.sql#L32-57): Prettifies the address of a location and returns a single string that contains the entire address comma-separated. Used in:
[fetching doctor schedule](src/lib/repositories/appointment-repository.ts#L193-226), [hospital locations](src/lib/repositories/appointment-repository.ts#L298-331).
- [`get_doctor_specializations`](/extras.sql#L67-80): Lists all specializations of the doctor.
- [`medicinecount`](/triggers.sql#L61-71) and [`testcount`](/triggers.sql#L74-84): returns number of tests and medicine of a relevant prescription
- [`confirm_appointment`](/triggers.sql#L87-149): Designates an hourslot of a chamber schedule to an appointment. The entire functions locks the relevant chamber schedule for update, then finds the number of slots available and designates a time based on availability. also [`add_appointment`](/triggers.sql#L151-168) is used in tandem to handle the appointment workflow
 

### 10. Triggers
- Defined in `triggers.sql`, these are database-level rules that automatically execute certain actions in response to specific events (like inserts, updates, or deletes).
- [`rejected_doctor_handler`](/triggers.sql#L1-21):  automatically updates the role in **Users** table or creates a row in **RejectedDoctors** table based on the change in doctor status
- [`appointment_status_update_checker`](/triggers.sql#L172-189): auto blocks appointment requests or approvals that were made later than the expected time (3 hours prior to schedule).
- [`completing_appointment`](/triggers.sql#L210-253): Automatically sets appointment as completed based to doctor workflow. Whenever an entry is made into prescriptions for a specific appointment, it is marked as completed.

### 11. User Flows and Interactions
- The application supports various user flows, such as patient registration, login, viewing the dashboard, and managing medical records.
- **Registration:** Handled by [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts) which uses [src/lib/repositories/user-repository.ts](src/lib/repositories/user-repository.ts) to create a new user in the database.
- **Login:** Managed by [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts) which verifies user credentials and creates a session token using [src/lib/auth/session.ts](src/lib/auth/session.ts).
- **Logout:** Handled by [src/app/api/auth/logout/route.ts](src/app/api/auth/logout/route.ts) which clears the authenticated session cookie.
- **Viewing Dashboard:** The dashboard page at [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx) fetches user-specific data (appointments, prescriptions, test reports) using API routes that query the database through repositories.
- **Booking Appointments:** The appointment booking page at [src/app/appointment/booking-doctor/page.tsx](src/app/appointment/booking-doctor/page.tsx) allows patients to select a doctor and time slot, with API endpoints at [src/app/api/doctor/appointments/route.ts](src/app/api/doctor/appointments/route.ts).
- **Viewing Prescriptions:** The check prescriptions page at [src/app/dashboard/check-prescription/page.tsx](src/app/dashboard/check-prescription/page.tsx) fetches the patient's prescriptions using [src/app/api/prescription/route.ts](src/app/api/prescription/route.ts) which queries `prescription-repository.ts` for relevant data.
- **Uploading Test Reports:** The test reports page at [src/app/dashboard/check-reports/page.tsx](src/app/dashboard/check-reports/page.tsx) allows patients to upload and view test reports, handled by [src/app/api/tests/route.ts](src/app/api/tests/route.ts) and [src/lib/repositories/test-report-repository.ts](src/lib/repositories/test-report-repository.ts).
- **Writing Prescriptions (Doctors):** Doctors can write prescriptions from the doctor appointments view at [src/app/dashboard/doctor-appointments/page.tsx](src/app/dashboard/doctor-appointments/page.tsx), which uses [src/app/api/prescription/route.ts](src/app/api/prescription/route.ts) to create new prescription records with medicines and tests.
- **Managing Appointments (Doctors):** Doctors can view and manage their appointments at [src/app/dashboard/doctor-appointments/page.tsx](src/app/dashboard/doctor-appointments/page.tsx), fetching data through [src/app/api/doctor/appointments/route.ts](src/app/api/doctor/appointments/route.ts) which queries `appointment-repository.ts` and `doctor-appointment-repository.ts`.
- **Chamber Management (Doctors):** Doctors can add and manage their chambers (clinics) via [src/app/dashboard/add-chamber/page.tsx](src/app/dashboard/add-chamber/page.tsx) using [src/app/api/doctor/chambers/route.ts](src/app/api/doctor/chambers/route.ts).
- **Admin Functions:** Admins can review pending doctors, manage medicines, and handle diagnostics through pages at [src/app/admin/page.tsx](src/app/admin/page.tsx) using admin API routes in [src/app/api/admin/](src/app/api/admin/).