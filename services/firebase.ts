// Firebase has been completely removed as per user request.
// This file is kept empty to avoid breaking imports in other files if any are missed,
// but effectively the app now runs in "Offline/Mock" mode for auth.

export const auth = null;
export const analytics = null;
export const signInWithGoogle = async () => { console.warn("Firebase disabled"); return null; };
