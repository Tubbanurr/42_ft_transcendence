export class HomePage {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.setup();
  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50';
    this.element.innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-8">
        
        <!-- Hero Section -->
        <div class="text-center mb-16">
          <!-- Ana Mesaj ve Oyun Adı -->
          <div class="bg-white/60 backdrop-blur-sm rounded-3xl p-12 mb-8 border border-white/40 shadow-lg">
            <div class="mb-6">
              <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-200 to-pink-200 rounded-full mb-6 shadow-lg">
                <span class="text-4xl">🧩</span>
              </div>
              <h1 class="text-4xl font-light text-gray-800 mb-6 leading-relaxed">
                <span class="text-yellow-600">Bing Bong</span> 
                <span class="text-gray-600">Oyunu</span>
              </h1>
            </div>
            
            <!-- Quote Box -->
            <div class="bg-gradient-to-r from-yellow-100/80 to-pink-100/80 rounded-2xl p-8 mb-8 border border-yellow-200/50">
              <div class="text-3xl mb-4">✨</div>
              <blockquote class="text-lg text-gray-700 mb-4 italic font-light leading-relaxed">
                "Belki de doğrudur, insan büyüdükçe<br>
                daha az neşeli oluyordur."
              </blockquote>
              <p class="text-sm text-yellow-600 font-medium">InsideOut 2 / Joy ✨</p>
            </div>
            
            <!-- Ana Oyun Butonu -->
            <button 
              id="playGameBtn" 
              class="group bg-gradient-to-r from-yellow-300 to-pink-300 text-gray-800 py-4 px-12 rounded-2xl hover:from-yellow-400 hover:to-pink-400 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium transform hover:-translate-y-1"
            >
              <div class="flex items-center space-x-3">
                <span class="text-2xl group-hover:animate-bounce">🎮</span>
                <span>Neşeyle Oynamaya Başla</span>
                <span class="text-2xl group-hover:animate-pulse">💫</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Özellik Kartları -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- Hızlı Maç -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-blue-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">⚡</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Hızlı Eğlence</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Anında oyuna atlayıp eğlenmeye başla. 
              <br>Hızlı ve keyifli maçlar seni bekliyor.
            </p>
            <button id="quickPlayBtn" class="w-full bg-blue-100/80 text-blue-700 py-3 px-4 rounded-xl hover:bg-blue-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span>Hemen Oyna</span>
                <span class="text-lg">🚀</span>
              </div>
            </button>
          </div>

          <!-- Turnuva -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-green-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-green-200 to-emerald-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🏆</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Büyülü Turnuvalar</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Diğer oyuncularla rekabet et.
              <br>Dostane bir yarış atmosferinde kazanmanın tadını çıkar.
            </p>
            <button id="tournamentBtn" class="w-full bg-green-100/80 text-green-700 py-3 px-4 rounded-xl hover:bg-green-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span>Turnuvalara Katıl</span>
                <span class="text-lg">🌟</span>
              </div>
            </button>
          </div>

          <!-- Sohbet -->
          <div class="group bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-200/30 hover:shadow-xl transition-all duration-300 text-center hover:-translate-y-2">
            <div class="w-16 h-16 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">💬</span>
            </div>
            <h3 class="text-xl font-medium text-gray-800 mb-3">Neşeli Sohbet</h3>
            <p class="text-gray-600 text-sm mb-6 leading-relaxed">
              Yeni arkadaşlar edin, sohbet et.
              <br>Oyun deneyimini paylaş ve güzel anılar biriktir.
            </p>
            <button id="chatBtn" class="w-full bg-purple-100/80 text-purple-700 py-3 px-4 rounded-xl hover:bg-purple-200/80 transition-all duration-200 font-medium">
              <div class="flex items-center justify-center space-x-2">
                <span>Sohbete Katıl</span>
                <span class="text-lg">💝</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Alt Bilgi Kartları -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Sol Kart - Oyun Hakkında -->
          <div class="bg-gradient-to-r from-yellow-100/60 to-orange-100/60 backdrop-blur-sm rounded-2xl p-8 border border-yellow-200/40">
            <div class="flex items-center space-x-3 mb-4">
              <span class="text-2xl">🎨</span>
              <h3 class="text-xl font-medium text-gray-800">Bing Bong ile Tanış</h3>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">
              İçten neşenizi kaybetmeyin! Bu klasik Pong oyunu, Joy'un enerjisi ve Bing Bong'un masumiyetiyle
              sizlere çocukluk anılarınızı hatırlatacak nostaljik bir deneyim sunuyor.
            </p>
            <div class="flex space-x-2">
              <span class="inline-flex items-center px-3 py-1 bg-yellow-200/50 text-yellow-700 rounded-full text-xs font-medium">
                🌈 Nostaljik
              </span>
              <span class="inline-flex items-center px-3 py-1 bg-pink-200/50 text-pink-700 rounded-full text-xs font-medium">
                ✨ Neşeli
              </span>
            </div>
          </div>

          <!-- Sağ Kart - Özellikler -->
          <div class="bg-gradient-to-r from-pink-100/60 to-purple-100/60 backdrop-blur-sm rounded-2xl p-8 border border-pink-200/40">
            <div class="flex items-center space-x-3 mb-4">
              <span class="text-2xl">🎯</span>
              <h3 class="text-xl font-medium text-gray-800">Neler Seni Bekliyor?</h3>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex items-center space-x-3">
                <span class="w-2 h-2 bg-pink-400 rounded-full"></span>
                <span class="text-gray-600">Klasik Pong oyununun modern hali</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span class="text-gray-600">Arkadaşlarınla çok oyunculu maçlar</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span class="text-gray-600">Heyecan verici turnuva sistemi</span>
              </div>
              <div class="flex items-center space-x-3">
                <span class="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span class="text-gray-600">Gerçek zamanlı sohbet imkanı</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Alt Motivasyon Mesajı -->
        <div class="text-center mt-12">
          <div class="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 inline-block">
            <p class="text-gray-600 text-sm italic">
              Hayat bazen zor olabilir, ama oyunlar bizi yeniden çocuk yapar 🌈
            </p>
             <p class="text-gray-600 text-sm italic">
              Sevgili tavşanım Bobby'e ithafen 🐰
            </p>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const playBtn = this.element.querySelector('#playGameBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/game');
        } else {
          window.location.href = '/game';
        }
      });
    }

    const quickPlayBtn = this.element.querySelector('#quickPlayBtn');
    if (quickPlayBtn) {
      quickPlayBtn.addEventListener('click', () => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/game');
        } else {
          window.location.href = '/game';
        }
      });
    }

    const tournamentBtn = this.element.querySelector('#tournamentBtn');
    if (tournamentBtn) {
      tournamentBtn.addEventListener('click', () => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/tournament');
        } else {
          window.location.href = '/tournament';
        }
      });
    }

    const chatBtn = this.element.querySelector('#chatBtn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        const router = (window as any).app?.router;
        if (router) {
          router.navigate('/chat');
        } else {
          window.location.href = '/chat';
        }
      });
    }
  }

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
