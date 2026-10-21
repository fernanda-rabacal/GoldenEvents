import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { UnauthorizedError } from '../../common/errors/types/unauthorized.error.js';

export type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

const GOOGLE_LOGIN_FAILED = 'Não foi possível entrar com o Google.';

@Injectable()
export class GoogleIdentityClient {
  constructor(private readonly config: ConfigService) {}

  // O redirect_uri vem do env, nunca da requisição: o Google só aceita trocar o código pela mesma URL
  async exchangeCode(code: string, codeVerifier: string): Promise<GoogleProfile> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const client = new OAuth2Client({
      clientId,
      clientSecret: this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.config.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
    });

    try {
      const { tokens } = await client.getToken({ code, codeVerifier });
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token ?? '',
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedError(GOOGLE_LOGIN_FAILED);
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified === true,
        name: payload.name ?? payload.email,
      };
    } catch {
      throw new UnauthorizedError(GOOGLE_LOGIN_FAILED);
    }
  }
}
