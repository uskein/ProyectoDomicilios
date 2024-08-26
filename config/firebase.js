// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';


const firebaseConfig = {
  apiKey:  Constants.manifest.extra.apiKey,
  authDomain: Constants.manifest.extra.authDomain,
  projectId: Constants.manifest.extra.projectid,
  storageBucket: Constants.manifest.extra.storageBucket,
  messagingSenderId: Constants.manifest.extra.messagingSenderId,
  appId: Constants.manifest.extra.appId,
  measurementId: Constants.manifest.extra.measurementId,
  databaseURL: Constants.manifest.extra.databaseURL
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const auth = getAuth();
export const database = getFirestore();