import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

interface GoogleCerts {
  [kid: string]: string;
}

interface CachedCerts {
  certs: GoogleCerts;
  fetchedAt: number;
}

export interface DecodedFirebaseToken {
  uid: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const PROJECT_ID = 'vibe-ecommerce-app';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private certCache: CachedCerts | null = null;

  async verifyIdToken(idToken: string): Promise<DecodedFirebaseToken> {
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid Firebase ID token: unable to decode');
    }

    const kid = decoded.header.kid;
    if (!kid) {
      throw new Error('Invalid Firebase ID token: missing kid header');
    }

    const certs = await this.getGoogleCerts();
    const publicKey = certs[kid];
    if (!publicKey) {
      // Invalidate cache and retry once in case keys rotated
      this.certCache = null;
      const freshCerts = await this.getGoogleCerts();
      const freshKey = freshCerts[kid];
      if (!freshKey) {
        throw new Error('Invalid Firebase ID token: kid not found in Google certs');
      }
      return this.verifyWithKey(idToken, freshKey);
    }

    return this.verifyWithKey(idToken, publicKey);
  }

  private verifyWithKey(idToken: string, publicKey: string): DecodedFirebaseToken {
    const payload = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: PROJECT_ID,
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    }) as jwt.JwtPayload;

    if (!payload.sub) {
      throw new Error('Invalid Firebase ID token: missing sub claim');
    }

    return {
      uid: payload.sub,
      email: payload.email as string,
      email_verified: payload.email_verified as boolean,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
    };
  }

  private async getGoogleCerts(): Promise<GoogleCerts> {
    if (this.certCache && Date.now() - this.certCache.fetchedAt < CACHE_DURATION_MS) {
      return this.certCache.certs;
    }

    this.logger.log('Fetching Google public certs for Firebase token verification');
    const res = await fetch(GOOGLE_CERTS_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch Google certs: ${res.status} ${res.statusText}`);
    }

    const certs: GoogleCerts = await res.json();
    this.certCache = { certs, fetchedAt: Date.now() };
    return certs;
  }
}
