import { Router } from './router/router';
import type { Route } from './router/router';
import { Navbar } from './components/navbar';
import { authService } from './services/auth';
import { state } from './store/state';
import { initGlobalSocket, registerTournamentEvents as registerTournamentSocketEvents } from './socket/client';
import { showNotification } from './utils/notification';

import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { GamePage } from './pages/game';
import { BotGamePage } from './pages/bot-game';
import { TwoPlayerGamePage } from './pages/twoplayer-game';
import { TournamentPage } from './pages/tournament/index';
import { ProfilePage } from './pages/profile';
import { ChatPage } from './pages/chat';
import { SettingsPage } from './pages/settings';
import { MatchPage } from './pages/tournament/match';


export class App {
  private router: Router;
  private navbar: Navbar | null = null;
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'app';
    this.container.className = 'min-h-screen bg-gray-50';

    this.router = new Router(this.container);
    this.setupRoutes();
  }

  public async initialize(): Promise<void> {
    try {
      this.handleOAuthCallback();

      await authService.initialize();

      if (authService.isAuthenticated()) {
        this.setupSocketEvents();
      }

      authService.onAuthChange((user) => {
        state.setUser(user);
        this.updateNavbar();
        this.handleAuthStateChange(user);
        
        if (user) {
          this.setupSocketEvents();
        }
      });

      state.loadFromStorage();

      this.createLayout();

      this.router.start();

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showErrorPage();
    }
  }

  private setupRoutes(): void {
    const routes: Route[] = [
      {
        path: '/',
        component: HomePage,
        title: 'Home - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/home',
        component: HomePage,
        title: 'Home - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/login',
        component: LoginPage,
        title: 'Login - Transcendence',
      },
      {
        path: '/register',
        component: RegisterPage,
        title: 'Register - Transcendence',
      },
      {
        path: '/game',
        component: GamePage,
        title: 'Game - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/botgame',
        component: BotGamePage,
        title: 'Bot Game - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/twogame',
        component: TwoPlayerGamePage,
        title: 'Two Player Game - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/tournament',
        component: TournamentPage,
        title: 'Tournament - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/profile',
        component: ProfilePage,
        title: 'Profile - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/tournament/:id/match/:roomCode',
        component: MatchPage,
        title: 'Match - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/chat',
        component: ChatPage,
        title: 'Chat - Transcendence',
        requiresAuth: true,
      },
      {
        path: '/settings',
        component: SettingsPage,
        title: 'Settings - Transcendence',
        requiresAuth: true,
      },
    ];

    this.router.addRoutes(routes);
  }

  private createLayout(): void {
    document.body.innerHTML = '';

    const main = document.createElement('main');
    main.className = 'flex-1';
    main.appendChild(this.container);

    const layout = document.createElement('div');
    layout.className = 'min-h-screen flex flex-col';

    const currentPath = this.router.getCurrentPath();
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    if (!isAuthPage) {
      this.createNavbar();
      if (this.navbar) {
        layout.appendChild(this.navbar.getElement());
      }
    }

    layout.appendChild(main);

    document.body.appendChild(layout);

    (window as any).app = this;
  }

  private createNavbar(): void {
    const user = authService.getUser();
    if (!user) return;

    const navbarOptions = {
      currentUser: {
        username: user.username,
        avatar: user.avatar,
      },
      notificationCount: 0,
    };

    this.navbar = new Navbar(navbarOptions);
  }

  private setupSocketEvents(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      initGlobalSocket(token);

      registerTournamentSocketEvents({
        onTournamentFull: (data) => {
          showNotification(data.message, 'warning', 10000);
        },
        onTournamentUpdated: (tournament) => {
          console.log('Tournament updated:', tournament);
        },
        onTournamentStarted: (tournament) => {
          showNotification(`${tournament.name} turnuvası başladı!`, 'info', 8000);
        }
      });
    } catch (error) {
      console.error('Socket setup failed:', error);
    }
  }

  private updateNavbar(): void {
    const currentPath = this.router.getCurrentPath();
    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    if (this.navbar) {
      this.navbar.destroy();
      this.navbar = null;
    }

    if (!isAuthPage && authService.isAuthenticated()) {
      this.createNavbar();

      const layout = document.querySelector('.min-h-screen.flex.flex-col') as HTMLElement;
      const main = layout.querySelector('main');

      if (layout && this.navbar && main) {
        layout.insertBefore((this.navbar as Navbar).getElement(), main);
      }
    }
  }

  public async handleLogout(): Promise<void> {
    try {
      await authService.logout();

      state.reset();
      this.router.navigate('/login');
      this.updateNavbar();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  private showErrorPage(): void {
    document.body.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Application Error</h1>
          <p class="text-lg text-gray-600 mb-8">Something went wrong while loading the application.</p>
          <button
            onclick="window.location.reload()"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    `;
  }

  private handleOAuthCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    const error = urlParams.get('error');
    const requires2fa = urlParams.get('requires2fa');
    const tempToken = urlParams.get('tempToken');

    console.log('OAuth callback parameters:', { token: !!token, user: !!user, error, requires2fa, tempToken: !!tempToken });

    if (error) {
      console.error('OAuth error:', error);
      this.showErrorMessage(`Authentication failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (requires2fa === 'true' && tempToken) {
      console.log('OAuth requires 2FA, showing 2FA modal...');
      console.log('Temp token received:', tempToken.substring(0, 20) + '...');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        this.show2FAModal(tempToken);
      }, 100);
      return;
    }

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        console.log('OAuth success, processing token and user data:', userData);

        authService.handleOAuthToken(token, userData)
          .then(() => {
            console.log('OAuth authentication successful');
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
              this.router.navigate('/home');
            }, 100);
          })
          .catch((err: any) => {
            console.error('Failed to process OAuth token:', err);
            this.showErrorMessage('Authentication processing failed');
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      } catch (parseError) {
        console.error('Failed to parse OAuth user data:', parseError);
        this.showErrorMessage('Authentication data parsing failed');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }

  private handleAuthStateChange(user: any): void {
    const currentPath = this.router.getCurrentPath();
    const currentRoute = this.router.getCurrentRoute();

    if (user && (currentPath === '/login' || currentPath === '/register')) {
      this.router.navigate('/home');
      return;
    }

    if (!user && currentRoute && currentRoute.requiresAuth) {
      this.router.navigate('/login');
      return;
    }

    if (currentRoute && currentRoute.requiresAuth && !authService.isAuthenticated()) {
      this.router.navigate('/login');
    }
  }

  private showErrorMessage(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  private show2FAModal(tempToken: string): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold mb-6 text-center text-gray-800">İki Faktörlü Doğrulama</h3>
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🔐</span>
          </div>
          <p class="text-gray-600 mb-4">Authenticator uygulamanızdan 6 haneli kodu girin:</p>
          <input 
            type="text" 
            id="twoFactorCode" 
            class="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="000000"
            maxlength="6"
            autocomplete="off"
          >
        </div>
        <div class="flex space-x-3">
          <button 
            id="cancel2FA" 
            class="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button 
            id="verify2FA" 
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Doğrula
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const codeInput = modal.querySelector('#twoFactorCode') as HTMLInputElement;
    const verifyBtn = modal.querySelector('#verify2FA') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#cancel2FA') as HTMLButtonElement;

    codeInput?.focus();

    const closeModal = () => {
      modal.remove();
      this.router.navigate('/login');
    };

    cancelBtn?.addEventListener('click', closeModal);

    const verify2FA = async () => {
      const code = codeInput?.value.trim();
      if (!code || code.length !== 6) {
        this.showErrorMessage('6 haneli kod girin');
        return;
      }

      try {
        console.log('Verifying 2FA with temp token and code...');
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Doğrulanıyor...';

        const response = await authService.verify2FALogin(tempToken, code);
        console.log('2FA verification successful:', response);
        
        if (response) {
          console.log('Closing modal and triggering auth state update...');
          modal.remove();
          setTimeout(() => {
            this.router.navigate('/home');
          }, 100);
        }
      } catch (error) {
        console.error('2FA verification failed:', error);
        this.showErrorMessage('Geçersiz kod. Lütfen tekrar deneyin.');
        codeInput.value = '';
        codeInput.focus();
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Doğrula';
      }
    };

    verifyBtn?.addEventListener('click', verify2FA);

    codeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verify2FA();
      }
    });

    codeInput?.addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/[^0-9]/g, '');
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  public navigate(path: string, params: Record<string, any> = {}): void {
    this.router.navigate(path, params);
  }
}
