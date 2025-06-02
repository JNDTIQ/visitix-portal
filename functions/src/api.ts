import express from 'express';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isAdmin } from './middleware/isAdmin';

const app = express();

// Secure /me endpoint: returns user role from Firestore
app.get('/me', async (req: express.Request, res: express.Response) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).send('Unauthorized');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return res.status(404).send('User not found');
    const data = userDoc.data() || {};
    const { role, email, uid } = data as { role: string; email: string; uid: string };
    res.json({ uid, email, role });
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
});

// Example protected admin route
app.get('/admin/verification-requests', isAdmin, async (req: express.Request, res: express.Response) => {
  // ...admin logic here...
  res.send('Admin data');
});

exports.api = functions.https.onRequest(app);
