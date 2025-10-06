import { registerTournamentEvents } from '../socket/client';
import { showNotification } from '../utils/notification';

export class TournamentPage {
  private element: HTMLElement;
  private tournaments: any[] = [];

  constructor() {
    this.element = document.createElement('div');
    this.setup();
    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    registerTournamentEvents({
      onTournamentFull: (data) => {
        showNotification(
          `🏆 ${data.tournamentName} - ${data.message}`,
          'warning',
          8000
        );
      },
      onTournamentUpdated: (tournament) => {
        console.log('Tournament updated:', tournament);
      },
      onTournamentStarted: (tournament) => {
        showNotification(
          `🎯 ${tournament.name} turnuvası başladı! Maçlar atanıyor...`,
          'info',
          6000
        );
      }
    });
  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50';
    this.element.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="mb-10">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
              </div>
              <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">Turnuvalar</h1>
              <p class="text-lg text-gray-600 max-w-2xl mx-auto">Heyecan verici turnuvalara katıl, rakiplerini yen ve şampiyon ol!</p>
            </div>
            
            <div class="flex flex-wrap justify-center gap-4">
              <button id="createTournamentBtn" class="group bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105">
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>Turnuva Oluştur</span>
                </div>
              </button>
              <button id="refreshBtn" class="group bg-white/90 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-xl font-semibold border border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-300 shadow-lg hover:shadow-xl">
                <div class="flex items-center space-x-2">
                  <svg class="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>Yenile</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Active Tournaments -->
          <div class="lg:col-span-2">
            <div id="activeTournamentsBlock" class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl">
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h2 class="text-2xl font-bold text-gray-800">Aktif Turnuva Odaları</h2>
                </div>
                <div class="flex space-x-3">
                </div>
              </div>
              <div id="activeTournaments" class="space-y-6">
                <!-- Tournament cards will be dynamically added here -->
                <div class="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50/50">
                  <div class="text-gray-400 mb-4">
                    <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                  </div>
                  <p class="text-xl font-semibold text-gray-600 mb-2">Henüz aktif turnuva yok</p>
                  <p class="text-gray-500">Yeni turnuva oluştur veya başkalarının turnuvalarına katıl</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tournament Bracket & Info -->
          <div class="space-y-6">
            <!-- Tournament Stats -->
            <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">İstatistikler</h3>
              </div>
              <div class="space-y-4">
                <div class="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <span class="font-medium text-blue-800">Katıldığın Turnuva</span>
                  </div>
                  <span class="text-2xl font-bold text-blue-600">3</span>
                </div>
                <div class="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <span class="font-medium text-green-800">Kazandığın Turnuva</span>
                  </div>
                  <span class="text-2xl font-bold text-green-600">1</span>
                </div>
                <div class="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path>
                      </svg>
                    </div>
                    <span class="font-medium text-purple-800">En İyi Sıralama</span>
                  </div>
                  <span class="text-2xl font-bold text-purple-600">2.</span>
                </div>
              </div>
            </div>

            <!-- Tournament Bracket -->
            <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30 shadow-xl">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">Turnuva Ağacı</h3>
              </div>
              <div id="tournamentBracket" class="min-h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                <div class="text-center text-gray-500">
                  <div class="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <p class="text-lg font-semibold text-gray-600 mb-2">Turnuva seç</p>
                  <p class="text-sm text-gray-500">Turnuva ağacını görmek için bir turnuva seçin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Tournament Modal Content (hidden by default) -->
        <div id="createTournamentModal" class="hidden">
          <div class="bg-white/95 backdrop-blur-lg rounded-2xl p-8 border border-white/40 shadow-2xl max-w-lg mx-auto">
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-4">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 class="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Yeni Turnuva Oluştur</h3>
              <p class="text-gray-600 mt-2">Kendi turnuvanı oluştur ve oyuncuları davet et</p>
            </div>
            <form id="createTournamentForm" class="space-y-6">
              <div>
                <label for="tournamentName" class="block text-sm font-semibold text-gray-700 mb-3">Turnuva Adı</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z"></path>
                    </svg>
                  </div>
                  <input 
                    type="text" 
                    id="tournamentName" 
                    name="name" 
                    required 
                    placeholder="Turnuva adını girin..."
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200"
                  >
                </div>
              </div>
            
              <div>
                <label for="maxPlayers" class="block text-sm font-semibold text-gray-700 mb-3">Maksimum Oyuncu Sayısı</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <select 
                    id="maxPlayers" 
                    name="maxPlayers" 
                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 appearance-none bg-white"
                  >
                    <option value="4">4 Oyuncu</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-widthzz="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="flex justify-end space-x-4 pt-4">
                <button type="button" id="cancelCreateBtn" class="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200">
                  İptal
                </button>
                <button type="submit" class="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Turnuva Oluştur
                </button>
              </div>
          </form>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.loadTournaments();
  }

  private attachEventListeners(): void {
    const createBtn = this.element.querySelector('#createTournamentBtn') as HTMLButtonElement;
    const refreshBtn = this.element.querySelector('#refreshBtn') as HTMLButtonElement;
    createBtn?.addEventListener('click', () => {
      this.addTournament();
      this.showCreateModal();
    });
    refreshBtn?.addEventListener('click', this.loadTournaments.bind(this));
  }

  private showCreateModal(): void {
    console.log('Show create tournament modal');
  }

  private addTournament(): void {
    const newTournament = {
      id: Date.now(),
      name: 'Yeni Oda',
      players: '1/8',
      status: 'Open',
      description: 'Yeni oluşturulan turnuva odası',
      timeLeft: '3 saat kaldı'
    };
    this.tournaments.push(newTournament);
    this.loadTournaments();
  }

  private loadTournaments(): void {
    const container = this.element.querySelector('#activeTournaments') as HTMLElement;
    if (this.tournaments.length === 0) {
      container.innerHTML = `
        <div class="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50/50">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
          </div>
          <p class="text-xl font-semibold text-gray-600 mb-2">Henüz aktif turnuva yok</p>
          <p class="text-gray-500">Yeni turnuva oluştur veya başkalarının turnuvalarına katıl</p>
        </div>
      `;
      return;
    }
    container.innerHTML = this.tournaments.map(tournament => {
      const isOpen = tournament.status === 'Open';
      const statusColor = isOpen ? 'from-green-400 to-emerald-400' : 'from-blue-400 to-cyan-400';
      const statusBg = isOpen ? 'from-green-50 to-emerald-50' : 'from-blue-50 to-cyan-50';
      const statusText = isOpen ? 'text-green-700' : 'text-blue-700';
      const statusBorder = isOpen ? 'border-green-200' : 'border-blue-200';
      return `
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-md transition-all duration-200">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-3 h-3 bg-gradient-to-r ${statusColor} rounded-full ${isOpen ? 'animate-pulse' : ''}"></div>
                <h3 class="text-xl font-bold text-gray-800">${tournament.name}</h3>
              </div>
              <p class="text-gray-600 text-sm mb-3">${tournament.description}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 bg-gradient-to-r ${statusBg} ${statusText} rounded-full text-sm font-semibold border ${statusBorder} ml-3">
              ${tournament.status === 'Open' ? 'Açık' : 'Devam Ediyor'}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="text-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
              <div class="flex items-center justify-center space-x-1 mb-1">
                <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="text-sm font-semibold text-purple-600">Oyuncular</span>
              </div>
              <p class="text-lg font-bold text-purple-700">${tournament.players}</p>
            </div>
            <div class="text-center p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
              <div class="flex items-center justify-center space-x-1 mb-1">
                <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm font-semibold text-rose-600">Süre</span>
              </div>
              <p class="text-sm font-bold text-rose-700">${tournament.timeLeft}</p>
            </div>
          </div>
          <div class="flex space-x-3">
            ${tournament.status === 'Open' ? 
              `<button class="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span>Katıl</span>
                </div>
              </button>` : 
              `<button class="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg">
                <div class="flex items-center justify-center space-x-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <span>İzle</span>
                </div>
              </button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
