# 🏥 CareSync - Modern Healthcare Management Platform

CareSync is a comprehensive, scalable, and secure healthcare management platform designed to bridge the gap between patients, doctors, receptionists, and hospital administrators. It features telemedicine capabilities, AI-powered health assistants, real-time communications, and role-based dashboards.

---

## 🏗️ Architecture & Technology Stack

The platform is divided into a robust micro-services style architecture, containerized and deployed on Microsoft Azure.

### 💻 Frontend (`CareSyncFrontend`)
- **Framework:** React.js (Vite for fast bundling)
- **Styling:** Tailwind CSS (Modern, responsive UI)
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM
- **Real-Time:** Socket.IO Client
- **Telemedicine:** Azure Communication Services (Calling & Chat UI)
- **AI/Biometrics:** `face-api.js` for facial recognition login
- **Utilities:** `jspdf` & `jspdf-autotable` for generating medical prescriptions and reports
- **Drag & Drop:** `@hello-pangea/dnd` for the Doctor's Kanban appointment board

### ⚙️ Backend (`CareSyncBackend`)
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma (Type-safe database access and migrations)
- **Real-Time:** Socket.IO (Chat, notifications, WebRTC signaling)
- **Security:** JWT (JSON Web Tokens), `bcryptjs`
- **AI Integration:** Azure OpenAI (Smart healthcare assistant)
- **Telemedicine:** Azure Communication Identity (Token generation for video calls)
- **File Uploads:** Multer (For medical reports, profile pictures, and service images)
- **Email Service:** Nodemailer (OTP verification, appointment alerts)

### ☁️ Infrastructure & Deployment
- **Containerization:** Docker
- **Orchestration:** Azure Kubernetes Service (AKS)
- **Routing:** NGINX Ingress Controller
- **Security:** TLS/HTTPS via `cert-manager` & Let's Encrypt
- **Registry:** Azure Container Registry (ACR)

---

## 🔄 System Flow

### 1. Authentication & Security Flow
- **Registration:** Users (Patients/Doctors) register. An OTP is instantly sent via Nodemailer for email verification to prevent spam accounts.
- **Biometric Setup:** Users can optionally register their facial geometry (`face_descriptor`) during profile setup.
- **Login:** Users authenticate via password or facial recognition. Upon success, a secure JWT is issued.
- **RBAC (Role-Based Access Control):** The JWT payload strictly dictates access to specific routes (Patient, Doctor, Receptionist, or Admin).

### 2. Patient Flow
- **Dashboard:** Centralized hub to view upcoming appointments, recent medical reports, and interact with the AI assistant.
- **Booking:** Browse available doctors and hospital services. Select time slots (validated in real-time against `doctor_schedules`) and confirm bookings.
- **Telemedicine:** Join a secure video room via Azure Communication Services at the exact time of the appointment.
- **History:** Access comprehensive medical history and download PDF prescriptions.

### 3. Doctor Flow
- **Kanban Dashboard:** Manage daily appointments using an intuitive drag-and-drop Kanban board (moving patients from *Pending* -> *Confirmed* -> *Completed*).
- **Consultation:** Join telemedicine rooms, chat with patients, and update medical records on the fly.
- **Availability:** Dynamically set working schedules, slot durations, and consultation fees.
- **Reviews:** View patient feedback and ratings.

### 4. Admin & Receptionist Flow
- **Admin:** Approve new doctor registrations, manage global hospital services, and oversee system analytics.
- **Receptionist:** Handle in-person walk-ins, manually book appointments, and manage the live physical queue via token numbers.

---

## 🗄️ Database Schema Highlights (Prisma)

The PostgreSQL database is heavily relational to ensure data integrity:
- **`users`**: Core identity table storing all roles (Patient, Doctor, Admin, Receptionist) and biometric descriptors.
- **`doctor_profiles` & `doctor_schedules`**: Manages doctor-specific metadata, pricing, and availability constraints.
- **`appointments` & `service_bookings`**: The central transactional tables tracking all consultations and hospital services (e.g., MRI, X-Ray).
- **`medical_reports`**: Stores metadata and file paths for uploaded patient records.
- **`reviews`**: Links patients, doctors, and appointments for quality assurance.

---

## 🔒 Security Measures

- **Data in Transit:** All external traffic is forcefully encrypted using HTTPS via Let's Encrypt SSL/TLS certificates.
- **Authentication:** Stateless JWT authentication prevents session hijacking and CSRF vulnerabilities.
- **Biometrics:** `face-api.js` enables highly secure, passwordless authentication, ensuring the person logging in is physically present.
- **Data Protection:** All user passwords are irreversibly hashed with `bcrypt`. Database connection strings and API keys are stored securely in Kubernetes Secrets.
- **Network Isolation:** Kubernetes internal services (like the Node.js backend) are completely isolated from the public internet. Only the NGINX Ingress Controller exposes necessary endpoints (`/api` and `/socket.io`).
- **CORS & Proxying:** Frontend NGINX is configured to dynamically rewrite API routes, preventing Cross-Origin Resource Sharing (CORS) exploits and obscuring internal network topologies.

---

## 🚀 Deployment Guide (AKS)

1. **Build & Push Images:**
   ```bash
   docker build -t caresync.azurecr.io/caresync-backend:latest ./CareSyncBackend
   docker build -t caresync.azurecr.io/caresync-frontend:latest ./CareSyncFrontend
   docker push caresync.azurecr.io/caresync-backend:latest
   docker push caresync.azurecr.io/caresync-frontend:latest
   ```
2. **Apply Secrets:**
   Ensure database URLs and Azure keys are applied to the cluster via Kubernetes Secrets (`secret.yaml`).
3. **Deploy Workloads:**
   ```bash
   kubectl apply -f backend/deployment.yaml
   kubectl apply -f frontend/deployment.yaml
   ```
4. **Configure Ingress & TLS:**
   ```bash
   # Assign Azure DNS Label to Public IP
   az network public-ip update --resource-group <rg-name> --name <ip-name> --dns-name caresync-app
   
   # Apply Let's Encrypt Issuer and Ingress
   kubectl apply -f ingress/cluster-issuer.yaml
   kubectl apply -f ingress/nginx-ingress.yaml
   ```
5. **Database Migrations:**
   Exec into the backend pod and run Prisma migrations to initialize the schema:
   ```bash
   kubectl exec -it deployment/caresync-backend -- npm run migrate
   ```
