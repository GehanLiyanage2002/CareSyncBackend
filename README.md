# CareSync Backend

CareSync Backend is a comprehensive RESTful API service built with Node.js, Express, and PostgreSQL (via Prisma ORM). It powers the CareSync platform, facilitating healthcare management, telemedicine, doctor appointments, real-time chat, and medical reports.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Integrations**: 
  - Azure Communication Identity (Telemedicine / Video Calls)
  - OpenAI (AI features)
  - Nodemailer (Email notifications)

## Features

- **Authentication & Authorization**: Secure login, registration, and role-based access control (Admin, Doctor, Patient).
- **User Management**: Profile management for patients and doctors.
- **Appointments**: Schedule, manage, and track doctor appointments.
- **Telemedicine**: Video consultation support using Azure Communication Services.
- **Real-time Chat**: In-app messaging via Socket.IO.
- **Medical Reports**: Upload, store, and manage medical reports and prescriptions (multer).
- **Reviews**: Patient feedback and doctor ratings.
- **Notifications**: Real-time updates and email notifications.
- **Admin Dashboard**: Comprehensive management of system entities.

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (Running instance)
- **Prisma CLI** (Optional, for manual DB management)

## Setup & Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository_url>
   cd CareSyncBackend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables Configuration**:
   Create a `.env` file in the root directory and add the necessary environment variables. Example variables to include:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/caresync?schema=public"
   
   # JWT Secret
   JWT_SECRET="your_jwt_secret_key"
   JWT_EXPIRES_IN="7d"
   
   # Azure Communication Services (Telemedicine)
   AZURE_COMMUNICATION_CONNECTION_STRING="your_azure_connection_string"
   
   # OpenAI Config
   OPENAI_API_KEY="your_openai_key"
   
   # Email Config (Nodemailer)
   EMAIL_HOST="smtp.example.com"
   EMAIL_PORT=587
   EMAIL_USER="your_email@example.com"
   EMAIL_PASS="your_email_password"
   ```
   *(Update the values according to your local or production setup)*

4. **Database Setup & Migrations**:
   Run the Prisma setup or custom migrations to initialize the database schema:
   ```bash
   # If using custom migrations script:
   npm run migrate
   
   # If using Prisma:
   npx prisma generate
   npx prisma db push
   ```

5. **Seed Database** (Optional):
   Populate the database with initial dummy data:
   ```bash
   npx prisma db seed
   ```

## Running the Application

- **Development Mode** (with auto-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The server will start on `http://localhost:5000` (or the port specified in `.env`).

## API Endpoints Overview

The API routes are mounted at `/api`. Basic routes include:

- `GET /api/health` - Server health check
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT
- `GET /api/users` - User management endpoints
- `GET /api/doctor` - Doctor management endpoints
- `GET /api/appointments` - Appointment handling
- `GET /api/chat` - Chat history and endpoints
- `GET /api/telemedicine` - Telemedicine room generation

*(For complete API documentation, refer to the Postman collection or Swagger docs if available).*

## Project Structure

```
CareSyncBackend/
├── config/           # Configuration files (DB connection, etc.)
├── controllers/      # Route controllers (business logic)
├── middlewares/      # Express middlewares (auth, error handling)
├── migrations/       # Database migration scripts
├── models/           # Data models (if using raw queries)
├── prisma/           # Prisma schema and seed scripts
├── routes/           # API route definitions
├── services/         # Third-party integrations & complex services
├── utils/            # Helper functions
├── app.js            # Express app setup
├── server.js         # Server entry point & Socket.io setup
└── package.json      # Dependencies and scripts
```

## Error Handling

The application uses a centralized error-handling middleware that formats all API errors into a standard JSON response structure. It also handles unhandled promise rejections and uncaught exceptions to prevent server crashes.

## License

This project is licensed under the ISC License.
