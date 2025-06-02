import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

// Middleware to check if the user is an admin based on Firestore 'role' field
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).send('Unauthorized');

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists && userDoc.data()?.role === 'admin') {
      (req as any).user = decodedToken;
      next();
    } else {
      res.status(403).send('Forbidden');
    }
  } catch (err) {
    res.status(403).send('Forbidden');
  }
};
