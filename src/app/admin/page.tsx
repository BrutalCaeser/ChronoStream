import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/patients');
  // Or return a dashboard overview
  // return (
  //   <div>
  //     <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
  //     <p>Welcome to the ChronoStream admin panel.</p>
  //   </div>
  // );
}
