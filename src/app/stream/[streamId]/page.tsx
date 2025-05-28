import { Header } from "@/components/layout/header";
import { VideoPlayerClient } from "@/components/stream/video-player-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StreamPageProps {
  params: {
    streamId: string;
  };
}

function VideoPlayerSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 mt-8">
      <Skeleton className="h-10 w-1/2" /> {/* Title placeholder */}
      <Skeleton className="h-8 w-3/4" /> {/* Description placeholder */}
      <Skeleton className="aspect-video w-full rounded-lg" /> {/* Video placeholder */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-24" /> {/* Button placeholder */}
      </div>
    </div>
  );
}


export default function StreamPage({ params }: StreamPageProps) {
  const { streamId } = params;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Suspense fallback={<VideoPlayerSkeleton />}>
          <VideoPlayerClient streamId={streamId} />
        </Suspense>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
         © {new Date().getFullYear()} ChronoStream. All rights reserved.
      </footer>
    </div>
  );
}
