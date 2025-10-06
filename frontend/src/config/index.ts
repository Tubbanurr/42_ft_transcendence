export class Config {
  private static getServerUrl(): string {
    const { hostname, protocol, host } = window.location;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }

    return `${protocol}//${host}`;
  }

  public static get API_BASE_URL(): string {
    const { hostname, protocol, host } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    return `${protocol}//${host}/api`;
  }

  public static get SOCKET_URL(): string {
    return this.getServerUrl();
  }

  public static get SERVER_URL(): string {
    return this.getServerUrl();
  }
  
  public static get WS_PATH(): string {
    return '/ws';
  }



  public static logConfig(): void {
    console.log('[Config] API Base URL:', this.API_BASE_URL);
    console.log('[Config] Socket URL:', this.SOCKET_URL);
    console.log('[Config] Current hostname:', window.location.hostname);
  }
}
