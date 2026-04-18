import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// ── Replace with your Firebase project config ─────────
const firebaseConfig = {
  apiKey:            "AIzaSyAJTAK57000puecZ1V2sbnUMiVw4fqwnvA",
  authDomain:        "digital-aristotle-f2764.firebaseapp.com",
  projectId:         "digital-aristotle-f2764",
  storageBucket:     "digital-aristotle-f2764.firebasestorage.app",
  messagingSenderId: "836692455298",
  appId:             "1:836692455298:web:15166be19fe76a5bc6a99b"
};
// ─────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Auth ──────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result   = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function currentUser() {
  return auth.currentUser;
}

// ── User document ─────────────────────────────────────
export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function createUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    joined:        serverTimestamp(),
    streak:        0,
    streakUpdated: null,
    freezeTokens:  2,
    xp:            0,
    xpLevel:       1,
    onboarded:     false,
    completedLessons: []
  });
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

// Save onboarding profile data (does NOT mark onboarding complete)
export async function saveOnboarding(uid, onboarding) {
  await updateDoc(doc(db, 'users', uid), { onboarding });
}

// Call this only after curriculum is successfully generated
export async function markOnboarded(uid) {
  await updateDoc(doc(db, 'users', uid), { onboarded: true });
}

// ── Units & Lessons ───────────────────────────────────
export async function saveUnits(uid, units) {
  await setDoc(doc(db, 'users', uid, 'curriculum', 'active'), {
    units,
    savedAt: serverTimestamp()
  });
}

export async function getUnits(uid) {
  const snap = await getDoc(doc(db, 'users', uid, 'curriculum', 'active'));
  return snap.exists() ? snap.data().units : null;
}

// ── Lesson completion ─────────────────────────────────
export async function saveCompletion(uid, lessonId, data) {
  await addDoc(collection(db, 'users', uid, 'completions'), {
    lessonId,
    ...data,
    completedAt: serverTimestamp()
  });
}

export async function saveInterestFingerprint(uid, fingerprint) {
  await updateDoc(doc(db, 'users', uid), {
    fingerprint,
    lastPulseAt: serverTimestamp()
  });
}

export async function saveFeedback(uid, lessonId, feedback) {
  await setDoc(doc(db, 'users', uid, 'feedback', lessonId), {
    ...feedback,
    submittedAt: serverTimestamp()
  });
}

// ── XP & Streak helpers ───────────────────────────────
export async function awardXp(uid, amount) {
  const userData = await getUser(uid);
  if (!userData) return;

  const newXp    = (userData.xp || 0) + amount;
  const newLevel = Math.floor(newXp / 500) + 1;

  await updateUser(uid, { xp: newXp, xpLevel: newLevel });
  return { xp: newXp, level: newLevel };
}

export async function updateStreak(uid) {
  const userData = await getUser(uid);
  if (!userData) return;

  const now      = new Date();
  const lastDate = userData.streakUpdated?.toDate?.() || null;

  if (lastDate) {
    const diffMs   = now - lastDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return userData.streak; // already updated today
    if (diffDays === 1) {
      await updateUser(uid, { streak: userData.streak + 1, streakUpdated: serverTimestamp() });
      return userData.streak + 1;
    }
    if (diffDays === 2 && userData.freezeTokens > 0) {
      await updateUser(uid, {
        streak: userData.streak + 1,
        freezeTokens: userData.freezeTokens - 1,
        streakUpdated: serverTimestamp()
      });
      return userData.streak + 1;
    }
    // streak broken
    await updateUser(uid, { streak: 1, streakUpdated: serverTimestamp() });
    return 1;
  } else {
    await updateUser(uid, { streak: 1, streakUpdated: serverTimestamp() });
    return 1;
  }
}
