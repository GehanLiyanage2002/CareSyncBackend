const db = require('./config/db');
const { AzureOpenAI } = require("openai");
const dotenv = require('dotenv');

dotenv.config();

// 1. Setup Azure OpenAI Client
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

const client = new AzureOpenAI({ endpoint, apiKey, apiVersion });
const embeddingDeploymentName = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME; 

const knowledgeChunks = [
  // General Info
  "CareSync is a comprehensive healthcare platform connecting patients, doctors, receptionists, and administrators. It streamlines appointment booking, telemedicine, and medical records management.",
  "The CareSync platform supports four main user roles: Patient, Doctor, Receptionist, and Admin. Each role has a dedicated dashboard with specific privileges.",
  
  // Patient Features
  "Patients can search for doctors by specialization, view doctor profiles, check their availability schedules, and read reviews left by other patients.",
  "To book a doctor's appointment, a Patient must go to the Doctors tab, select 'Book Now' for a specific doctor, choose an available time slot from the calendar, and confirm.",
  "Patients can book two types of appointments: In-Person visits and Telemedicine (video call) sessions.",
  "Patients can access their medical history, upload medical reports, and manage their personal medical profile (blood group, allergies, chronic conditions) from the Patient Dashboard.",
  "Patients have the ability to leave a rating and review for a doctor only after their appointment has been marked as Completed.",
  "Patients can book additional medical services (like blood tests or physical therapy) by going to the 'Services' tab and selecting a service provided by the clinic.",

  // Doctor Features
  "Doctors have a Kanban-style board on their dashboard. This board helps them visually manage their appointments by dragging them across columns like Pending, Confirmed, and Completed.",
  "From the Doctor Dashboard, doctors can manage their consultation fees using the Fee Manager and set their availability schedules.",
  "Doctors can view a patient's past medical records, uploaded reports, and medical profile before or during an appointment to ensure accurate diagnosis.",
  "Doctors conduct Telemedicine sessions directly through the CareSync platform using the built-in video room feature, which activates at the time of the appointment.",
  
  // Receptionist Features
  "Receptionists handle the front desk operations. They can view the daily schedule of all doctors, check-in patients as they arrive, and manually update appointment statuses.",
  "Receptionists can assist patients with manual bookings and can view payment or fee statuses for appointments.",

  // Admin Features
  "Admins have complete oversight of the system. They are responsible for adding new doctors to the platform, setting up their initial profiles, and managing their basic configurations.",
  "Admins manage the system's Medical Services catalog. They can add new services (e.g., MRI, X-Ray), set their prices, and upload service images.",
  "The Admin Dashboard provides analytics and an overview of platform activity, total users, total doctors, and total appointments.",
  
  // Telemedicine & Technical
  "CareSync's Telemedicine feature uses real-time WebRTC and Socket.io for video calls. The video room is secured and restricted only to the specific Patient and Doctor of that appointment.",
  "CareSync uses a responsive, modern interface. Users can easily update their profile images and passwords from the 'Edit Profile' page across any role."
];

async function seedKnowledge() {
  console.log("Starting to insert system knowledge...");

  try {
    for (const chunk of knowledgeChunks) {
      console.log(`\nProcessing chunk: "${chunk.substring(0, 30)}..."`);
      
      // Step A: Generate embedding for the text chunk
      const embeddingResponse = await client.embeddings.create({
        model: embeddingDeploymentName,
        input: chunk
      });
      const embeddingArray = embeddingResponse.data[0].embedding;
      
      // pgvector expects embeddings in the format '[0.1, 0.2, 0.3...]'
      const embeddingStr = `[${embeddingArray.join(',')}]`;

      // Step B: Insert into the database
      await db.query(
        `INSERT INTO system_knowledge (content, embedding) VALUES ($1, $2::vector)`,
        [chunk, embeddingStr]
      );
      
      console.log("✅ Inserted successfully.");
    }
    
    console.log("\nAll system data has been vectorized and inserted successfully!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Error inserting knowledge:", err);
    process.exit(1);
  }
}

seedKnowledge();
