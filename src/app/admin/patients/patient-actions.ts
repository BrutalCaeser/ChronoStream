"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { Patient } from "@/types";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Date of birth must be in YYYY-MM-DD format.",
  }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  mrn: z.string().min(1, "MRN is required"),
});

export type PatientFormState = {
  message: string;
  errors?: {
    name?: string[];
    dateOfBirth?: string[];
    email?: string[];
    mrn?: string[];
    _form?: string[];
  };
  success: boolean;
};


export async function createPatientAction(
  prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const validatedFields = patientSchema.safeParse({
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    mrn: formData.get("mrn"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    const newPatientData = {
      ...validatedFields.data,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    await addDoc(collection(db, "patients"), newPatientData);
    revalidatePath("/admin/patients");
    return { message: "Patient created successfully.", success: true };
  } catch (e) {
    console.error("Failed to create patient:", e);
    return { message: "Failed to create patient. Please try again.", success: false, errors: { _form: ["Server error"] } };
  }
}

export async function updatePatientAction(
  id: string,
  prevState: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
   const validatedFields = patientSchema.safeParse({
    name: formData.get("name"),
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    mrn: formData.get("mrn"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }
  
  try {
    const patientRef = doc(db, "patients", id);
    const updatedPatientData = {
      ...validatedFields.data,
      updatedAt: serverTimestamp() as Timestamp,
    };
    await updateDoc(patientRef, updatedPatientData);
    revalidatePath("/admin/patients");
    return { message: "Patient updated successfully.", success: true };
  } catch (e) {
    console.error("Failed to update patient:", e);
    return { message: "Failed to update patient. Please try again.", success: false, errors: { _form: ["Server error"] } };
  }
}

export async function deletePatientAction(id: string): Promise<{success: boolean, message: string}> {
  try {
    await deleteDoc(doc(db, "patients", id));
    revalidatePath("/admin/patients");
    return { success: true, message: "Patient deleted successfully." };
  } catch (e) {
    console.error("Failed to delete patient:", e);
    return { success: false, message: "Failed to delete patient." };
  }
}
