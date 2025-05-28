import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UsersRound, Video, Activity } from "lucide-react";

// Mock data fetching functions - replace with actual Firebase calls
async function getPatientCount() {
  // Example: const snapshot = await getDocs(collection(db, "patients")); return snapshot.size;
  return 42; 
}

async function getActiveStreamsCount() {
  // Example: const q = query(collection(db, "streams"), where("status", "==", "recording"));
  // const snapshot = await getDocs(q); return snapshot.size;
  return 3;
}

async function getTotalStreamsCount() {
  // Example: const snapshot = await getDocs(collection(db, "streams")); return snapshot.size;
  return 15;
}

export default async function DashboardPage() {
  const patientCount = await getPatientCount();
  const activeStreamsCount = await getActiveStreamsCount();
  const totalStreamsCount = await getTotalStreamsCount();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <UsersRound className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patientCount}</div>
            <p className="text-xs text-muted-foreground">Registered patients in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStreamsCount}</div>
            <p className="text-xs text-muted-foreground">Currently live video streams</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
            <Video className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStreamsCount}</div>
            <p className="text-xs text-muted-foreground">Total video streams recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for recent activity or more stats */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent system events (placeholder).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display yet.</p>
          {/* In a real app, this would list recent patient additions, stream starts/stops etc. */}
        </CardContent>
      </Card>
    </div>
  );
}
