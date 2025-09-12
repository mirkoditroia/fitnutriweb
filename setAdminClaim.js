/*
 * Firebase Admin Claim Assignment Script
 * 
 * This script assigns the 'isAdmin: true' custom claim to a specific Firebase user.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install firebase-admin if not already installed:
 *    npm install firebase-admin
 * 
 * 2. Make sure you have Firebase Admin SDK credentials configured:
 *    - Option A: Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file
 *    - Option B: Place your service account key file in the project root and update the path below
 *    - Option C: Use Firebase Functions environment (if running in Firebase Functions context)
 * 
 * 3. Update the UID constant below with the Firebase user ID you want to make admin
 * 
 * 4. Run the script:
 *    node setAdminClaim.js
 * 
 * IMPORTANT: Replace 'YOUR_USER_UID_HERE' with the actual Firebase user UID
 */

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: applicationDefault(),
});

// Get Firebase Auth instance
const auth = getAuth();

// UID of the user to assign admin privileges to
// TODO: Replace this with the actual Firebase user UID
const UID = 'OTM4WX70GWRjMEBdMFjuKNWUNyd2';

async function setAdminClaim() {
  try {
    console.log(`Setting admin claim for user: ${UID}`);
    
    // Set custom user claims
    await auth.setCustomUserClaims(UID, { isAdmin: true });
    
    console.log('✅ Success! Admin claim has been set for the user.');
    console.log('The user now has admin privileges.');
    
    // Optionally, get user info to verify
    const userRecord = await auth.getUser(UID);
    console.log(`User email: ${userRecord.email}`);
    console.log(`Custom claims: ${JSON.stringify(userRecord.customClaims)}`);
    
  } catch (error) {
    console.error('❌ Error setting admin claim:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.error('User with the specified UID was not found.');
    } else if (error.code === 'auth/invalid-uid') {
      console.error('The provided UID is invalid.');
    } else {
      console.error('Full error details:', error);
    }
  }
}

// Run the function
setAdminClaim()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
