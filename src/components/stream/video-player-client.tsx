"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, getDownloadURL } from "firebase/storage";
import type { VideoStreamChunk, Stream } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlayCircle, PauseCircle, AlertTriangle, Loader2, Tv2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerClientProps {
  streamId: string;
}

export function VideoPlayerClient({ streamId }: VideoPlayerClientProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [chunks, setChunks] = useState<VideoStreamChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<Stream | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastPlayedOrder, setLastPlayedOrder] = useState<number>(-1);

  const firebaseStorage = getStorage();

  // Fetch stream information
  useEffect(() => {
    const streamDocRef = doc(db, "streams", streamId);
    const unsubscribe = onSnapshot(streamDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Stream;
        setStreamInfo({ ...data, id: docSnap.id });
        if (data.status === 'error') {
          setError("Stream encountered an error.");
        } else if (data.status === 'stopped' && chunks.length === 0 && currentChunkIndex === 0) {
           // If stream is stopped and we haven't played anything, it might be an old stream.
           // Handled by chunk listener as well.
        }
      } else {
        setError("Stream not found.");
        toast({ title: "Error", description: "Stream not found.", variant: "destructive" });
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Error fetching stream info:", err);
      setError("Failed to fetch stream information.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [streamId, toast]);


  // Fetch and listen for new chunks
  useEffect(() => {
    if (!streamId) return;

    const chunksQuery = query(
      collection(db, "streams", streamId, "chunks"),
      orderBy("order", "asc")
    );

    const unsubscribe = onSnapshot(chunksQuery, async (snapshot) => {
      setIsLoading(true);
      const fetchedChunks: VideoStreamChunk[] = [];
      for (const docSnap of snapshot.docs) {
        const chunkData = docSnap.data() as Omit<VideoStreamChunk, 'id' | 'url'>;
        try {
          const url = await getDownloadURL(storageRef(firebaseStorage, chunkData.storagePath));
          fetchedChunks.push({ ...chunkData, id: docSnap.id, url });
        } catch (e) {
          console.error("Error fetching chunk URL:", e);
          // Potentially skip this chunk or mark as errored
        }
      }
      
      setChunks(fetchedChunks);
      setIsLoading(false);
      if (fetchedChunks.length === 0 && streamInfo?.status === 'stopped') {
        setError("Stream has ended or no chunks are available.");
      } else {
        setError(null); // Clear previous errors if chunks load
      }
    }, (err) => {
      console.error("Error fetching chunks:", err);
      setError("Failed to load video chunks.");
      toast({ title: "Error", description: "Could not load video chunks.", variant: "destructive" });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [streamId, toast, firebaseStorage, streamInfo?.status]);
  
  const playNextChunk = useCallback(() => {
    if (currentChunkIndex < chunks.length && videoRef.current) {
        const chunkToPlay = chunks[currentChunkIndex];
        if (chunkToPlay.url && chunkToPlay.order > lastPlayedOrder) {
            videoRef.current.src = chunkToPlay.url;
            videoRef.current.load(); // Important for some browsers
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setLastPlayedOrder(chunkToPlay.order);
                })
                .catch(e => {
                    console.error("Error playing video:", e);
                    setIsPlaying(false);
                    // Try to play next if this one fails, or show error
                    if (e.name === "NotSupportedError") {
                         setError(`Video format may not be supported, or chunk is corrupted (Chunk ${chunkToPlay.order}).`);
                    } else {
                         setError(`Error playing chunk ${chunkToPlay.order}.`);
                    }
                });
        } else if (chunkToPlay.order <= lastPlayedOrder) {
            // Already played or attempted, move to next
            setCurrentChunkIndex(prev => prev + 1);
        }
    } else if (currentChunkIndex >= chunks.length && streamInfo?.status === 'stopped') {
        toast({ title: "Playback Finished", description: "All available chunks have been played." });
        setIsPlaying(false);
    }
  }, [currentChunkIndex, chunks, streamInfo, toast, lastPlayedOrder]);


  useEffect(() => {
    if (chunks.length > 0 && currentChunkIndex < chunks.length && !isPlaying && videoRef.current?.paused) {
      // If player is paused (e.g. initial load or after a chunk ended) and we have new chunks
      // or currentChunkIndex was incremented, try playing.
      // This logic focuses on auto-advancing. Manual play/pause would need more state.
      playNextChunk();
    }
  }, [chunks, currentChunkIndex, playNextChunk, isPlaying]);


  const handleVideoEnded = () => {
    setIsPlaying(false); // Current chunk finished
    if (currentChunkIndex < chunks.length - 1) {
      setCurrentChunkIndex(prevIndex => prevIndex + 1);
    } else if (streamInfo?.status === 'recording') {
      // Waiting for more chunks
      toast({ description: "Waiting for the next video segment...", duration: 3000 });
    } else if (streamInfo?.status === 'stopped') {
      toast({ title: "Stream Ended", description: "The live stream has finished." });
    }
  };
  
  const handleManualPlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.src) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error("Play error", e));
      } else {
        // If no src, try to play the current/next chunk
        playNextChunk();
      }
    }
  };

  let statusMessage = "Loading stream...";
  let statusColor = "text-yellow-500";
  if (streamInfo?.status === 'recording') { statusMessage = "LIVE"; statusColor = "text-red-500 animate-pulse"; }
  else if (streamInfo?.status === 'stopped') { statusMessage = "STREAM ENDED"; statusColor = "text-gray-500"; }
  else if (streamInfo?.status === 'idle') { statusMessage = "STREAM IDLE"; statusColor = "text-blue-500"; }
  else if (streamInfo?.status === 'error') { statusMessage = "STREAM ERROR"; statusColor = "text-destructive"; }


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Tv2 className="h-7 w-7 text-primary" /> Live Stream Player
            </CardTitle>
            <span className={`text-sm font-semibold px-2 py-1 rounded-md ${statusColor}`}>
              {statusMessage}
            </span>
        </div>
        {streamInfo && (
          <CardDescription>
            Patient: {streamInfo.patientName || "N/A"} (Stream ID: {streamId})
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && !isLoading && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5"/> <p>{error}</p>
          </div>
        )}
        {isLoading && (
           <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading video stream, please wait...</p>
          </div>
        )}
        {!isLoading && (
          <div className="bg-black border rounded-lg overflow-hidden aspect-video relative">
            <video
              ref={videoRef}
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error("Video element error:", e);
                setError(`Video playback error for chunk ${currentChunkIndex}. Check console.`);
                // Optionally try to advance to next chunk or show more specific error.
              }}
              playsInline
              className="w-full h-full object-contain"
            // controls // Enable browser controls if preferred over custom ones
            />
             {!isPlaying && chunks.length > 0 && currentChunkIndex >= chunks.length && streamInfo?.status === 'stopped' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                    <Tv2 className="h-16 w-16 mb-2 opacity-50"/>
                    Stream has ended.
                </div>
            )}
          </div>
        )}
        <div className="flex justify-center">
          <Button onClick={handleManualPlayPause} disabled={isLoading || (chunks.length === 0 && !streamInfo?.status)}>
            {isPlaying ? <PauseCircle className="mr-2 h-5 w-5" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
         {chunks.length > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Playing chunk {currentChunkIndex + 1} of {chunks.length}. Last order received: {streamInfo?.chunkOrder || 0}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
