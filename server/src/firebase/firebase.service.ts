import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface DecodedFirebaseToken {
  uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    if (admin.apps.length > 0) {
      return;
    }

    // Priority: env JSON string → file path → Application Default Credentials
    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envJson) {
      const serviceAccount = JSON.parse(envJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK initialized with service account (env)');
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || join(process.cwd(), '..', 'firebase-service-account.json');

    if (existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK initialized with service account');
    } else {
      // Fallback: Application Default Credentials (GCP environments)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      this.logger.warn(
        'Firebase service account file not found, using Application Default Credentials',
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    const decoded = await admin.auth().verifyIdToken(idToken);

    return {
      uid: decoded.uid,
      email: decoded.email as string,
      email_verified: decoded.email_verified ?? false,
      name: decoded.name as string | undefined,
      picture: decoded.picture as string | undefined,
    };
  }

  getAuth(): admin.auth.Auth {
    return admin.auth();
  }
}
