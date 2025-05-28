import type { Timestamp } from 'firebase/firestore';

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // Store as ISO string e.g. "YYYY-MM-DD"
  email?: string;
  mrn: string; // Medical Record Number
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Stream {
  id: string;
  patientId: string;
  patientName?: string; // Denormalized for easier display
  status: 'idle' | 'recording' | 'stopped' | 'error';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  chunkOrder: number; // To keep track of the latest chunk order number
}

export interface VideoStreamChunk {
  id: string; // Firestore document ID
  streamId: string;
  storagePath: string; // Path in Firebase Storage
  timestamp: Timestamp;
  order: number; // Sequential order of the chunk
  url?: string; // Optional: Download URL, can be fetched on demand
}
