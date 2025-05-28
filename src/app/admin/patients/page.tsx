import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Patient } from "@/types";
import { PatientTableClient } from "@/components/patients/patient-table-client";

async function getPatients(): Promise<Patient[]> {
  try {
    const patientsCol = collection(db, "patients");
    const q = query(patientsCol, orderBy("createdAt", "desc"));
    const patientSnapshot = await getDocs(q);
    const patientList = patientSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure timestamps are serializable if needed, or handle on client
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        dateOfBirth: data.dateOfBirth, // Keep as string "YYYY-MM-DD"
      } as Patient; // Adjust type casting as necessary
    });
    return patientList;
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
}


export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="container mx-auto py-4">
      <PatientTableClient patients={patients} />
    </div>
  );
}

export const revalidate = 0; // Or use 'force-dynamic' if needed
// Using revalidatePath in server actions is preferred for on-demand revalidation.
