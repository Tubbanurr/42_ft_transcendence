import { ApiService } from '../services/api';

export class SettingsPage {
  private element: HTMLElement;
  private apiService: ApiService;
  private twoFactorEnabled: boolean = false;

  constructor() {
    this.element = document.createElement('div');
    this.apiService = new ApiService();
    this.setup();
    this.loadUserProfile();
  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50';
    this.element.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8">
        
        <!-- Başlık -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-200 to-blue-200 rounded-full mb-6 shadow-lg">
            <span class="text-3xl">⚙️</span>
          </div>
          <h1 class="text-3xl font-light text-gray-800 leading-relaxed">
            <span class="text-gray-600">Hesap</span> 
            <span class="text-blue-600">Ayarları</span>
          </h1>
          <p class="text-gray-600 mt-2">Hesabınızı yönetin ve kişiselleştirin</p>
        </div>

        <!-- Ayar Kartları -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          <!-- Kullanıcı Adı Değiştir -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">👤</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Kullanıcı Adı</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Görünen adınızı değiştirin.
              <br>Diğer kullanıcılar bu isimle sizi görecek.
            </p>
            <div class="mb-4">
              <p class="text-sm text-gray-500 mb-2">Mevcut:</p>
              <p id="currentDisplayName" class="font-medium text-gray-800">Yükleniyor...</p>
            </div>
            <button id="changeDisplayNameBtn" class="w-full bg-blue-100/80 text-blue-700 py-3 px-4 rounded-xl hover:bg-blue-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span>Değiştir</span>
                <span class="text-lg">✏️</span>
              </div>
            </button>
          </div>

          <!-- Şifre Değiştir -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-green-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-green-200 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🔒</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Şifre Güvenliği</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Hesabınızı güvende tutun.
              <br>Şifrenizi düzenli olarak güncelleyin.
            </p>
            <div class="mb-4">
              <p class="text-sm text-gray-500 mb-2">Son güncelleme:</p>
              <p class="font-medium text-gray-800">••••••••</p>
            </div>
            <button id="changePasswordBtn" class="w-full bg-green-100/80 text-green-700 py-3 px-4 rounded-xl hover:bg-green-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span>Şifre Değiştir</span>
                <span class="text-lg">🛡️</span>
              </div>
            </button>
          </div>

          <!-- İki Faktörlü Doğrulama -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-indigo-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🔐</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">İki Faktörlü Doğrulama</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Hesabınıza ekstra güvenlik katmanı ekleyin.
              <br>Google Authenticator kullanın.
            </p>
            <div class="mb-4">
              <p class="text-sm text-gray-500 mb-2">Durum:</p>
              <p id="twoFactorStatus" class="font-medium text-gray-800">Kontrol ediliyor...</p>
            </div>
            <button id="twoFactorBtn" class="w-full bg-indigo-100/80 text-indigo-700 py-3 px-4 rounded-xl hover:bg-indigo-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span id="twoFactorBtnText">2FA Ayarla</span>
                <span class="text-lg">📱</span>
              </div>
            </button>
          </div>

          <!-- Hesabı Sil -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-red-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-red-200 to-pink-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">⚠️</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Tehlike Bölgesi</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Hesabınızı kalıcı olarak silin.
              <br><strong>Bu işlem geri alınamaz!</strong>
            </p>
            <div class="mb-4">
              <p class="text-xs text-red-500 italic">
                Tüm verileriniz kalıcı olarak silinecek
              </p>
            </div>
            <button id="deleteAccountBtn" class="w-full bg-red-100/80 text-red-700 py-3 px-4 rounded-xl hover:bg-red-200/80 transition-all duration-200 font-medium border border-red-200">
              <div class="flex items-center justify-center space-x-2">
                <span>Hesabı Sil</span>
                <span class="text-lg">🗑️</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Alt Bilgi -->
        <div class="text-center">
          <div class="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 inline-block">
            <p class="text-gray-600 text-sm italic mb-2">
              Ayarlarınız otomatik olarak kaydedilir ✨
            </p>
            <p class="text-gray-600 text-sm italic">
              Güvenlik ve gizliliğiniz bizim için önemli 🔒
            </p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const changeDisplayNameBtn = this.element.querySelector('#changeDisplayNameBtn');
    if (changeDisplayNameBtn) {
      changeDisplayNameBtn.addEventListener('click', () => this.showChangeDisplayNameModal());
    }

    const changePasswordBtn = this.element.querySelector('#changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', () => this.showChangePasswordModal());
    }

    const deleteAccountBtn = this.element.querySelector('#deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', () => this.showDeleteAccountModal());
    }

    const twoFactorBtn = this.element.querySelector('#twoFactorBtn');
    if (twoFactorBtn) {
      twoFactorBtn.addEventListener('click', () => this.handle2FAAction());
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const response = await this.apiService.getCurrentUser();
      const user = (response as any).user || (response.data as any)?.user;

      const currentDisplayName = this.element.querySelector('#currentDisplayName');
      if (currentDisplayName) {
        currentDisplayName.textContent = user?.display_name || user?.username || 'Kullanıcı';
      }

      this.load2FAStatus();
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      const currentDisplayName = this.element.querySelector('#currentDisplayName');
      if (currentDisplayName) {
        currentDisplayName.textContent = 'Yükleme hatası';
      }
    }
  }

  private async load2FAStatus(): Promise<void> {
    try {
      console.log('Loading 2FA status...');
      const response = await this.apiService.get2FAStatus();
      console.log('2FA status response:', response);
      const enabled = (response.data as any)?.enabled || (response as any)?.enabled;
      console.log('2FA enabled status:', enabled);
      
      const statusElement = this.element.querySelector('#twoFactorStatus');
      const btnElement = this.element.querySelector('#twoFactorBtnText');
      
      if (statusElement && btnElement) {
        if (enabled) {
          statusElement.textContent = '✅ Aktif';
          statusElement.className = 'font-medium text-green-600';
          btnElement.textContent = '2FA Devre Dışı Bırak';
        } else {
          statusElement.textContent = '❌ Pasif';
          statusElement.className = 'font-medium text-red-600';
          btnElement.textContent = '2FA Ayarla';
        }
      }
      
      this.twoFactorEnabled = enabled;
    } catch (error) {
      console.error('2FA durum yükleme hatası:', error);
      console.error('Error details:', error);
      const statusElement = this.element.querySelector('#twoFactorStatus');
      if (statusElement) {
        statusElement.textContent = 'Yükleme hatası';
        statusElement.className = 'font-medium text-gray-500';
      }
    }
  }

  private async handle2FAAction(): Promise<void> {
    if (this.twoFactorEnabled) {
      this.show2FADisableModal();
    } else {
      this.show2FASetupModal();
    }
  }

  private async show2FASetupModal(): Promise<void> {
    try {
      const response = await this.apiService.setup2FA();
      console.log('2FA Setup Response:', response);
      const qrCode = (response as any)?.qr;
      const secret = (response as any)?.secret;

      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <h3 class="text-xl font-semibold mb-6 text-center text-gray-800">İki Faktörlü Doğrulama Kurulumu</h3>
          <div class="text-center mb-6">
            <p class="text-sm text-gray-600 mb-4">Google Authenticator uygulaması ile QR kodu tarayın:</p>
            <div class="flex justify-center mb-4">
              <img src="${qrCode}" alt="QR Code" class="w-48 h-48 border border-gray-200 rounded-lg">
            </div>
            <p class="text-xs text-gray-500 mb-4">Ya da manuel olarak bu kodu girin:</p>
            <code class="bg-gray-100 px-3 py-2 rounded text-sm">${secret}</code>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Doğrulama Kodu</label>
              <input type="text" id="verificationCode" maxlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-lg" placeholder="000000">
              <p class="text-xs text-gray-500 mt-1">Uygulamadan 6 haneli kodu girin</p>
            </div>
          </div>
          <div class="flex space-x-3 mt-6">
            <button id="cancel2FASetup" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
            <button id="confirm2FASetup" class="flex-1 bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors">Doğrula</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const cancelBtn = modal.querySelector('#cancel2FASetup');
      const confirmBtn = modal.querySelector('#confirm2FASetup');
      const codeInput = modal.querySelector('#verificationCode') as HTMLInputElement;

      cancelBtn?.addEventListener('click', () => modal.remove());
      confirmBtn?.addEventListener('click', () => this.verify2FASetup(modal, codeInput.value));

      codeInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          (confirmBtn as HTMLButtonElement)?.click();
        }
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      setTimeout(() => codeInput?.focus(), 100);
    } catch (error) {
      console.error('2FA kurulum hatası:', error);
      this.showNotification('2FA kurulum başlatılırken hata oluştu', 'error');
    }
  }

  private async verify2FASetup(modal: HTMLElement, code: string): Promise<void> {
    if (!code || code.length !== 6) {
      this.showNotification('6 haneli doğrulama kodunu girin', 'error');
      return;
    }

    try {
      const response = await this.apiService.verify2FASetup(code);
      const recoveryCodes = (response.data as any)?.recoveryCodes;
      
      modal.remove();
      this.show2FARecoveryCodesModal(recoveryCodes);
      this.load2FAStatus();
      this.showNotification('2FA başarıyla etkinleştirildi! 🔐', 'success');
    } catch (error) {
      console.error('2FA doğrulama hatası:', error);
      this.showNotification('Geçersiz doğrulama kodu', 'error');
    }
  }

  private show2FARecoveryCodesModal(recoveryCodes: string[]): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold mb-6 text-center text-gray-800">Kurtarma Kodları</h3>
        <div class="mb-6">
          <p class="text-sm text-red-600 mb-4 font-medium">⚠️ Bu kodları güvenli bir yerde saklayın!</p>
          <p class="text-xs text-gray-600 mb-4">Telefonunuzu kaybederseniz bu kodlarla giriş yapabilirsiniz. Her kod sadece bir kez kullanılabilir.</p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="grid grid-cols-2 gap-2 text-sm font-mono">
              ${recoveryCodes?.map(code => `<div class="bg-white p-2 rounded border">${code}</div>`).join('') || '<div class="col-span-2 text-center text-gray-500">Kodlar yüklenemedi</div>'}
            </div>
          </div>
        </div>
        <div class="flex space-x-3">
          <button id="downloadCodes" class="flex-1 bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">İndir</button>
          <button id="closeRecovery" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Kapat</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const downloadBtn = modal.querySelector('#downloadCodes');
    const closeBtn = modal.querySelector('#closeRecovery');

    downloadBtn?.addEventListener('click', () => {
      const content = `İki Faktörlü Doğrulama Kurtarma Kodları\n\n${recoveryCodes?.join('\n') || 'Kodlar bulunamadı'}\n\nBu kodları güvenli bir yerde saklayın. Her kod sadece bir kez kullanılabilir.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcendence-2fa-recovery-codes.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    closeBtn?.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  private show2FADisableModal(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">⚠️</span>
          </div>
          <h3 class="text-xl font-semibold text-yellow-600">2FA Devre Dışı Bırak</h3>
        </div>
        <div class="text-center mb-6">
          <p class="text-gray-600 mb-4">İki faktörlü doğrulamayı devre dışı bırakmak istediğinizden emin misiniz?</p>
          <p class="text-sm text-red-500">Bu işlem hesabınızın güvenliğini azaltacaktır.</p>
        </div>
        <div class="flex space-x-3">
          <button id="cancel2FADisable" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
          <button id="confirm2FADisable" class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">Devre Dışı Bırak</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('#cancel2FADisable');
    const confirmBtn = modal.querySelector('#confirm2FADisable');

    cancelBtn?.addEventListener('click', () => modal.remove());
    confirmBtn?.addEventListener('click', () => this.disable2FA(modal));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  private async disable2FA(modal: HTMLElement): Promise<void> {
    try {
      console.log('Attempting to disable 2FA...');
      const response = await this.apiService.disable2FA();
      console.log('2FA disable response:', response);
      modal.remove();
      this.load2FAStatus();
      this.showNotification('2FA başarıyla devre dışı bırakıldı', 'success');
    } catch (error) {
      console.error('2FA devre dışı bırakma hatası:', error);
      console.error('Error details:', error);
      let errorMessage = '2FA devre dışı bırakılırken hata oluştu';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      this.showNotification(errorMessage, 'error');
    }
  }

  private showChangeDisplayNameModal(): void {
    const currentName = this.element.querySelector('#currentDisplayName')?.textContent || '';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold mb-6 text-center text-gray-800">Görünen Adınızı Değiştirin</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Mevcut Görünen Ad</label>
            <div class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">${currentName}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Yeni Görünen Ad</label>
            <input type="text" id="newDisplayName" value="${currentName}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Yeni görünen adınızı girin">
            <p class="text-xs text-gray-500 mt-1">Bu isim diğer kullanıcılar tarafından görülecek</p>
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button id="cancelDisplayNameChange" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
          <button id="confirmDisplayNameChange" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Kaydet</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('#cancelDisplayNameChange');
    const confirmBtn = modal.querySelector('#confirmDisplayNameChange');
    const inputField = modal.querySelector('#newDisplayName') as HTMLInputElement;

    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    confirmBtn?.addEventListener('click', () => {
      const newName = inputField.value.trim();
      if (newName && newName !== currentName) {
        this.updateDisplayName(newName);
        document.body.removeChild(modal);
      } else if (!newName) {
        inputField.classList.add('border-red-500');
        inputField.focus();
      }
    });

    inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        (confirmBtn as HTMLButtonElement)?.click();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    setTimeout(() => {
      inputField?.focus();
      inputField?.select();
    }, 100);
  }

  private async updateDisplayName(newName: string): Promise<void> {
    try {
      await this.apiService.updateUser({ display_name: newName });
      
      const currentDisplayName = this.element.querySelector('#currentDisplayName');
      if (currentDisplayName) {
        currentDisplayName.textContent = newName;
      }
      
      const app = (window as any).app;
      if (app && app.navbar) {
        const currentUser = app.navbar.options?.currentUser;
        if (currentUser) {
          currentUser.username = newName;
          app.navbar.updateUser(currentUser);
        }
      }
      
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: { display_name: newName } }));
      
      this.showNotification('Görünen ad başarıyla güncellendi! ✨', 'success');
    } catch (error) {
      console.error('Display name update error:', error);
      this.showNotification('Görünen ad güncellenirken hata oluştu', 'error');
    }
  }

  private showChangePasswordModal(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h3 class="text-xl font-semibold mb-6 text-center">Şifre Değiştir</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
            <input type="password" id="currentPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
            <input type="password" id="newPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
            <input type="password" id="confirmPassword" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="flex space-x-3 mt-6">
          <button id="cancelPasswordChange" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
          <button id="confirmPasswordChange" class="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">Değiştir</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('#cancelPasswordChange');
    const confirmBtn = modal.querySelector('#confirmPasswordChange');

    cancelBtn?.addEventListener('click', () => modal.remove());
    confirmBtn?.addEventListener('click', () => this.handlePasswordChange(modal));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  private async handlePasswordChange(modal: HTMLElement): Promise<void> {
    const currentPassword = (modal.querySelector('#currentPassword') as HTMLInputElement)?.value;
    const newPassword = (modal.querySelector('#newPassword') as HTMLInputElement)?.value;
    const confirmPassword = (modal.querySelector('#confirmPassword') as HTMLInputElement)?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showNotification('Tüm alanları doldurun', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotification('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    if (newPassword.length < 6) {
      this.showNotification('Yeni şifre en az 6 karakter olmalı', 'error');
      return;
    }

    try {
      await this.apiService.changePassword(currentPassword, newPassword);
      modal.remove();
      this.showNotification('Şifre başarıyla değiştirildi! 🔒', 'success');
    } catch (error) {
      console.error('Password change error:', error);
      this.showNotification('Şifre değiştirilirken hata oluştu', 'error');
    }
  }

  private showDeleteAccountModal(): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl">⚠️</span>
          </div>
          <h3 class="text-xl font-semibold text-red-600">Hesabı Sil</h3>
        </div>
        <div class="text-center mb-6">
          <p class="text-gray-600 mb-4">Bu işlem geri alınamaz!</p>
          <p class="text-sm text-gray-500">Tüm verileriniz, oyun geçmişiniz ve arkadaşlıklarınız kalıcı olarak silinecek.</p>
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Onaylamak için şifrenizi girin:</label>
          <input type="password" id="deleteConfirmPassword" class="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
        </div>
        <div class="flex space-x-3">
          <button id="cancelDelete" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">İptal</button>
          <button id="confirmDelete" class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">Hesabı Sil</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const cancelBtn = modal.querySelector('#cancelDelete');
    const confirmBtn = modal.querySelector('#confirmDelete');

    cancelBtn?.addEventListener('click', () => modal.remove());
    confirmBtn?.addEventListener('click', () => this.handleAccountDeletion(modal));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  private async handleAccountDeletion(modal: HTMLElement): Promise<void> {
    const password = (modal.querySelector('#deleteConfirmPassword') as HTMLInputElement)?.value;

    if (!password) {
      this.showNotification('Şifrenizi girin', 'error');
      return;
    }

    try {
      await this.apiService.deleteAccount(password);
      modal.remove();
      this.showNotification('Hesabınız silindi. Güle güle! 👋', 'success');
      
      localStorage.removeItem('token');
      setTimeout(() => {
        const app = (window as any).app;
        if (app && app.navigate) {
          app.navigate('/login');
        } else {
          window.location.href = '/login';
        }
      }, 2000);
    } catch (error) {
      console.error('Account deletion error:', error);
      this.showNotification('Hesap silinirken hata oluştu', 'error');
    }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}

