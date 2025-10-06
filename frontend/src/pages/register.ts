import { authService } from '../services/auth';

export class RegisterPage {
  private element: HTMLElement;

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
            Hesap Oluşturun
          </h2>
          <p class="text-gray-600">Büyülü yolculuğa katılın 🌈</p>
        </div>

        <!-- Register Form -->
        <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8">
          <form id="registerForm" class="space-y-6">
            <!-- Hata Mesajı -->
            <div id="errorMessage" class="hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"></div>

            <!-- Success Mesajı -->
            <div id="successMessage" class="hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...
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
                minlength="3"
                maxlength="20"
                pattern="^[a-zA-Z0-9_]+$"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200" 
                placeholder="3-20 karakter, sadece harf, rakam ve _"
              >
              <p class="mt-1 text-xs text-gray-500">Sadece harf, rakam ve alt çizgi kullanabilirsiniz</p>
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200" 
                placeholder="ornek@email.com"
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
                  minlength="6"
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 pr-12" 
                  placeholder="En az 6 karakter"
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
              <div id="passwordStrength" class="mt-2 text-xs"></div>
            </div>

            <!-- Confirm Password Field -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
                Şifre Tekrarı
              </label>
              <div class="relative">
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200 pr-12" 
                  placeholder="Şifrenizi tekrar girin"
                >
                <button 
                  type="button" 
                  id="toggleConfirmPassword"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </button>
              </div>
              <div id="passwordMatch" class="mt-1 text-xs"></div>
            </div>

            <!-- Submit Button -->
            <div>
              <button 
                type="submit" 
                id="submitBtn"
                class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-medium text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span id="submitText">Hesap Oluştur</span>
                <span id="loadingText" class="hidden">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Hesap oluşturuluyor...
                </span>
              </button>
            </div>

            <!-- Login Link -->
            <div class="text-center pt-4 border-t border-gray-200">
              <span class="text-gray-600">
                Zaten hesabınız var mı? 
                <a href="/login" class="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                  Giriş yapın
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
    const form = this.element.querySelector('#registerForm') as HTMLFormElement;
    const togglePassword = this.element.querySelector('#togglePassword');
    const toggleConfirmPassword = this.element.querySelector('#toggleConfirmPassword');
    const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
    const confirmPasswordInput = this.element.querySelector('#confirmPassword') as HTMLInputElement;

    form?.addEventListener('submit', this.handleSubmit.bind(this));

    togglePassword?.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
    });

    toggleConfirmPassword?.addEventListener('click', () => {
      const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      confirmPasswordInput.setAttribute('type', type);
    });

    passwordInput?.addEventListener('input', () => {
      this.checkPasswordStrength(passwordInput.value);
    });

    confirmPasswordInput?.addEventListener('input', () => {
      this.checkPasswordMatch(passwordInput.value, confirmPasswordInput.value);
    });

    const loginLink = this.element.querySelector('a[href="/login"]');
    loginLink?.addEventListener('click', (e) => {
      e.preventDefault();
      const router = (window as any).app?.router;
      if (router) {
        router.navigate('/login');
      } else {
        window.location.href = '/login';
      }
    });
  }

  private checkPasswordStrength(password: string): void {
    const strengthDiv = this.element.querySelector('#passwordStrength');
    if (!strengthDiv) return;

    if (password.length === 0) {
      strengthDiv.textContent = '';
      return;
    }

    let strength = 0;
    let feedback = [];

    if (password.length >= 6) strength += 1;
    else feedback.push('En az 6 karakter');

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push('Büyük harf');

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push('Küçük harf');

    if (/[0-9]/.test(password)) strength += 1;
    else feedback.push('Rakam');

    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    else feedback.push('Özel karakter');

    const strengthText = ['Çok Zayıf', 'Zayıf', 'Orta', 'İyi', 'Güçlü'];
    const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];

    strengthDiv.className = `mt-2 text-xs ${strengthColors[strength - 1] || 'text-gray-500'}`;
    
    if (strength === 0) {
      strengthDiv.textContent = 'Şifre gerekliliklerini karşılamıyor';
    } else if (strength < 5) {
      strengthDiv.textContent = `Güç: ${strengthText[strength - 1]} (Eksik: ${feedback.join(', ')})`;
    } else {
      strengthDiv.textContent = 'Güç: Güçlü ✓';
    }
  }

  private checkPasswordMatch(password: string, confirmPassword: string): void {
    const matchDiv = this.element.querySelector('#passwordMatch');
    if (!matchDiv || confirmPassword.length === 0) {
      if (matchDiv) matchDiv.textContent = '';
      return;
    }

    if (password === confirmPassword) {
      matchDiv.className = 'mt-1 text-xs text-green-500';
      matchDiv.textContent = 'Şifreler eşleşiyor ✓';
    } else {
      matchDiv.className = 'mt-1 text-xs text-red-500';
      matchDiv.textContent = 'Şifreler eşleşmiyor';
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const formData = new FormData(event.target as HTMLFormElement);
    const username = (formData.get('username') as string).trim();
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!this.validateForm(username, email, password, confirmPassword)) {
      return;
    }

    this.setLoading(true);
    this.hideMessages();

    try {
      await authService.register({
        username,
        email,
        password
      });

      this.showSuccessMessage('Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...');

      setTimeout(() => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/login');
        } else {
          window.location.href = '/login';
        }
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Kayıt olurken bir hata oluştu.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      this.showErrorMessage(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  private validateForm(username: string, email: string, password: string, confirmPassword: string): boolean {
    if (username.length < 3 || username.length > 20) {
      this.showErrorMessage('Kullanıcı adı 3-20 karakter arasında olmalıdır.');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      this.showErrorMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.showErrorMessage('Geçerli bir e-posta adresi girin.');
      return false;
    }

    if (password.length < 6) {
      this.showErrorMessage('Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (password !== confirmPassword) {
      this.showErrorMessage('Şifreler eşleşmiyor.');
      return false;
    }

    return true;
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

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
