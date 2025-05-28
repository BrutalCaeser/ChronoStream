import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, UserCog, Cast } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
            Welcome to ChronoStream
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly manage patient records and stream live video with our secure, real-time platform. Designed for clarity and ease of use in medical environments.
          </p>
        </section>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link href="/admin/patients" legacyBehavior>
            <a className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <UserCog className="h-8 w-8 text-accent" />
                    <CardTitle className="text-2xl">Admin Panel</CardTitle>
                  </div>
                  <CardDescription>
                    Manage patient records, initiate new video streams, and oversee system operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                  <Button variant="outline" className="w-full mt-4">
                    Go to Admin <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </a>
          </Link>

          <Link href="/stream-viewer" legacyBehavior>
             <a className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Cast className="h-8 w-8 text-accent" />
                    <CardTitle className="text-2xl">View Live Stream</CardTitle>
                  </div>
                  <CardDescription>
                    Access and view active video streams in near real-time. Requires a valid Stream ID.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                   <Button variant="outline" className="w-full mt-4">
                    View Streams <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </a>
          </Link>
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ChronoStream. All rights reserved.
      </footer>
    </div>
  );
}
