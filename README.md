# 🏥 CareSync - Backend

CareSync is a comprehensive, scalable, and secure healthcare management platform. This repository contains the **Backend** API services, powering the telemedicine capabilities, AI health assistants, real-time communications, and database management for the entire platform.

## 🏗️ Technology Stack

- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma (Type-safe database access and migrations)
- **Real-Time:** Socket.IO (Chat, notifications, WebRTC signaling)
- **Security:** JWT (JSON Web Tokens), `bcryptjs`, `helmet`, `xss`
- **AI Integration:** Azure OpenAI (Smart healthcare assistant)
- **Telemedicine:** Azure Communication Identity (Token generation for video calls)
- **File Uploads:** Multer (For medical reports, profile pictures, and service images)
- **Email Service:** Nodemailer (OTP verification, appointment alerts)
- **Payment Gateway:** PayHere

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd CareSyncBackend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory based on the following template:
   ```env
   # Server Config
   PORT=5000
   NODE_ENV=development
   
   # JWT Security
   JWT_SECRET=supersecretjwtkey12345!
   JWT_EXPIRES_IN=7d
   
   # Mailtrap / Nodemailer
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_smtp_user
   SMTP_PASS=your_smtp_password
   
   # Prisma URL (PostgreSQL)
   DATABASE_URL="postgres://user:password@localhost:5432/caresync?sslmode=disable"
   
   # Azure OpenAI & Telemedicine
   ACS_CONNECTION_STRING=your_acs_connection_string
   AZURE_OPENAI_ENDPOINT=your_openai_endpoint
   AZURE_OPENAI_KEY=your_openai_key
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-small
   AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=my-chatbot-model
   
   # PayHere
   PAYHERE_MERCHANT_ID=your_merchant_id
   PAYHERE_SECRET=your_payhere_secret
   ```

### Database Setup

1. Initialize Prisma and push the schema to your database (or run migrations):
   ```bash
   npm run migrate
   ```
   *(Depending on your workflow, you can also use `npx prisma db push` or `npx prisma migrate dev`)*

2. Seed the database (if applicable):
   ```bash
   npx prisma db seed
   ```

### Running the Server

- **Development Mode** (with nodemon auto-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
  The API should now be running on `http://localhost:5000`.

## 🗄️ Database Schema Highlights (Prisma)
- **`users`**: Core identity table storing all roles (Patient, Doctor, Admin, Receptionist) and biometric descriptors.
- **`doctor_profiles` & `doctor_schedules`**: Manages doctor-specific metadata, pricing, and availability constraints.
- **`appointments` & `service_bookings`**: The central transactional tables tracking all consultations and hospital services (e.g., MRI, X-Ray).
- **`medical_reports`**: Stores metadata and file paths for uploaded patient records.
- **`reviews`**: Links patients, doctors, and appointments for quality assurance.

## 🔒 Security Measures
- **Data in Transit:** External traffic is forcefully encrypted via HTTPS / TLS.
- **Authentication:** Stateless JWT authentication prevents session hijacking and CSRF vulnerabilities.
- **Data Protection:** All user passwords are irreversibly hashed with `bcrypt`. API keys are securely loaded from env variables.
- **Validation:** `helmet` and `xss` modules are utilized to protect against XSS and similar injection attacks.
- **Rate Limiting:** `express-rate-limit` prevents brute-force and DDoS attacks on the API.

## 🚀 Deployment Guide (Docker / AKS)

1. **Build Image:**
   ```bash
   docker build -t caresync.azurecr.io/caresync-backend:latest .
   ```
2. **Push to Azure Container Registry:**
   ```bash
   docker push caresync.azurecr.io/caresync-backend:latest
   ```
3. **Database Migrations on K8s:**
   Exec into the backend pod and run Prisma migrations to initialize the schema:
   ```bash
   kubectl exec -it deployment/caresync-backend -- npm run migrate
   ```
4. **Deploy Workloads:**
   ```bash
   kubectl apply -f deployment.yaml
   ```
