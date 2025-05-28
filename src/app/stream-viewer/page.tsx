"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Tv2, ListVideo, Loader2 } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import type { Stream } from "@/types";
import { formatDistanceToNow } from 'date-fns';

interface ListedStream extends Stream {
  displayDate: string;
}

export default function StreamViewerPage() {
  const router = useRouter();
  const [streamIdInput, setStreamIdInput] = useState("");
  const [recentStreams, setRecentStreams] = useState<ListedStream[]>([]);
  const [isLoadingStreams, setIsLoadingStreams] = useState(true);

  useEffect(() => {
    async function fetchRecentStreams() {
      setIsLoadingStreams(true);
      try {
        const streamsCol = collection(db, "streams");
        const q = query(streamsCol, orderBy("updatedAt", "desc"), limit(10));
        const streamSnapshot = await getDocs(q);
        const streamsList = streamSnapshot.docs.map(doc => {
          const data = doc.data() as Stream;
          const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date();
          return {
            ...data,
            id: doc.id,
            displayDate: formatDistanceToNow(updatedAt, { addSuffix: true }),
          } as ListedStream;
        });
        setRecentStreams(streamsList);
      } catch (error) {
        console.error("Error fetching recent streams:", error);
        // Optionally show a toast message
      } finally {
        setIsLoadingStreams(false);
      }
    }
    fetchRecentStreams();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (streamIdInput.trim()) {
      router.push(`/stream/${streamIdInput.trim()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
            View Video Stream
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Enter a Stream ID to watch a live or recorded session, or select from recently active streams below.
          </p>
        </section>

        <Card className="max-w-md mx-auto mb-16 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Tv2 className="h-6 w-6 text-accent"/> Access by Stream ID</CardTitle>
            <CardDescription>Enter the unique ID of the stream you wish to view.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Input
                type="text"
                placeholder="Enter Stream ID"
                value={streamIdInput}
                onChange={(e) => setStreamIdInput(e.target.value)}
                className="text-base"
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                View Stream <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>

        <section>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-6 text-center flex items-center justify-center gap-2">
            <ListVideo className="h-7 w-7 text-primary" /> Recently Active Streams
          </h2>
          {isLoadingStreams ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : recentStreams.length === 0 ? (
            <p className="text-center text-muted-foreground">No recent streams found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentStreams.map((stream) => (
                <Link key={stream.id} href={`/stream/${stream.id}`} legacyBehavior>
                  <a className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
                    <Card className="h-full flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl leading-tight">
                            Patient: {stream.patientName || "Unknown"}
                          </CardTitle>
                          <span 
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold
                              ${stream.status === 'recording' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' : 
                                stream.status === 'stopped' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'}`}
                          >
                            {stream.status.toUpperCase()}
                          </span>
                        </div>
                        <CardDescription className="text-xs">
                          Stream ID: <span className="font-mono">{stream.id}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">
                          Last activity: {stream.displayDate}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full text-sm">
                          Watch Stream <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ChronoStream. All rights reserved.
      </footer>
    </div>
  );
}
