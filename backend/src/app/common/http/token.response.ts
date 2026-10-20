export class TokenResponse {
  token: string;
  type: string;
  refreshToken: string;
  keepConnected: boolean;

  constructor(
    { token, refreshToken, keepConnected }: Omit<TokenResponse, 'type'>,
    type: string,
  ) {
    this.token = token;
    this.type = type;
    this.refreshToken = refreshToken;
    this.keepConnected = keepConnected;
  }
}
