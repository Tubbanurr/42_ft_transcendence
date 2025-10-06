export interface NavbarOptions {
  brand?: string;
  currentUser?: {
    username: string;
    avatar?: string;
  };
  notificationCount?: number;
}

export class Navbar {
  private element: HTMLElement;
  private options: NavbarOptions;

  constructor(options: NavbarOptions = {}) {
    this.element = document.createElement('nav');
    this.options = options;
    this.setup();
  }

  private setup(): void {
    this.element.className = 'bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100 sticky top-0 z-50';
    
    this.element.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center">
            <a href="/home" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-purple-300/50 via-pink-300/50 to-yellow-300/50 rounded-full animate-pulse"></div>
                <span class="relative text-white font-bold text-lg">🔮</span>
              </div>
              <span class="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Bing Bong</span>
            </a>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center space-x-8">
            <a href="/home" class="nav-link text-gray-600 hover:text-purple-600 transition-colors font-medium" data-route="/home">
              Ana Sayfa
            </a>
            <a href="/game" class="nav-link text-gray-600 hover:text-purple-600 transition-colors font-medium" data-route="/game">
              Oyun
            </a>
            <a href="/tournament" class="nav-link text-gray-600 hover:text-purple-600 transition-colors font-medium" data-route="/tournament">
              Turnuva
            </a>
            <a href="/chat" class="nav-link text-gray-600 hover:text-purple-600 transition-colors font-medium" data-route="/chat">
              Sohbet
            </a>
            <a href="/profile" class="nav-link text-gray-600 hover:text-purple-600 transition-colors font-medium" data-route="/profile">
              Profil
            </a>
          </div>

            <!-- Profile Dropdown -->
            <div class="relative">
              <button 
                id="profileBtn" 
                class="flex items-center space-x-2 p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                <div class="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  ${this.options.currentUser?.avatar ? 
                    `<img src="${this.options.currentUser.avatar}" alt="Profile" class="w-8 h-8 rounded-full">` :
                    `<span class="text-white text-sm font-medium">${(this.options.currentUser?.username || 'U')[0].toUpperCase()}</span>`
                  }
                </div>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>

              <!-- Profile Dropdown Menu -->
              <div 
                id="profileDropdown" 
                class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
              >
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-800">${this.options.currentUser?.username || 'Kullanıcı'}</p>
                </div>
                <a href="/profile" class="block px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                  Profil
                </a>
                <button id="settingsBtn" class="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                  Ayarlar
                </button>
                <div class="border-t border-gray-100 mt-2 pt-2">
                  <button id="logoutBtn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>

            <!-- Mobile Menu Button -->
            <button 
              id="mobileMenuBtn" 
              class="md:hidden p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div id="mobileMenu" class="hidden md:hidden border-t border-gray-100 pt-4 pb-4">
          <div class="space-y-2">
            <a href="/home" class="mobile-nav-link block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" data-route="/home">
              Ana Sayfa
            </a>
            <a href="/game" class="mobile-nav-link block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" data-route="/game">
              Oyun
            </a>
            <a href="/tournament" class="mobile-nav-link block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" data-route="/tournament">
              Turnuva
            </a>
            <a href="/chat" class="mobile-nav-link block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" data-route="/chat">
              Sohbet
            </a>
            <a href="/profile" class="mobile-nav-link block px-3 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" data-route="/profile">
              Profil
            </a>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.updateActiveLink();
  }

  private attachEventListeners(): void {
    const mobileMenuBtn = this.element.querySelector('#mobileMenuBtn');
    const mobileMenu = this.element.querySelector('#mobileMenu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    const profileBtn = this.element.querySelector('#profileBtn');
    const profileDropdown = this.element.querySelector('#profileDropdown');
    
    if (profileBtn && profileDropdown) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
        const notificationDropdown = this.element.querySelector('#notificationDropdown');
        if (notificationDropdown) {
          notificationDropdown.classList.add('hidden');
        }
      });
    }

    const notificationBtn = this.element.querySelector('#notificationBtn');
    const notificationDropdown = this.element.querySelector('#notificationDropdown');
    
    if (notificationBtn && notificationDropdown) {
      notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        if (profileDropdown) {
          profileDropdown.classList.add('hidden');
        }
      });
    }

    const logoutBtn = this.element.querySelector('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    const settingsBtn = this.element.querySelector('#settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.navigateToRoute('/settings');
        if (profileDropdown) {
          profileDropdown.classList.add('hidden');
        }
      });
    }

    document.addEventListener('click', () => {
      if (profileDropdown) profileDropdown.classList.add('hidden');
      if (notificationDropdown) notificationDropdown.classList.add('hidden');
    });

    const navLinks = this.element.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = (e.target as HTMLElement).getAttribute('data-route');
        if (route) {
          this.navigateToRoute(route);
        }
      });
    });
  }

  private updateActiveLink(): void {
    const currentPath = window.location.pathname;
    const navLinks = this.element.querySelectorAll('.nav-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
      const route = link.getAttribute('data-route');
      if (route === currentPath || (currentPath === '/' && route === '/home')) {
        link.classList.remove('text-gray-600');
        link.classList.add('text-purple-600', 'font-semibold');
      } else {
        link.classList.remove('text-purple-600', 'font-semibold');
        link.classList.add('text-gray-600');
      }
    });
  }

  private navigateToRoute(route: string): void {
    const app = (window as any).app;
    if (app && app.navigate) {
      app.navigate(route);
    } else {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    
    setTimeout(() => this.updateActiveLink(), 100);
    
    const mobileMenu = this.element.querySelector('#mobileMenu');
    if (mobileMenu) {
      mobileMenu.classList.add('hidden');
    }
  }

  private handleLogout(): void {
    console.log(1)
    const app = (window as any).app;
    if (app && app.handleLogout) {
      console.log(3)
      app.handleLogout();
    } else {
      console.log(2)
      localStorage.removeItem('token');
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  public updateNotificationCount(count: number): void {
    this.options.notificationCount = count;
    this.setup();
  }

  public updateUser(user: { username: string; avatar?: string }): void {
    this.options.currentUser = user;
    this.setup();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
