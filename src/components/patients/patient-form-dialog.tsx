"use client";

import React, { useEffect } from "react";
import { useFormState } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatientAction, updatePatientAction, PatientFormState } from "@/app/admin/patients/patient-actions";
import type { Patient } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, PlusCircle, Edit } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

const patientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Date of birth must be in YYYY-MM-DD format.",
  }),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  mrn: z.string().min(1, "MRN is required"),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormDialogProps {
  patient?: Patient | null;
  children: React.ReactNode; // Trigger element
}

const initialFormState: PatientFormState = { message: "", success: false };

export function PatientFormDialog({ patient, children }: PatientFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  
  const action = patient ? updatePatientAction.bind(null, patient.id) : createPatientAction;
  const [formState, formAction] = useFormState(action, initialFormState);

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: patient?.name || "",
      dateOfBirth: patient?.dateOfBirth ? format(parseISO(patient.dateOfBirth), 'yyyy-MM-dd') : "",
      email: patient?.email || "",
      mrn: patient?.mrn || "",
    },
  });

  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name,
        dateOfBirth: patient.dateOfBirth ? format(parseISO(patient.dateOfBirth), 'yyyy-MM-dd') : "",
        email: patient.email || "",
        mrn: patient.mrn,
      });
    } else {
      form.reset({ name: "", dateOfBirth: "", email: "", mrn: "" });
    }
  }, [patient, form, open]);


  useEffect(() => {
    if (formState?.message) {
      toast({
        title: formState.success ? "Success" : "Error",
        description: formState.message,
        variant: formState.success ? "default" : "destructive",
      });
      if (formState.success) {
        setOpen(false);
        form.reset(); 
      }
    }
  }, [formState, toast, form]);
  
  const onSubmit = (data: PatientFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    formAction(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit Patient" : "Add New Patient"}</DialogTitle>
          <DialogDescription>
            {patient ? "Update the patient's details." : "Enter the details for the new patient."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
            {formState?.errors?.name && <p className="text-sm text-destructive mt-1">{formState.errors.name[0]}</p>}
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("dateOfBirth") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("dateOfBirth") ? format(parseISO(form.watch("dateOfBirth")), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("dateOfBirth") ? parseISO(form.watch("dateOfBirth")) : undefined}
                  onSelect={(date) => form.setValue("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.dateOfBirth && <p className="text-sm text-destructive mt-1">{form.formState.errors.dateOfBirth.message}</p>}
            {formState?.errors?.dateOfBirth && <p className="text-sm text-destructive mt-1">{formState.errors.dateOfBirth[0]}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email && <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>}
            {formState?.errors?.email && <p className="text-sm text-destructive mt-1">{formState.errors.email[0]}</p>}
          </div>
          <div>
            <Label htmlFor="mrn">Medical Record Number (MRN)</Label>
            <Input id="mrn" {...form.register("mrn")} />
            {form.formState.errors.mrn && <p className="text-sm text-destructive mt-1">{form.formState.errors.mrn.message}</p>}
            {formState?.errors?.mrn && <p className="text-sm text-destructive mt-1">{formState.errors.mrn[0]}</p>}
          </div>
          {formState?.errors?._form && <p className="text-sm text-destructive mt-1">{formState.errors._form[0]}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : (patient ? "Save Changes" : "Create Patient")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
