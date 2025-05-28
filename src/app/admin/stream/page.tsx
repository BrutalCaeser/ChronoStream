import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Patient } from "@/types";
import { VideoRecorderClient } from "@/components/stream/video-recorder-client"; // Adjusted path

async function getPatients(): Promise<Patient[]> {
  try {
    const patientsCol = collection(db, "patients");
    const q = query(patientsCol, orderBy("name", "asc")); // Order by name for dropdown
    const patientSnapshot = await getDocs(q);
    const patientList = patientSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure timestamps are serializable or handle on client if needed
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        dateOfBirth: data.dateOfBirth,
      } as Patient;
    });
    return patientList;
  } catch (error) {
    console.error("Error fetching patients for streaming:", error);
    return [];
  }
}

export default async function StreamCapturePage() {
  const patients = await getPatients();

  return (
    <div className="container mx-auto py-4">
      <VideoRecorderClient patients={patients} />
    </div>
  );
}

// This page relies on fresh patient data when loaded.
export const revalidate = 0; 
