export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  profileImageUrl: string | null;
}

export interface OAuthTokenResponse {
  accessToken: string;
  tokenType?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface OAuthProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokenResponse>;
  getProfile(accessToken: string): Promise<OAuthProfile>;
}
