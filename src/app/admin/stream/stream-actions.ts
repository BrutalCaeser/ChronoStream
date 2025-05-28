"use server";

import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp, runTransaction } from "firebase/firestore";
import type { Stream, VideoStreamChunk } from "@/types";
import { revalidatePath } from "next/cache";

export async function createStreamDocument(patientId: string, patientName: string): Promise<{ streamId?: string; error?: string }> {
  try {
    const newStreamData: Omit<Stream, "id" | "chunkOrder"> = {
      patientId,
      patientName,
      status: "idle",
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    const streamRef = await addDoc(collection(db, "streams"), { ...newStreamData, chunkOrder: 0 });
    return { streamId: streamRef.id };
  } catch (e) {
    console.error("Failed to create stream document:", e);
    return { error: "Failed to initialize stream." };
  }
}

export async function updateStreamStatus(streamId: string, status: Stream['status']): Promise<{ success: boolean; error?: string }> {
  try {
    const streamRef = doc(db, "streams", streamId);
    await updateDoc(streamRef, {
      status: status,
      updatedAt: serverTimestamp() as Timestamp,
    });
    // Consider revalidating specific stream player page if it exists
    // revalidatePath(`/stream/${streamId}`);
    return { success: true };
  } catch (e) {
    console.error("Failed to update stream status:", e);
    return { success: false, error: "Failed to update stream status." };
  }
}

export async function addVideoStreamChunkAction(
  streamId: string,
  storagePath: string
): Promise<{ success: boolean; chunkId?: string; error?: string }> {
  try {
    const streamRef = doc(db, "streams", streamId);
    let newChunkOrder = 0;

    // Transaction to get current chunkOrder and increment it atomically
    await runTransaction(db, async (transaction) => {
      const streamDoc = await transaction.get(streamRef);
      if (!streamDoc.exists()) {
        throw new Error("Stream document does not exist!");
      }
      newChunkOrder = (streamDoc.data().chunkOrder || 0) + 1;
      transaction.update(streamRef, { 
        chunkOrder: newChunkOrder,
        updatedAt: serverTimestamp() as Timestamp 
      });
    });
    
    const chunkData: Omit<VideoStreamChunk, "id"> = {
      streamId,
      storagePath,
      timestamp: serverTimestamp() as Timestamp,
      order: newChunkOrder,
    };

    const chunkRef = await addDoc(collection(db, "streams", streamId, "chunks"), chunkData);
    
    // Revalidate the specific stream player page
    revalidatePath(`/stream/${streamId}`);
    revalidatePath(`/stream-viewer`); // If there's a page listing streams
    
    return { success: true, chunkId: chunkRef.id };
  } catch (e) {
    console.error("Failed to add video stream chunk:", e);
    return { success: false, error: "Failed to record stream chunk." };
  }
}
