"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase"; // Assuming storage is also exported or use getStorage()
import { createStreamDocument, updateStreamStatus, addVideoStreamChunkAction } from "@/app/admin/stream/stream-actions";
import type { Patient, Stream } from "@/types";
import { Video, Mic, MicOff, VideoOff, Play, StopCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VideoRecorderClientProps {
  patients: Patient[];
}

const CHUNK_DURATION_MS = 5000; // 5 seconds per chunk

export function VideoRecorderClient({ patients }: VideoRecorderClientProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<Stream['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanupMediaStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const setupMediaStream = useCallback(async () => {
    cleanupMediaStream(); // Clean up any existing stream first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Mute preview to avoid feedback
      }
      setError(null);
      return stream;
    } catch (err) {
      console.error("Error accessing media devices.", err);
      setError("Failed to access camera/microphone. Please check permissions.");
      toast({ title: "Error", description: "Could not access camera/microphone.", variant: "destructive" });
      cleanupMediaStream();
      return null;
    }
  }, [toast, cleanupMediaStream]);

  useEffect(() => {
    setupMediaStream();
    return () => {
      cleanupMediaStream();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [setupMediaStream, cleanupMediaStream]);

  const handleStartRecording = async () => {
    if (!selectedPatientId) {
      toast({ title: "Error", description: "Please select a patient.", variant: "destructive" });
      return;
    }
    if (!localStreamRef.current) {
      const stream = await setupMediaStream();
      if (!stream) return; // Failed to get stream
    }
    
    setIsInitializing(true);
    setStreamStatus('idle');
    setError(null);

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    if (!selectedPatient) {
      toast({ title: "Error", description: "Selected patient not found.", variant: "destructive" });
      setIsInitializing(false);
      return;
    }

    const streamDoc = await createStreamDocument(selectedPatientId, selectedPatient.name);
    if (streamDoc.error || !streamDoc.streamId) {
      toast({ title: "Error", description: streamDoc.error || "Failed to create stream.", variant: "destructive" });
      setIsInitializing(false);
      return;
    }
    setStreamId(streamDoc.streamId);

    try {
      const stream = localStreamRef.current;
      if (!stream) throw new Error("Media stream not available.");

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          uploadChunk(streamDoc.streamId!); // Non-null assertion because we checked above
        }
      };

      mediaRecorderRef.current.onstart = async () => {
        setIsRecording(true);
        setStreamStatus('recording');
        setIsInitializing(false);
        await updateStreamStatus(streamDoc.streamId!, 'recording');
        toast({ title: "Success", description: `Streaming started for ${selectedPatient.name}. Stream ID: ${streamDoc.streamId}` });
      };
      
      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setStreamStatus('stopped');
        if (recordedChunksRef.current.length > 0) {
           // Upload any remaining chunk data if logic requires it, though ondataavailable should handle this.
        }
        await updateStreamStatus(streamDoc.streamId!, 'stopped');
        toast({ title: "Stream Stopped", description: "Video streaming has been stopped." });
        // cleanupMediaStream(); // Optionally cleanup, or allow re-recording with same setup
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("An error occurred during recording.");
        toast({ title: "Recording Error", description: "An error occurred with the media recorder.", variant: "destructive" });
        setIsRecording(false);
        setStreamStatus('error');
        if (streamDoc.streamId) updateStreamStatus(streamDoc.streamId, 'error');
      };

      mediaRecorderRef.current.start(CHUNK_DURATION_MS);

    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(`Failed to start recording: ${err.message}`);
      toast({ title: "Error", description: `Failed to start recording: ${err.message}`, variant: "destructive" });
      if (streamDoc.streamId) await updateStreamStatus(streamDoc.streamId, 'error');
      setIsInitializing(false);
    }
  };

  const uploadChunk = async (currentStreamId: string) => {
    if (recordedChunksRef.current.length === 0) return;

    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
    recordedChunksRef.current = []; // Clear for next chunk

    const firebaseStorage = getStorage();
    const timestamp = Date.now();
    const chunkStoragePath = `streams/${currentStreamId}/${timestamp}.webm`;
    const videoChunkRef = storageRef(firebaseStorage, chunkStoragePath);

    try {
      setUploadProgress(0); // Reset progress for new chunk
      // For resumable uploads and progress, use uploadBytesResumable
      await uploadBytes(videoChunkRef, blob); 
      setUploadProgress(100); // Simplified progress
      
      // Add chunk metadata to Firestore
      const chunkResult = await addVideoStreamChunkAction(currentStreamId, chunkStoragePath);
      if (!chunkResult.success) {
        toast({ title: "Upload Error", description: chunkResult.error || "Failed to save chunk metadata.", variant: "destructive" });
      } else {
         // toast({ title: "Chunk Uploaded", description: `Chunk ${chunkResult.chunkId} saved.`, variant: "default" });
      }
    } catch (uploadError) {
      console.error("Error uploading chunk:", uploadError);
      toast({ title: "Upload Error", description: "Failed to upload video chunk.", variant: "destructive" });
       if (mediaRecorderRef.current?.state === "recording") {
        handleStopRecording(); // Stop recording on critical upload error
      }
      setStreamStatus('error');
      updateStreamStatus(currentStreamId, 'error');
    } finally {
      setUploadProgress(0); // Reset progress indicator
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Note: onstop handler will set isRecording to false and update status.
    // cleanupMediaStream(); // Keep stream for potential restart unless explicitly closed.
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
     if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(prev => !prev);
    }
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Video className="h-7 w-7 text-primary" /> Video Stream Capture
        </CardTitle>
        <CardDescription>Select a patient and start capturing live video stream.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5"/> <p>{error}</p>
          </div>
        )}
        <div>
          <Label htmlFor="patient-select" className="text-base">Select Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId} disabled={isRecording || isInitializing}>
            <SelectTrigger id="patient-select" className="w-full mt-1">
              <SelectValue placeholder="Choose a patient..." />
            </SelectTrigger>
            <SelectContent>
              {patients.length === 0 && <SelectItem value="no-patients" disabled>No patients available</SelectItem>}
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} (MRN: {patient.mrn})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted border rounded-lg overflow-hidden aspect-video relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
              <VideoOff className="h-16 w-16 mb-2"/>
              Camera Off
            </div>
          )}
        </div>
        
        {streamId && streamStatus !== 'idle' && (
          <div className="text-sm text-muted-foreground">
            <p>Status: <span className={`font-semibold ${streamStatus === 'recording' ? 'text-green-500' : streamStatus === 'stopped' ? 'text-red-500' : 'text-yellow-500'}`}>{streamStatus.toUpperCase()}</span></p>
            <p>Stream ID: <span className="font-mono">{streamId}</span></p>
            {isRecording && uploadProgress > 0 && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}
          </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Button onClick={toggleMute} variant="outline" size="icon" disabled={!isRecording && !localStreamRef.current}>
            {isMuted ? <MicOff className="h-5 w-5"/> : <Mic className="h-5 w-5"/>}
          </Button>
          <Button onClick={toggleCamera} variant="outline" size="icon" disabled={!isRecording && !localStreamRef.current}>
            {isCameraOff ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
          </Button>
        </div>
        <div className="flex gap-2">
        {!isRecording ? (
          <Button 
            onClick={handleStartRecording} 
            disabled={!selectedPatientId || isInitializing || !!error || isRecording}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            {isInitializing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {isInitializing ? "Initializing..." : (streamStatus === 'stopped' ? "Restart Stream" : "Start Stream")}
          </Button>
        ) : (
          <Button 
            onClick={handleStopRecording} 
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <StopCircle className="mr-2 h-4 w-4" /> Stop Stream
          </Button>
        )}
        </div>
      </CardFooter>
    </Card>
  );
}
