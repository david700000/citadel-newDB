import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import API_URLS from "./api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (err) {
  console.warn("Firebase Analytics not supported:", err);
}

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("Firebase Messaging not supported:", err);
}

export const requestForToken = async (authToken = null) => {
  try {
    if (!messaging || typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Push notifications not supported on this browser.");
      return null;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await reg.update();
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim(),
        serviceWorkerRegistration: registration
      });
      if (token) {
        console.log('FCM Token:', token);
        if (authToken) {
          try {
            await fetch(API_URLS.FCM_TOKEN, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ token })
            });
          } catch (e) {
            console.log('FCM sync skipped');
          }
        }
        return token;
      } else {
        console.log('No registration token available.');
      }
    }
  } catch (err) {
    console.error('FCM Registration Error:', err);
    return null;
  }
};

export const onMessageListener = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
