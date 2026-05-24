# OnTime - Smart Attendance & HR Management Web Console

Welcome to the OnTime Web Administration repository! This is a robust React application built with Vite and Tailwind CSS, serving as the centralized management console for corporate administrators and managers. This web portal works in tandem with the OnTime mobile application to handle real-time geofence rule configurations, track employee live presence streams, manage shift distributions, and process workflow requests securely via Firebase.

## Features

1. **Role-Based Access Control (RBAC) & Management**
   * Dedicated, secure administrative views for managing system access, employee roles, onboarding invitations, and overall profile infrastructure.

2. **Real-Time Presence Tracking & Geofencing Operations**
   * Integrates Firestore `collectionGroup` streams to monitor live, on-site check-in events. Attendance data dynamically updates and isolates matching metrics based on the active branch zone selection.

3. **Geofence Gates Configuration**
   * An interactive control interface enabling administrators to instantly update corporate office profiles, custom latitude/longitude coordinate fields, and strict verification radii.

4. **Reactive Shift Planner**
   * A calendar-linked quick shift template manager used to assign operational timeframes and distribute workloads cleanly across employee structures.

5. **Workflow Approvals & Report Generator**
   * **Pending Approvals:** Real-time monitoring feed to instantly review, approve, or reject employee leave and medical claims with live balance adjustments.
   * **Analytics:** Tools to configure structural parameters and compile spreadsheets/analytics reports from historical attendance records.

## Getting Started

To run the web console application locally, follow these steps:

1. **Prerequisites**
   * Ensure you have Node.js (v18.0.0 or higher) and npm/yarn installed on your machine.

2. **Install Dependencies**
   * Navigate to the root folder and fetch all required dependencies (`lucide-react`, `firebase`, etc.) using:
     ```bash
     npm install
     ```

3. **Firebase Environment Configuration**
   * Create a `.env.local` file in the project's root directory to provide your web Firebase credentials:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. **Running the Application**
   * Launch the local Vite development server by executing:
     ```bash
     npm run dev
     ```
   * Open your browser and navigate to `http://localhost:5173`.

## Contributing

We welcome contributions to enhance this project. If you have suggestions or improvements, please create an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---
Thank you for exploring the OnTime project! We hope this application helps you streamline HR and attendance management. Happy coding!
