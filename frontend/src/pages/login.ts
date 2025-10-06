import { authService } from '../services/auth';
import { Config } from '../config';

export class LoginPage {
  private element: HTMLElement;
  private twoFactorToken: string | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.setup();
  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 flex items-center justify-center p-4';
    this.element.innerHTML = `
      <div class="max-w-md w-full">
        <!-- Logo ve Başlık -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-purple-300/50 via-pink-300/50 to-yellow-300/50 rounded-full animate-pulse"></div>
            <span class="relative text-white font-bold text-3xl">🔮</span>
          </div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Bing Bong
          </h1>
          <h2 class="text-2xl font-light text-gray-700 mb-2">
            Hoş Geldiniz
          </h2>
          <p class="text-gray-600">Büyülü dünyaya giriş yapın ✨</p>
        </div>

        <!-- Login Form -->
        <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <form id="loginForm" class="space-y-6">
            <!-- Hata Mesajı -->
            <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.
            </div>

            <!-- Success Mesajı -->
            <div id="successMessage" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              Giriş başarılı! Yönlendiriliyorsunuz...
            </div>

            <!-- Username Field -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı
              </label>
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200" 
                placeholder="Kullanıcı adınızı girin"
              >
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div class="relative">
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 pr-12" 
                  placeholder="Şifrenizi girin"
                >
                <button 
                  type="button" 
                  id="togglePassword"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button 
                type="submit" 
                id="submitBtn"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-medium text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span id="submitText">Giriş Yap</span>
                <span id="loadingText" class="hidden">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş yapılıyor...
                </span>
              </button>
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-200"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white text-gray-500">veya</span>
              </div>
            </div>

            <!-- Google Login Button -->
            <div>
              <button 
                type="button" 
                id="googleLoginBtn"
                class="w-full bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-medium text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-3"
              >
                <svg class="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google ile Giriş Yap</span>
              </button>
            </div>

            <!-- Register Link -->
            <div class="text-center pt-4 border-t border-gray-200">
              <span class="text-gray-600">
                Hesabınız yok mu? 
                <a href="/register" class="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                  Kayıt olun
                </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const form = this.element.querySelector('#loginForm') as HTMLFormElement;
    const togglePassword = this.element.querySelector('#togglePassword');
    const passwordInput = this.element.querySelector('#password') as HTMLInputElement;

    form?.addEventListener('submit', this.handleSubmit.bind(this));

    togglePassword?.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
    });

    const googleLoginBtn = this.element.querySelector('#googleLoginBtn');
    googleLoginBtn?.addEventListener('click', this.handleGoogleLogin.bind(this));

    const registerLink = this.element.querySelector('a[href="/register"]');
    registerLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const router = (window as any).app?.router;
      if (router) {
        router.navigate('/register');
      } else {
        window.location.href = '/register';
      }
    });
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('remember-me') === 'on';

    this.setLoading(true);
    this.hideMessages();

    try {
      const result = await authService.login({
        username,
        password
      });

      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        this.twoFactorToken = result.twoFactorToken;
        this.show2FAModal();
        return;
      }

      this.showSuccessMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      setTimeout(() => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/home');
        } else {
          window.location.href = '/home';
        }
      }, 1500);

    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Giriş yapılırken bir hata oluştu.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      this.showErrorMessage(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    const submitBtn = this.element.querySelector('#submitBtn') as HTMLButtonElement;
    const submitText = this.element.querySelector('#submitText');
    const loadingText = this.element.querySelector('#loadingText');

    if (loading) {
      submitBtn.disabled = true;
      submitText?.classList.add('hidden');
      loadingText?.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      submitText?.classList.remove('hidden');
      loadingText?.classList.add('hidden');
    }
  }

  private showErrorMessage(message: string): void {
    const errorDiv = this.element.querySelector('#errorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  private showSuccessMessage(message: string): void {
    const successDiv = this.element.querySelector('#successMessage');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.classList.remove('hidden');
    }
  }

  private hideMessages(): void {
    const errorDiv = this.element.querySelector('#errorMessage');
    const successDiv = this.element.querySelector('#successMessage');
    errorDiv?.classList.add('hidden');
    successDiv?.classList.add('hidden');
  }

  private handleGoogleLogin(): void {
    console.log('Google login initiated');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const backendUrl = Config.SERVER_URL;
    console.log('Redirecting to:', `${backendUrl}/api/oauth/google`);
    window.location.href = `${backendUrl}/api/oauth/google`;
  }

  private show2FAModal(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold mb-6 text-center text-gray-800">İki Faktörlü Doğrulama</h3>
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">🔐</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Authenticator uygulamanızdan 6 haneli kodu girin:</p>
        </div>
        <div class="space-y-4">
          <div>
            <input type="text" id="twoFactorCode" maxlength="6" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-mono" placeholder="000000">
          </div>
          <div id="twoFactorError" class="hidden text-red-600 text-sm text-center"></div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button id="cancel2FA" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
          <button id="verify2FA" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Doğrula</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const codeInput = modal.querySelector('#twoFactorCode') as HTMLInputElement;
    const errorDiv = modal.querySelector('#twoFactorError');
    const cancelBtn = modal.querySelector('#cancel2FA');
    const verifyBtn = modal.querySelector('#verify2FA');

    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.twoFactorToken = null;
    });

    verifyBtn?.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      if (!code || code.length !== 6) {
        errorDiv!.textContent = '6 haneli kod girin';
        errorDiv!.classList.remove('hidden');
        return;
      }

      try {
        (verifyBtn as HTMLButtonElement).disabled = true;
        verifyBtn.textContent = 'Doğrulanıyor...';

        if (!this.twoFactorToken) {
          throw new Error('2FA token bulunamadı');
        }

        await authService.verifyTwoFactor(this.twoFactorToken, code);
        
        document.body.removeChild(modal);
        this.showSuccessMessage('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        setTimeout(() => {
          const router = (window as any).app?.router;
          if (router) {
            router.navigate('/home');
          } else {
            window.location.href = '/home';
          }
        }, 1500);

      } catch (error: any) {
        console.error('2FA verification error:', error);
        errorDiv!.textContent = error.message || 'Geçersiz kod';
        errorDiv!.classList.remove('hidden');
        (verifyBtn as HTMLButtonElement).disabled = false;
        verifyBtn.textContent = 'Doğrula';
      }
    });

    codeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        (verifyBtn as HTMLButtonElement)?.click();
      }
    });

    codeInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      target.value = target.value.replace(/\D/g, '');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        this.twoFactorToken = null;
      }
    });

    setTimeout(() => codeInput?.focus(), 100);
  }

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
