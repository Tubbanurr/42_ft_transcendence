export class GamePage {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.setup();
  }

  private setup(): void {
    this.element.className =
      'min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';
    this.element.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-16">

        <!-- Başlık -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-8 shadow-xl">
            <span class="text-white font-bold text-5xl">🎮</span>
          </div>
          <h1 class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Oyun Seçimi
          </h1>
          <p class="text-gray-600 text-xl">Hangi oyun modunu tercih ediyorsun?</p>
        </div>

        <!-- Oyun Seçenekleri -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl mx-auto mb-12">

          <!-- Bot ile Oyna -->
          <div class="group bg-white/70 backdrop-blur-sm border border-green-200/60 rounded-3xl p-10 text-center shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-3">
            <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-400 rounded-3xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span class="text-4xl">🤖</span>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 mb-6">Bot ile Oyun</h3>
            <p class="text-gray-600 mb-8 leading-relaxed text-lg">Yapay zeka ile antrenman yapın ve becerilerinizi geliştirin</p>
            <button
              id="botGameBtn"
              class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 px-8 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg font-bold text-lg"
            >
              <div class="flex items-center justify-center space-x-3">
                <span>Başla</span>
                <span class="text-xl">🚀</span>
              </div>
            </button>
          </div>

          <!-- 2 Kişilik Oyna -->
          <div class="group bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-3xl p-10 text-center shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-3">
            <div class="w-20 h-20 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl flex items-center justify-center mb-8 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span class="text-4xl">👥</span>
            </div>
            <h3 class="text-3xl font-bold text-gray-800 mb-6">2 Kişilik Remote Oyun</h3>
            <p class="text-gray-600 mb-8 leading-relaxed text-lg">Farklı bilgisayarda arkadaşınızla oynayın</p>
            <button
              id="localGameBtn"
              class="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-5 px-8 rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg font-bold text-lg"
            >
              <div class="flex items-center justify-center space-x-3">
                <span>Başla</span>
                <span class="text-xl">🎯</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Geri Dön Butonu -->
        <div class="text-center">
          <button
            id="backBtn"
            class="bg-white/80 backdrop-blur-sm text-gray-700 py-4 px-10 rounded-2xl border border-white/50 hover:bg-white/90 transition-all duration-200 shadow-lg font-semibold text-lg"
          >
            <div class="flex items-center space-x-3">
              <span>←</span>
              <span>Ana Sayfaya Dön</span>
              <span>🏠</span>
            </div>
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const botBtn = this.element.querySelector('#botGameBtn');
    if (botBtn) {
      botBtn.addEventListener('click', () => {
        this.navigateTo('/botgame');
      });
    }

    const localBtn = this.element.querySelector('#localGameBtn');
    if (localBtn) {
      localBtn.addEventListener('click', () => {
        this.navigateTo('/twogame');
      });
    }

    const backBtn = this.element.querySelector('#backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.navigateTo('/home');
      });
    }
  }

  private navigateTo(path: string): void {
    const app = (window as any).app;
    if (app && app.navigate) {
      app.navigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
  }
}
