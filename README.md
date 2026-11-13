# Digital Student Notice Board — Global Academy of Technology (GAT)

A centralized, real-time Digital Student Notice Board Web Application for **Global Academy of Technology, Rajarajeshwari Nagar, Bengaluru, Karnataka**.

## Key Features
- **Public Notice Board Homepage**: Latest announcements, urgent notifications banner, category & department filters, keyword search, upcoming & completed events, and verified college contact details.
- **Student Dashboard**: Google Sign-In + USN/Department registration, department-filtered notice board, bookmarking, read-receipt tracking, PDF circular preview & download, personal notification history, and alert preferences.
- **Faculty Dashboard**: Department-specific notice publishing, academic circular uploads, event authoring, and administrator-controlled publishing permissions.
- **Administrator Console**: Full notice lifecycle management (publish immediately, schedule future dates, pin notices, mark urgent/important, set expiry dates, auto-archive expired circulars), event management, student & faculty account controls, configurable department structure, broadcast alerts, and student activity audit logs.
- **Light & Dark Mode**: Full dual-theme UI tailored in GAT Navy Blue, White, and Gold.

## Local Setup in Visual Studio Code
1. Open the project folder in **Visual Studio Code**.
2. Install Node.js (v18+ or v20+ LTS).
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server on port 3000:
   ```bash
   npm run dev
   ```
5. Type-check and lint:
   ```bash
   npm run lint
   ```

## Firebase Configuration & Deployment
1. Firebase configuration is stored in `firebase-applet-config.json` (project ID, Auth domain, Firestore database ID, and Storage bucket).
2. Enable **Google Sign-In** in Firebase Authentication and **Cloud Firestore** + **Firebase Storage** in your Firebase Console.
3. Deploy Firestore security rules (`firestore.rules`) via Firebase CLI:
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules
   ```
4. Build the production bundle:
   ```bash
   npm run build
   ```
5. Review and harden `firestore.rules` before sharing the application broadly.
