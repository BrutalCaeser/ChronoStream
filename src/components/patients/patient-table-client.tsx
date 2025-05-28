"use client";

import type { Patient } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, PlusCircle } from "lucide-react";
import { PatientFormDialog } from "./patient-form-dialog";
import { DeletePatientDialog } from "./delete-patient-dialog";
import { format, parseISO } from 'date-fns';

interface PatientTableClientProps {
  patients: Patient[];
}

export function PatientTableClient({ patients }: PatientTableClientProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
        <PatientFormDialog patient={null}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Patient
          </Button>
        </PatientFormDialog>
      </div>
      <div className="rounded-md border bg-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">MRN</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date of Birth</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {patients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No patients found.
                </td>
              </tr>
            )}
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{patient.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{patient.mrn}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {patient.dateOfBirth ? format(parseISO(patient.dateOfBirth), "MMMM d, yyyy") : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{patient.email || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <PatientFormDialog patient={patient}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                      </PatientFormDialog>
                      <DeletePatientDialog patientId={patient.id} patientName={patient.name}>
                         {/* This structure for DeletePatientDialog trigger in DropdownMenuItem is tricky.
                             It might be better to have DeletePatientDialog manage its own trigger if direct nesting fails.
                             For now, this assumes DropdownMenuItem can act as a trigger.
                             If not, a custom component or direct Button might be needed.
                             Alternatively, trigger a modal from onSelect.
                          */}
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                           <Trash2 className="mr-2 h-4 w-4" />
                           <span>Delete</span>
                         </DropdownMenuItem>
                      </DeletePatientDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
