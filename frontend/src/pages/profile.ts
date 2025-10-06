import { ApiService } from '../services/api';
import { initGlobalSocket, socket } from '@/socket/client';
import { Config } from '../config';

export class ProfilePage {
  private element: HTMLElement;
  private apiService: ApiService;
  private currentPage: number = 1;
  private totalPages: number = 1;
  private currentTab: string = 'friends';

  constructor() {
    this.element = document.createElement('div');
    this.apiService = new ApiService();
    this.setup();
    this.setupSocket();
    this.loadUserProfile();
    this.loadUsers();
    this.loadFriendRequests();
    this.setupTabs();
  }

  private setupSocket() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("⚠️ access_token bulunamadı, socket eventleri bağlanmayacak");
      return;
    }

    if (!socket) {
      initGlobalSocket(token);
    }

    socket?.off("friend:request:received").on("friend:request:received", (payload) => {
      this.pushIncomingFriendRequest(payload);
      this.showNotification(`👋 ${payload.fromUsername} arkadaşlık isteği gönderdi`, "success");
    });

    socket?.off("friend:request:accepted").on("friend:request:accepted", (payload) => {
      this.showNotification(`🎉 ${payload.fromUsername} isteğinizi kabul etti`, "success");
      this.loadUserProfile();
      this.loadUsers();
    });

    socket?.off("friend:removed").on("friend:removed", (payload) => {
      this.showNotification(`❌ ${payload.fromUsername} sizi arkadaşlıktan çıkardı veya isteğinizi reddetti`, "error");
      this.loadUserProfile();
      this.loadUsers();
      this.loadFriendRequests();
    });

    socket?.off("friend:blocked").on("friend:blocked", (payload) => {

      if (payload.type === "self") {
        this.loadUserProfile();
        this.loadUsers();
        this.loadFriendRequests();
      }

      if (payload.type === "other") {
        this.loadUserProfile();
        this.loadUsers();
        this.loadFriendRequests();

        if (this.selectedFriend && this.selectedFriend.id === Number(payload.fromUserId)) {
          this.selectedFriend = null;
          this.messages = [];
          const chatArea = this.element.querySelector("#chatArea");
          const chatWelcome = this.element.querySelector("#chatWelcome");
          if (chatArea && chatWelcome) {
            chatArea.classList.add("hidden");
            chatWelcome.classList.remove("hidden");
          }
        }
      }

      
    });


  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50';
    this.element.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Profil Başlığı -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-200 to-pink-200 rounded-full mb-6 shadow-lg">
            <span class="text-2xl">👤</span>
          </div>
          <h1 class="text-3xl font-light text-gray-800 mb-3">
            <span class="text-yellow-600">Profil</span>
          </h1>
          <p class="text-gray-600">Profilinizi yönetin ve arkadaşlarınızla bağlantı kurun ✨</p>
        </div>

        <!-- Profil Kartı -->
        <div class="bg-gradient-to-r from-yellow-100/80 via-pink-100/80 to-blue-100/80 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/50 shadow-lg relative overflow-hidden">
          <!-- Dekoratif arka plan -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl"></div>
          
          <div class="relative z-10 text-center">
            <!-- Profil Fotoğrafı (Ortada) -->
            <div class="relative inline-block mb-6">
              <div class="relative">
                <img id="profileAvatar" class="h-24 w-24 rounded-full border-3 border-white/60 shadow-xl mx-auto object-cover ring-4 ring-yellow-200/30" src="https://via.placeholder.com/96x96/ffffff/f59e0b?text=👤" alt="Profil fotoğrafı">
                <!-- Harf Avatar -->
                <div id="letterAvatar" class="h-24 w-24 rounded-full border-3 border-white/60 shadow-xl mx-auto ring-4 ring-yellow-200/30 bg-gradient-to-r from-yellow-400 to-pink-400 flex items-center justify-center text-3xl font-bold text-white" style="display: none;">
                  U
                </div>
                <div class="absolute inset-0 rounded-full bg-gradient-to-t from-yellow-200/20 to-transparent"></div>
                <button id="uploadPhotoBtn" class="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-300 to-pink-300 text-white p-2 rounded-full hover:from-yellow-400 hover:to-pink-400 hover:scale-110 transition-all duration-300 shadow-lg text-sm" title="Fotoğraf Yükle">📷</button>
              </div>
            </div>

            <!-- Kullanıcı Bilgileri -->
            <div class="mb-6">
              <h2 id="profileName" class="text-2xl font-medium text-gray-800 mb-2">Yükleniyor...</h2>
              <p id="profileUsername" class="text-gray-600 text-lg">@-</p>
              <div class="w-16 h-1 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-full mx-auto mt-3"></div>
            </div>

            <!-- Profil Sekmeleri -->
            <div class="mb-8">
              <div class="flex justify-center space-x-1 bg-white/40 p-1 rounded-xl">
                <button id="tabFriends" class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white text-gray-800 shadow-sm">
                  👥 Arkadaşlar
                </button>
                <button id="tabMatchHistory" class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-800">
                  🏆 Maç Geçmişi
                </button>
                <button id="tabStats" class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-800">
                  📊 İstatistikler
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sekme İçerikleri -->
        <div id="tabContent">
          <!-- Arkadaşlar Sekmesi -->
          <div id="friendsTab" class="tab-content">
            <!-- Arkadaş Yönetimi -->
            <div class="space-y-6">
              <!-- Kullanıcı Listesi -->
              <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-800">👥 Tüm Kullanıcılar</h3>
                  <div id="usersLoadingIndicator" class="text-sm text-gray-500">Yükleniyor...</div>
                </div>
                <div class="text-sm text-gray-600 mb-4">Platformdaki diğer kullanıcıları görüntüleyin ve arkadaş olarak ekleyin</div>
                <div class="mb-4">
                  <div class="flex gap-2">
                    <input type="text" id="userSearchInput" placeholder="👤 Kullanıcı ara (isim, kullanıcı adı)..." class="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm bg-white/50">
                    <button id="refreshUsersBtn" class="bg-yellow-200/80 text-yellow-700 px-3 py-2 rounded-lg text-sm hover:bg-yellow-300/80 transition-colors" title="Kullanıcıları Yenile">🔄</button>
                  </div>
                </div>
                <div id="usersList" class="space-y-3 max-h-64 overflow-y-auto"><!-- Kullanıcılar dinamik --></div>
              </div>

              <!-- Arkadaş İstekleri -->
              <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-800">🤝 Arkadaş İstekleri</h3>
                  <span class="bg-pink-100/80 text-pink-600 px-2 py-1 rounded-full text-xs font-medium" id="friendReqCount">0</span>
                </div>
                <div id="friendRequestsList" class="space-y-3">
                  <p class="text-gray-500 text-center py-4">Henüz arkadaş isteği yok</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Maç Geçmişi Sekmesi -->
          <div id="matchHistoryTab" class="tab-content hidden">
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-medium text-gray-800">🏆 Maç Geçmişi</h3>
                <button id="refreshMatchHistory" class="bg-yellow-200/80 text-yellow-700 px-3 py-2 rounded-lg text-sm hover:bg-yellow-300/80 transition-colors" title="Maç Geçmişini Yenile">🔄</button>
              </div>
              <div id="matchHistoryLoading" class="text-center py-8 text-gray-500">
                <div class="animate-pulse">Maç geçmişi yükleniyor...</div>
              </div>
              <div id="matchHistoryList" class="space-y-4 hidden">
                <!-- Maçlar dinamik olarak buraya eklenecek -->
              </div>
              <div id="matchHistoryEmpty" class="text-center py-8 text-gray-500 hidden">
                <div class="text-4xl mb-4">🎮</div>
                <p>Henüz oynadığınız maç bulunmuyor</p>
                <p class="text-sm mt-2">İlk maçınızı oynayın ve geçmişiniz burada görünecek!</p>
              </div>
              <!-- Pagination -->
              <div id="matchHistoryPagination" class="flex justify-center items-center space-x-2 mt-6 hidden">
                <button id="prevPageBtn" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50" disabled>‹</button>
                <span id="pageInfo" class="text-sm text-gray-600">Sayfa 1 / 1</span>
                <button id="nextPageBtn" class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50" disabled>›</button>
              </div>
            </div>
          </div>

          <!-- İstatistikler Sekmesi -->
          <div id="statsTab" class="tab-content hidden">
            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
              <h3 class="text-lg font-medium text-gray-800 mb-6">📊 Oyun İstatistikleri</h3>
              <div id="gameStatsLoading" class="text-center py-8 text-gray-500">
                <div class="animate-pulse">İstatistikler yükleniyor...</div>
              </div>
              <div id="gameStatsContent" class="hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-4 bg-white/40 rounded-xl">
                    <div class="text-2xl font-bold text-blue-600" id="totalGamesCount">0</div>
                    <div class="text-sm text-gray-600">Toplam Maç</div>
                  </div>
                  <div class="text-center p-4 bg-white/40 rounded-xl">
                    <div class="text-2xl font-bold text-green-600" id="winsCount">0</div>
                    <div class="text-sm text-gray-600">Galibiyet</div>
                  </div>
                  <div class="text-center p-4 bg-white/40 rounded-xl">
                    <div class="text-2xl font-bold text-red-600" id="lossesCount">0</div>
                    <div class="text-sm text-gray-600">Mağlubiyet</div>
                  </div>
                  <div class="text-center p-4 bg-white/40 rounded-xl">
                    <div class="text-2xl font-bold text-yellow-600" id="winRatePercent">0%</div>
                    <div class="text-sm text-gray-600">Kazanma Oranı</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Arkadaş Yönetimi (eski konum) -->
        <div class="space-y-6" style="display: none;">
          <!-- Bu kısım artık sekmelerin içinde -->
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const uploadBtn = this.element.querySelector('#uploadPhotoBtn');
    if (uploadBtn) uploadBtn.addEventListener('click', () => this.handleAvatarUpload?.());

    const editBtn = this.element.querySelector('#editProfileBtn');
    if (editBtn) editBtn.addEventListener('click', () => {
      window.location.href = '/settings';
    });

    const passwordBtn = this.element.querySelector('#changePasswordBtn');
    if (passwordBtn) passwordBtn.addEventListener('click', () => {
      window.location.href = '/settings';
    });

    const refreshBtn = this.element.querySelector('#refreshUsersBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadUsers());

    const searchInput = this.element.querySelector('#userSearchInput') as HTMLInputElement;
    if (searchInput) {
      let t: any;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => this.filterUsers((e.target as HTMLInputElement).value.toLowerCase()), 300);
      });
    }

    this.attachFriendAddButtons();
    this.attachFriendRequestButtons();
  }

  private attachFriendAddButtons(): void {
    const addButtons = this.element.querySelectorAll('#usersList button[data-action="add"]');
    addButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        const btn = button as HTMLButtonElement;
        const userCard = (e.target as HTMLElement).closest('.flex');
        const userName = userCard?.querySelector('p.font-medium')?.textContent || 'Kullanıcı';
        const friendId = (e.target as HTMLElement).getAttribute('data-user-id');

        if (!friendId) return this.showNotification('Kullanıcı ID\'si bulunamadı', 'error');

        btn.disabled = true; btn.textContent = 'Gönderiliyor...';
        try {
          await this.apiService.addFriend(Number(friendId));
          socket?.emit('friend:request', { toUserId: String(friendId) });

          btn.textContent = '✓ Gönderildi';
          btn.classList.remove('bg-blue-500','hover:bg-blue-600','bg-green-500','hover:bg-green-600','bg-purple-500','hover:bg-purple-600','bg-orange-500','hover:bg-orange-600','bg-pink-500','hover:bg-pink-600','bg-indigo-500','hover:bg-indigo-600');
          btn.classList.add('bg-gray-400','cursor-not-allowed');
          this.showNotification(`${userName} kişisine arkadaşlık isteği gönderildi!`, 'success');
        } catch (err) {
          btn.disabled = false; btn.textContent = '+ Arkadaş Ekle';
          this.showNotification('Arkadaşlık isteği gönderilirken hata oluştu', 'error');
        }
      });
    });
  }

  private attachFriendRequestButtons(): void {
    const acceptButtons = this.element.querySelectorAll('#friendRequestsList [data-action="accept"]');
    acceptButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        const userCard = (e.target as HTMLElement).closest('.flex');
        const userName = userCard?.querySelector('p.font-medium')?.textContent || 'Kullanıcı';
        const userId = (e.target as HTMLElement).getAttribute('data-user-id');
        try {
          if (userId) {
            await this.apiService.acceptFriendRequest(Number(userId));
            socket?.emit('friend:accept', { toUserId: String(userId) });
          }
          userCard?.remove();
          this.showNotification(`${userName} arkadaş listenize eklendi!`, 'success');
          this.updateFriendRequestsCount();
          this.loadUserProfile();
          this.loadUsers();
        } catch {
          this.showNotification('Arkadaş isteği kabul edilirken hata oluştu', 'error');
        }
      });
    });

    const rejectButtons = this.element.querySelectorAll('#friendRequestsList [data-action="reject"], #friendRequestsList [data-action="remove"]');
    rejectButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        const userCard = (e.target as HTMLElement).closest('.flex');
        const userName = userCard?.querySelector('p.font-medium')?.textContent || 'Kullanıcı';
        const friendId = (e.target as HTMLElement).getAttribute('data-user-id');
        try {
          if (friendId) {
            await this.apiService.removeFriend(Number(friendId));

            socket?.emit("friend:removed", { toUserId: String(friendId) });
          }
          userCard?.remove();
          this.showNotification(`${userName} arkadaşlık isteği reddedildi.`, 'success');
          this.updateFriendRequestsCount();
        } catch (error: any) {
          this.showNotification('Arkadaşlık isteği reddedilirken hata oluştu', 'error');
        }
      });
    });
  }

private pushIncomingFriendRequest(payload: any) {
  console.log(payload)
  const friendRequestsList = this.element.querySelector('#friendRequestsList');
  const countBadge = this.element.querySelector('#friendReqCount');
  if (!friendRequestsList) return;

  const placeholder = friendRequestsList.querySelector('p.text-gray-500');
  if (placeholder) placeholder.remove();

  const username = payload.fromUsername || payload.username || "Bilinmiyor";
  const userId = String(payload.fromUserId || payload.userId || payload.id);

  const div = document.createElement('div');
  div.className = 'flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200/50';
  div.innerHTML = `      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
          ${username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p class="font-medium text-gray-800">${username}</p>
          <p class="text-xs text-gray-500">Size arkadaşlık isteği gönderdi</p>
        </div>
      </div>
    <div class="flex space-x-2">
      <button class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors" data-user-id="${userId}" data-action="accept">✓ Kabul</button>
      <button class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors" data-user-id="${userId}" data-action="reject">✗ Reddet</button>
    </div>
  `;

  friendRequestsList.prepend(div);
  this.attachFriendRequestButtons();

  if (countBadge) {
    const current = Number(countBadge.textContent || '0');
    countBadge.textContent = String(current + 1);
  }
}


  private updateFriendRequestsCount(): void {
    const list = this.element.querySelector('#friendRequestsList');
    const countBadge = this.element.querySelector('#friendReqCount');
    if (!list || !countBadge) return;

    const items = list.querySelectorAll(':scope > .flex.items-center.justify-between');
    countBadge.textContent = String(items.length);
    if (items.length === 0) {
      if (!list.querySelector('p.text-gray-500')) {
        const p = document.createElement('p');
        p.className = 'text-gray-500 text-center py-4';
        p.textContent = 'Henüz arkadaş isteği yok';
        list.appendChild(p);
      }
    }
  }

  private async loadUserProfile(): Promise<void> {
    try {
      const response = await this.apiService.getCurrentUser();
      const user = (response as any).user || (response.data as any)?.user;

      const profileName = this.element.querySelector('#profileName');
      const profileUsername = this.element.querySelector('#profileUsername');
      const profileAvatar = this.element.querySelector('#profileAvatar') as HTMLImageElement;

      if (profileName) profileName.textContent = user?.display_name || user?.username || 'Kullanıcı';
      if (profileUsername) profileUsername.textContent = `@${user?.username || 'unknown'}`;

      if (profileAvatar) {
        if (user?.avatar_url) {
          const avatarUrl = user.avatar_url.startsWith('http') ? user.avatar_url : `${Config.SERVER_URL}${user.avatar_url}`;
          profileAvatar.src = avatarUrl;
          profileAvatar.style.display = 'block';
          const letterAvatar = this.element.querySelector('#letterAvatar') as HTMLElement;
          if (letterAvatar) letterAvatar.style.display = 'none';
        } else {
          profileAvatar.style.display = 'none';
          this.showLetterAvatar(user?.username || user?.display_name || 'U');
        }
      }

      this.updateGameStats(user);
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      const profileName = this.element.querySelector('#profileName');
      if (profileName) profileName.textContent = 'Yükleme hatası';
    }
  }

  private updateGameStats(user: any): void {
    if (!user) return;
    const gamesPlayedCount = this.element.querySelector('#gamesPlayedCount');
    const winsCount = this.element.querySelector('#winsCount');
    const winRate = this.element.querySelector('#winRate');

    const gamesPlayed = user.games_played || 0;
    const wins = user.wins || 0;

    if (gamesPlayedCount) gamesPlayedCount.textContent = String(gamesPlayed);
    if (winsCount) winsCount.textContent = String(wins);
    if (winRate) winRate.textContent = gamesPlayed > 0 ? `${Math.round((wins / gamesPlayed) * 100)}%` : '-%';
  }

  private async loadUsers(): Promise<void> {
    try {
      const loadingIndicator = this.element.querySelector('#usersLoadingIndicator');
      const usersList = this.element.querySelector('#usersList');

      if (loadingIndicator) loadingIndicator.textContent = 'Yükleniyor...';

      const response = await this.apiService.getAllUsers();
      const users = response.data?.users || (response as any).users || [];

      if (usersList) {
        usersList.innerHTML = '';
        if (users.length > 0) {
          users.forEach((user: any, index: number) => usersList.appendChild(this.createUserCard(user, index)));
          if (loadingIndicator) loadingIndicator.textContent = `${users.length} kullanıcı`;
        } else {
          usersList.innerHTML = '<p class="text-gray-500 text-center py-4">Henüz başka kullanıcı yok</p>';
          if (loadingIndicator) loadingIndicator.textContent = '0 kullanıcı';
        }
      }

      setTimeout(() => {
        this.attachFriendAddButtons();
        this.attachFriendRemoveBlockButtons();
      }, 0);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata', error);
      const loadingIndicator = this.element.querySelector('#usersLoadingIndicator');
      const usersList = this.element.querySelector('#usersList');
      if (loadingIndicator) loadingIndicator.textContent = 'Hata oluştu';
      if (usersList) {
        usersList.innerHTML = `
          <div class="text-center py-6">
            <p class="text-red-500 mb-2">❌ Kullanıcılar yüklenirken hata oluştu</p>
            <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">🔄 Tekrar Dene</button>
          </div>
        `;
      }
    }
  }

  private async loadFriendRequests(): Promise<void> {
    try {
      const friendRequestsList = this.element.querySelector('#friendRequestsList');
      const countBadge = this.element.querySelector('#friendReqCount');
      if (!friendRequestsList) return;

      const response: any = await this.apiService.getFriendRequests();
      const requests = response.requests || [];

      friendRequestsList.innerHTML = '';
      if (requests.length > 0) {
        requests.forEach((request: any, index: number) => {
          const requestElement = this.createFriendRequestItem(request, index);
          friendRequestsList.appendChild(requestElement);
        });
      } else {
        friendRequestsList.innerHTML = '<p class="text-gray-500 text-center py-4">Henüz arkadaş isteği yok</p>';
      }

      if (countBadge) countBadge.textContent = String(requests.length);

      setTimeout(() => this.attachFriendRequestButtons(), 0);
    } catch (error) {
      console.error('Arkadaş istekleri yükleme hatası:', error);
      const friendRequestsList = this.element.querySelector('#friendRequestsList');
      if (friendRequestsList) friendRequestsList.innerHTML = '<p class="text-red-500 text-center py-4">Arkadaş istekleri yüklenirken hata oluştu</p>';
    }
  }


  private createFriendRequestItem(request: any, index: number): HTMLElement {
    const colors = ['from-yellow-400 to-amber-400','from-blue-400 to-blue-500','from-green-400 to-green-500','from-purple-400 to-purple-500','from-pink-400 to-pink-500','from-indigo-400 to-indigo-500'];
    const colorIndex = index % colors.length;
    const avatarColor = colors[colorIndex];

    const displayName = request.display_name || request.username || 'Kullanıcı';
    const username = request.username || 'user';
    const avatarUrl = request.avatar_url ? (request.avatar_url.startsWith('http') ? request.avatar_url : `${Config.SERVER_URL}${request.avatar_url}`) : null;
    const fromUserId = String(request.userId ?? request.fromUserId ?? request.id);

    const requestElement = document.createElement('div');
    requestElement.className = 'flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200/50';
    requestElement.innerHTML = `
      <div class="flex items-center space-x-3">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="${username}" class="w-10 h-10 rounded-full object-cover border-2 border-white/50" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : ''}
        <div class="w-10 h-10 bg-gradient-to-r ${avatarColor} rounded-full flex items-center justify-center text-white font-medium ${avatarUrl ? 'hidden' : ''}">
          ${displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p class="font-medium text-gray-800">${displayName}</p>
          <p class="text-xs text-gray-500">Size arkadaşlık isteği gönderdi</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors" data-user-id="${fromUserId}" data-action="accept">✓ Kabul</button>
        <button class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors" data-user-id="${fromUserId}" data-action="reject">✗ Reddet</button>
      </div>
    `;
    return requestElement;
  }

  private createUserCard(user: any, index: number): HTMLElement {
    const colors = ['from-blue-400 to-blue-500','from-green-400 to-green-500','from-purple-400 to-purple-500','from-orange-400 to-orange-500','from-pink-400 to-pink-500','from-indigo-400 to-indigo-500'];
    const buttonColors = ['bg-blue-500 hover:bg-blue-600','bg-green-500 hover:bg-green-600','bg-purple-500 hover:bg-purple-600','bg-orange-500 hover:bg-orange-600','bg-pink-500 hover:bg-pink-600','bg-indigo-500 hover:bg-indigo-600'];

    const colorIndex = index % colors.length;
    const avatarColor = colors[colorIndex];
    const buttonColor = buttonColors[colorIndex];

    const displayName = user.display_name || user.username || 'Kullanıcı';
    const username = user.username || 'unknown';
    const email = user.email || '';
    const avatarUrl = user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${Config.SERVER_URL}${user.avatar_url}`) : null;
    const friendshipStatus = user.friendStatus || 'none';

    const userCard = document.createElement('div');
    userCard.className = 'flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200/50 hover:shadow-md transition-all duration-200';
    userCard.innerHTML = `
      <div class="flex items-center space-x-3">
        ${avatarUrl ? `<img src="${avatarUrl}" alt="${username}" class="w-10 h-10 rounded-full object-cover border-2 border-white/50" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : ''}
        <div class="w-10 h-10 bg-gradient-to-r ${avatarColor} rounded-full flex items-center justify-center text-white font-medium ${avatarUrl ? 'hidden' : ''}">
          ${displayName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1">
          <p class="font-medium text-gray-800">${displayName}</p>
          <p class="text-xs text-gray-500">@${username}${email ? ` • ${email}` : ''}</p>
        </div>
      </div>
      <div class="flex gap-2">
        ${friendshipStatus === 'none' ? `
          <button class="${buttonColor} text-white px-3 py-1 rounded-lg text-sm transition-colors hover:scale-105 transform" data-user-id="${user.id}" data-action="add">+ Arkadaş Ekle</button>` : ''}
        ${friendshipStatus === 'pending' ? `
          <button class="bg-gray-400 text-white px-3 py-1 rounded-lg text-sm cursor-not-allowed" disabled>✓ Gönderildi</button>` : ''}
        ${friendshipStatus === 'accepted' ? `
          <button class="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600" data-user-id="${user.id}" data-action="remove">Arkadaşı Sil</button>` : ''}
        <button class="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-800" data-user-id="${user.id}" data-action="block">Engelle</button>
      </div>
    `;
    return userCard;
  }

  private attachFriendRemoveBlockButtons(): void {
    const removeButtons = this.element.querySelectorAll('#usersList [data-action="remove"]');
    removeButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        const userId = (e.target as HTMLElement).getAttribute('data-user-id');
        if (!userId) return;
        try {
          await this.apiService.removeFriend(Number(userId));
          this.showNotification('Arkadaş silindi.', 'success');
          this.loadUsers();
        } catch {
          this.showNotification('Arkadaş silinirken hata oluştu.', 'error');
        }
      });
    });

    const blockButtons = this.element.querySelectorAll('#usersList [data-action="block"]');
    blockButtons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        const friendId = (e.target as HTMLElement).getAttribute('data-user-id');
        if (!friendId) return;
        try {
          await this.apiService.blockUser(Number(friendId));
          this.showNotification('Kullanıcı engellendi.', 'success');
          this.loadUsers();
        } catch {
          this.showNotification('Kullanıcı engellenirken hata oluştu.', 'error');
        }
      });
    });
  }

  private filterUsers(searchTerm: string): void {
    const userCards = this.element.querySelectorAll('#usersList > div');
    let visibleCount = 0;
    userCards.forEach((card) => {
      const nameElement = card.querySelector('p.font-medium');
      const usernameElement = card.querySelector('p.text-xs');
      const name = (nameElement?.textContent || '').toLowerCase();
      const username = (usernameElement?.textContent || '').toLowerCase();
      const isVisible = !searchTerm || name.includes(searchTerm) || username.includes(searchTerm);
      (card as HTMLElement).style.display = isVisible ? 'flex' : 'none';
      if (isVisible) visibleCount++;
    });
    const loadingIndicator = this.element.querySelector('#usersLoadingIndicator');
    if (loadingIndicator) loadingIndicator.textContent = searchTerm ? `${visibleCount} sonuç bulundu` : `${userCards.length} kullanıcı`;
  }

  private updateAvatarDisplay(avatarUrl: string): void {
    const avatar = this.element.querySelector('#profileAvatar') as HTMLImageElement;
    const letterAvatar = this.element.querySelector('#letterAvatar') as HTMLElement;
    
    if (avatar && letterAvatar) {
      avatar.src = avatarUrl.startsWith('http') ? avatarUrl : `${Config.SERVER_URL}${avatarUrl}`;
      avatar.style.display = 'block';
      letterAvatar.style.display = 'none';
    }
  }

  private showUploadProgress(show: boolean, message: string = 'Yükleniyor...'): void {
    const uploadBtn = this.element.querySelector('#uploadPhotoBtn') as HTMLButtonElement | null;
    if (!uploadBtn) return;
    if (show) { uploadBtn.textContent = '⏳'; uploadBtn.disabled = true; uploadBtn.title = message; }
    else { uploadBtn.textContent = '📷'; uploadBtn.disabled = false; uploadBtn.title = 'Fotoğraf Yükle'; }
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }


  private handleAvatarUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      this.showUploadProgress(true, 'Uploading avatar...');
      
      try {
        const response = await this.apiService.uploadAvatar(file);

        await this.loadUserProfile();

        this.showNotification('Avatar successfully updated!', 'success');
      } catch (error: any) {
        console.error('Avatar upload error:', error);
        this.showNotification(error.message || 'Error uploading avatar', 'error');
      } finally {
        this.showUploadProgress(false);
      }
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  private showLetterAvatar(name: string): void {
    const letterAvatar = this.element.querySelector('#letterAvatar') as HTMLElement;
    if (letterAvatar) {
      const firstLetter = name.charAt(0).toUpperCase();
      letterAvatar.textContent = firstLetter;
      letterAvatar.style.display = 'flex';
    }
  }

  private setupTabs(): void {
    const tabButtons = {
      friends: this.element.querySelector('#tabFriends'),
      matchHistory: this.element.querySelector('#tabMatchHistory'),
      stats: this.element.querySelector('#tabStats')
    };

    const tabContents = {
      friends: this.element.querySelector('#friendsTab'),
      matchHistory: this.element.querySelector('#matchHistoryTab'),
      stats: this.element.querySelector('#statsTab')
    };

    Object.entries(tabButtons).forEach(([tabName, button]) => {
      button?.addEventListener('click', () => {
        this.switchTab(tabName, tabButtons, tabContents);
      });
    });

    const refreshMatchHistory = this.element.querySelector('#refreshMatchHistory');
    refreshMatchHistory?.addEventListener('click', () => this.loadMatchHistory());

    const prevPageBtn = this.element.querySelector('#prevPageBtn');
    const nextPageBtn = this.element.querySelector('#nextPageBtn');

    prevPageBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadMatchHistory();
      }
    });

    nextPageBtn?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadMatchHistory();
      }
    });
  }

  private switchTab(tabName: string, tabButtons: any, tabContents: any): void {
    this.currentTab = tabName;

    Object.entries(tabButtons).forEach(([name, button]) => {
      const btn = button as HTMLElement;
      if (name === tabName) {
        btn.className = 'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white text-gray-800 shadow-sm';
      } else {
        btn.className = 'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-gray-800';
      }
    });

    Object.entries(tabContents).forEach(([name, content]) => {
      const element = content as HTMLElement;
      if (name === tabName) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    });

    if (tabName === 'matchHistory') {
      this.loadMatchHistory();
    } else if (tabName === 'stats') {
      this.loadGameStats();
    }
  }

  private async loadMatchHistory(): Promise<void> {
    const loadingEl = this.element.querySelector('#matchHistoryLoading');
    const listEl = this.element.querySelector('#matchHistoryList');
    const emptyEl = this.element.querySelector('#matchHistoryEmpty');
    const paginationEl = this.element.querySelector('#matchHistoryPagination');

    try {
      loadingEl?.classList.remove('hidden');
      listEl?.classList.add('hidden');
      emptyEl?.classList.add('hidden');
      paginationEl?.classList.add('hidden');

      const response = await this.apiService.getMatchHistory(this.currentPage, 10);
      const data = response.data || response;

      if (data.games && data.games.length > 0) {
        this.renderMatchHistory(data.games);
        this.updatePagination(data.pagination);
        listEl?.classList.remove('hidden');
        paginationEl?.classList.remove('hidden');
      } else {
        emptyEl?.classList.remove('hidden');
      }

    } catch (error) {
      console.error('Error loading match history:', error);
      emptyEl?.classList.remove('hidden');
    } finally {
      loadingEl?.classList.add('hidden');
    }
  }

  private renderMatchHistory(games: any[]): void {
    const listEl = this.element.querySelector('#matchHistoryList');
    if (!listEl) return;

    listEl.innerHTML = '';

    games.forEach((game) => {
      const gameDiv = document.createElement('div');
      gameDiv.className = 'p-4 bg-white/40 rounded-xl border border-white/50';
      
      const isWin = game.isWin;
      const isDraw = game.isDraw;
      const resultClass = isWin ? 'text-green-600' : isDraw ? 'text-yellow-600' : 'text-red-600';
      const resultIcon = isWin ? '🏆' : isDraw ? '🤝' : '😞';
      const resultText = isWin ? 'Galibiyet' : isDraw ? 'Berabere' : 'Mağlubiyet';

      const opponent = game.host?.id === this.getCurrentUserId() ? game.guest : game.host;
      const opponentName = opponent?.display_name || opponent?.username || 'Bilinmeyen Oyuncu';

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };

      gameDiv.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-2xl">${resultIcon}</div>
            <div>
              <div class="font-medium ${resultClass}">${resultText}</div>
              <div class="text-sm text-gray-600">vs ${opponentName}</div>
              <div class="text-xs text-gray-500">${formatDate(game.finishedAt)}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg">${game.hostScore} - ${game.guestScore}</div>
            ${game.duration ? `<div class="text-xs text-gray-500">${formatDuration(game.duration)}</div>` : ''}
          </div>
        </div>
      `;

      listEl.appendChild(gameDiv);
    });
  }

  private updatePagination(pagination: any): void {
    if (!pagination) return;

    this.totalPages = pagination.totalPages || 1;
    
    const pageInfo = this.element.querySelector('#pageInfo');
    const prevBtn = this.element.querySelector('#prevPageBtn') as HTMLButtonElement;
    const nextBtn = this.element.querySelector('#nextPageBtn') as HTMLButtonElement;

    if (pageInfo) {
      pageInfo.textContent = `Sayfa ${this.currentPage} / ${this.totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= this.totalPages;
    }
  }

  private async loadGameStats(): Promise<void> {
    const loadingEl = this.element.querySelector('#gameStatsLoading');
    const contentEl = this.element.querySelector('#gameStatsContent');

    try {
      loadingEl?.classList.remove('hidden');
      contentEl?.classList.add('hidden');

      const response = await this.apiService.getGameStats();
      const stats = response.data || response;

      this.renderGameStats(stats);
      contentEl?.classList.remove('hidden');

    } catch (error) {
      console.error('Error loading game stats:', error);
    } finally {
      loadingEl?.classList.add('hidden');
    }
  }

  private renderGameStats(stats: any): void {
    const totalGamesEl = this.element.querySelector('#totalGamesCount');
    const winsEl = this.element.querySelector('#winsCount');
    const lossesEl = this.element.querySelector('#lossesCount');
    const winRateEl = this.element.querySelector('#winRatePercent');

    if (totalGamesEl) totalGamesEl.textContent = stats.totalGames || '0';
    if (winsEl) winsEl.textContent = stats.wins || '0';
    if (lossesEl) lossesEl.textContent = stats.losses || '0';
    if (winRateEl) winRateEl.textContent = `${stats.winRate || '0.0'}%`;
  }

  private getCurrentUserId(): number {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || 0;
    } catch {
      return 0;
    }
  }

  public render(): HTMLElement { return this.element; }
  public destroy(): void { this.element.remove(); }
}
