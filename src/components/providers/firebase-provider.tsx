"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { app, db, storage } from '@/lib/firebase'; // Import initialized instances

interface FirebaseContextType {
  app: FirebaseApp | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ app: null, db: null, storage: null });

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // The Firebase app is initialized in firebase.ts, so we can directly use the imported instances.
  // This provider primarily serves to make these instances available via context if needed,
  // and to ensure Firebase SDKs are tree-shaken correctly for client components.
  
  // No explicit client-side initialization needed here if firebase.ts handles it.
  // However, ensuring it's "used" in a client component can help with bundling.
  const [firebaseApp, setFirebaseApp] = useState<FirebaseApp | null>(null);
  
  useEffect(() => {
    setFirebaseApp(app); // app from firebase.ts
  }, []);


  return (
    <FirebaseContext.Provider value={{ app: firebaseApp, db, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
};
