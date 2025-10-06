import { ApiService } from '../services/api';
import { Config } from '../config';
import { 
  initGlobalSocket,
  registerChatEvents,
  sendPrivateMessage,
  joinConversation,
  sendTyping
} from '../socket/client';

interface Friend {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
  sender?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
}

export class ChatPage {
  private element: HTMLElement;
  private selectedFriend: Friend | null = null;
  private api: ApiService;
  private friends: Friend[] | null = null;
  private currentUserId: number | null = null;
  private messages: Message[] = [];

  constructor() {
    this.element = document.createElement('div');
    this.api = new ApiService();
    
    this.getCurrentUserId();
    
    this.setup();
    this.loadFriends();
    this.setupSocket();
  }

  private getCurrentUserId() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('� Raw user data from localStorage:', user);
    
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log('🔍 Parsed userData:', userData);
        
        this.currentUserId = Number(userData.id || userData.userId || userData.user_id);
        
        console.log('🔍 Current user ID from localStorage:', this.currentUserId);
        
        if (!this.currentUserId && token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Token payload:', payload);
            this.currentUserId = Number(payload.userId || payload.id || payload.user_id);
            console.log('🔍 User ID from token:', this.currentUserId);
          } catch (e) {
            console.error('Error decoding token:', e);
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    if (!this.currentUserId && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token payload (fallback):', payload);
        this.currentUserId = Number(payload.userId || payload.sub || payload.id);
        console.log('🔍 User ID from token (fallback):', this.currentUserId);
      } catch (e) {
        console.error('Error decoding token (fallback):', e);
      }
    }
    
    console.log('🔍 Final currentUserId:', this.currentUserId, typeof this.currentUserId);
  }

  private getAvatarUrl(avatarUrl: string): string {
    if (!avatarUrl) return '';
    return avatarUrl.startsWith('http') ? avatarUrl : `${Config.SERVER_URL}${avatarUrl}`;
  }

  private getAvatarElement(friend: Friend): string {
    if (friend.avatar_url) {
      const avatarUrl = this.getAvatarUrl(friend.avatar_url);
      return `<img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200 friend-avatar" data-friend-id="${friend.id}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
              <div class="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg hidden cursor-pointer hover:scale-110 transition-transform duration-200 friend-avatar" data-friend-id="${friend.id}">
                ${(friend.display_name || friend.username).charAt(0).toUpperCase()}
              </div>`;
    } else {
      return `<div class="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-transform duration-200 friend-avatar" data-friend-id="${friend.id}">
                ${(friend.display_name || friend.username).charAt(0).toUpperCase()}
              </div>`;
    }
  }

  private getMessageAvatarElement(sender: any): string {
    const senderId = sender?.id || 0;
    if (sender?.avatarUrl) {
      const avatarUrl = this.getAvatarUrl(sender.avatarUrl);
      return `<img src="${avatarUrl}" class="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-200 message-avatar" data-sender-id="${senderId}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" />
              <div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 flex-shrink-0 hidden cursor-pointer hover:scale-110 transition-transform duration-200 message-avatar" data-sender-id="${senderId}">
                ${(sender.displayName || sender.username).charAt(0).toUpperCase()}
              </div>`;
    } else {
      return `<div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-200 message-avatar" data-sender-id="${senderId}">
                ${(sender?.displayName || sender?.username || 'U').charAt(0).toUpperCase()}
              </div>`;
    }
  }

  private formatLastSeen(lastSeen: string | undefined): string {
    if (!lastSeen) return '';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return lastSeenDate.toLocaleDateString('tr-TR');
  }

  private formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Dün ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  private async loadConversation(friendId: number) {
    try {
      const res = await this.api.get<{ messages: Message[] }>(`/chat/conversation/${friendId}`);
      this.messages = (res as any).messages || [];
      this.renderMessages();

      await this.api.post(`/chat/mark-read/${friendId}`, {});
      joinConversation(friendId);
    } catch (error) {
      console.error('[Chat] Error loading conversation:', error);
    }
  }

  private renderMessages() {
    const messageArea = this.element.querySelector('#messageArea .space-y-4');
    if (!messageArea) return;

    if (this.messages.length === 0) {
      messageArea.innerHTML = '<div class="text-center text-slate-400 py-8">Henüz mesaj yok. İlk mesajı gönder!</div>';
      return;
    }

    messageArea.innerHTML = this.messages.map((msg) => {
      const isMine = msg.senderId === this.currentUserId;
      const sender = msg.sender;
      const time = this.formatMessageTime(msg.createdAt);
      
      if (isMine) {
        return `
          <div class="mb-4 flex justify-end">
            <div class="flex items-end space-x-2 max-w-xs lg:max-w-md">
              <div class="flex flex-col">
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm">
                  <p class="text-sm">${this.escapeHtml(msg.content)}</p>
                </div>
                <div class="text-xs text-slate-400 mt-1 text-right">
                  ${time} <span class="text-blue-500">✓</span>
                </div>
              </div>
              <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                Sen
              </div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="mb-4 flex justify-start">
            <div class="flex items-end space-x-2 max-w-xs lg:max-w-md">
              ${sender ? this.getMessageAvatarElement(sender) : `
                <div class="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
              `}
              <div class="flex flex-col">
                ${sender ? `
                  <div class="text-xs font-medium text-slate-600 mb-1 px-1">
                    ${sender.displayName || sender.username}
                  </div>
                ` : ''}
                <div class="bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <p class="text-sm">${this.escapeHtml(msg.content)}</p>
                </div>
                <div class="text-xs text-slate-400 mt-1 text-left px-1">
                  ${time}
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    setTimeout(() => {
      messageArea.scrollTop = messageArea.scrollHeight;
    }, 100);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async loadFriends() {
    console.log('[Chat] Starting to load friends...');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('[Chat] Auth token exists:', !!token);
    console.log('[Chat] User data exists:', !!user);
    console.log('[Chat] User data:', user);
    
    const friendsListDiv = this.element.querySelector('#friendsList');
    if (!friendsListDiv) {
      console.error('[Chat] Friends list element not found');
      return;
    }
    
    if (!token) {
      console.error('[Chat] No auth token found, user not logged in');
      friendsListDiv.innerHTML = '<div class="text-red-400">Giriş yapmanız gerekiyor.</div>';
      return;
    }
    
    friendsListDiv.innerHTML = '<div class="text-slate-400">Yükleniyor...</div>';
    try {
      console.log('🔍 Arkadaş listesi yükleniyor...');
      console.log('[Chat] Making API call to get friends...');
      const res = await this.api.get<{ friends: Friend[]; count: number }>('/friends/friends');
      console.log('📡 API yanıtı:', res);
      console.log('[Chat] Full API response:', JSON.stringify(res, null, 2));
      console.log('[Chat] res type:', typeof res);
      console.log('[Chat] res.friends (direct):', (res as any).friends);
      console.log('[Chat] res.data:', (res as any).data);
      
      const friends = (res as any).friends || [];
      
      this.friends = friends;
      if (friends.length === 0) {
        friendsListDiv.innerHTML = '<div class="text-slate-400">Hiç arkadaşın yok.</div>';
        return;
      }
      friendsListDiv.innerHTML = friends.map((friend: Friend) => `
        <div class="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/40 hover:shadow-sm transition-all cursor-pointer" data-friend="${friend.id}">
          <div class="relative">
            ${this.getAvatarElement(friend)}
            <div class="absolute -bottom-1 -right-1 w-3 h-3 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full"></div>
          </div>
          <div class="flex-1">
            <p class="font-medium text-slate-800">${friend.display_name || friend.username}</p>
            <p class="text-xs text-green-600">${friend.isOnline ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}</p>
          </div>
          <div class="text-xs text-slate-400">${this.formatLastSeen(friend.lastSeen)}</div>
        </div>
      `).join('');
      this.attachEventListeners();
    } catch (err) {
      console.error('❌ Arkadaşlar yüklenirken hata:', err);
      friendsListDiv.innerHTML = '<div class="text-red-400">Arkadaşlar yüklenemedi.</div>';
    }
  }

  private setup(): void {
    this.element.className = 'min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 flex';
    this.element.innerHTML = `
      <!-- Arkadaş Listesi Sidebar -->
      <div class="w-80 bg-white/80 backdrop-blur-sm border-r border-white/30">
        <div class="p-6 border-b border-white/30">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-lg">💬</span>
            </div>
            <h2 class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Neşeli Sohbet</h2>
          </div>
          <p class="text-sm text-gray-600">Arkadaşlarınla büyülü sohbetler ✨</p>
        </div>
        
        <!-- Arkadaş Listesi -->
        <div class="p-4">
          <h3 class="text-sm font-medium text-slate-700 mb-4">Arkadaşların</h3>
          <div id="friendsList" class="space-y-2">
            <!-- Arkadaş listesi buraya yüklenecek -->
          </div>
        </div>
      </div>

      <!-- Sohbet Alanı -->
      <div class="flex-1 flex items-center justify-center p-6">
        <!-- Başlangıç Ekranı -->
        <div id="chatWelcome" class="text-center">
          <div class="text-6xl mb-4">💬</div>
          <h3 class="text-xl font-light text-slate-800 mb-2">Sohbete Başla</h3>
          <p class="text-slate-600">Konuşmak istediğin arkadaşını seç</p>
        </div>

        <!-- Sohbet Kutucuğu (başlangıçda gizli) -->
        <div id="chatArea" class="hidden w-full max-h-[85vh] bg-gradient-to-br from-yellow-100/90 via-pink-100/90 to-blue-100/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/60 relative overflow-hidden mx-12 my-8">
          <!-- Dekoratif arka plan -->
          <div class="absolute top-0 right-0 w-40 h-40 bg-yellow-200/20 rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 left-0 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl"></div>
          
          <!-- Chat Header -->
          <div class="relative z-10 bg-white/50 backdrop-blur-sm border-b border-white/40 p-4 rounded-t-3xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="relative">
                  <img id="chatUserAvatar" src="/public/favicon.ico" class="w-10 h-10 rounded-full object-cover border-3 border-white/60 shadow-lg ring-4 ring-yellow-200/30 cursor-pointer hover:scale-110 transition-transform duration-200" style="display: none;" />
                  <div id="chatUserLetterAvatar" class="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg border-3 border-white/60 shadow-lg ring-4 ring-yellow-200/30 cursor-pointer hover:scale-110 transition-transform duration-200">
                    A
                  </div>
                  <div class="absolute inset-0 rounded-full bg-gradient-to-t from-yellow-200/20 to-transparent"></div>
                </div>
                <div>
                  <h3 id="chatUserName" class="text-lg font-medium text-gray-800 mb-1">Arkadaş</h3>
                  <p id="chatUserStatus" class="text-sm text-gray-600">Çevrimiçi</p>
                  <p id="typingIndicator" class="text-sm text-blue-500 italic font-medium"></p>
                </div>
              </div>
              <button id="closeChatBtn" class="group bg-white/70 backdrop-blur-sm text-gray-600 hover:text-gray-800 transition-all duration-300 p-2 rounded-xl hover:bg-white/90 hover:scale-110 shadow-md border border-white/50">
                <span class="text-lg group-hover:rotate-90 transition-transform duration-300">✕</span>
              </button>
            </div>
          </div>

          <!-- Mesajlar -->
          <div class="relative z-10 p-4 overflow-y-auto" id="messageArea" style="height: calc(85vh - 160px);">
            <div class="space-y-4">
              <!-- Mesajlar buraya gelecek -->
            </div>
          </div>

          <!-- Mesaj Gönderme -->
          <div class="relative z-10 bg-white/60 backdrop-blur-sm border-t border-white/40 p-4 rounded-b-3xl">
            <div class="flex space-x-2 items-end">
              <div class="flex-1">
                <input 
                  type="text" 
                  id="messageInput"
                  placeholder="Mesajını yaz... ✨" 
                  class="w-full bg-white/80 border border-gray-300/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent shadow-sm text-base placeholder-gray-500"
                />
              </div>
              <button 
                id="gameInviteBtn"
                class="group bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-3 rounded-xl hover:from-blue-500 hover:to-blue-600 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[48px]"
                title="Oyun Daveti Gönder"
              >
                <span class="text-lg group-hover:scale-125 transition-transform duration-300">🎮</span>
              </button>
              <button 
                id="tournamentInviteBtn"
                class="group bg-gradient-to-r from-purple-400 to-purple-500 text-white px-4 py-3 rounded-xl hover:from-purple-500 hover:to-purple-600 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[48px]"
                title="Turnuva Daveti Gönder"
              >
                <span class="text-lg group-hover:scale-125 transition-transform duration-300">🏆</span>
              </button>
              <button 
                id="sendMessageBtn"
                class="group bg-gradient-to-r from-yellow-300 to-pink-300 text-white px-4 py-3 rounded-xl hover:from-yellow-400 hover:to-pink-400 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[48px]"
                title="Mesaj Gönder"
              >
                <span class="text-lg group-hover:translate-x-1 transition-transform duration-300">✈️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Profil Paneli (başlangıçta gizli) -->
      <div id="profilePanel" class="hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 p-6 m-4 max-w-sm w-full relative">
          <button id="closeProfileBtn" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <span class="text-xl">✕</span>
          </button>
          
          <div class="text-center">
            <div class="relative mx-auto w-20 h-20 mb-4">
              <img id="profilePanelAvatar" src="" class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" style="display: none;" />
              <div id="profilePanelLetterAvatar" class="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                A
              </div>
            </div>
            
            <h3 id="profilePanelUsername" class="text-xl font-bold text-gray-800 mb-2">Kullanıcı Adı</h3>
            <p id="profilePanelEmail" class="text-sm text-gray-600 mb-4">email@example.com</p>
            
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
              <div class="flex items-center justify-center space-x-2">
                <div id="profilePanelStatus" class="w-3 h-3 bg-green-400 rounded-full"></div>
                <span id="profilePanelStatusText" class="text-sm text-gray-600">Çevrimiçi</span>
              </div>
            </div>
            
            <!-- Oyun İstatistikleri -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-3 text-center">🎮 Oyun İstatistikleri</h4>
              <div id="profileGameStatsLoading" class="text-center text-gray-500 text-sm">
                Yükleniyor...
              </div>
              <div id="profileGameStatsContent" class="hidden">
                <div class="grid grid-cols-2 gap-3 text-center">
                  <div class="bg-white/60 rounded-lg p-2">
                    <div id="profileTotalGames" class="text-lg font-bold text-gray-800">0</div>
                    <div class="text-xs text-gray-600">Toplam Oyun</div>
                  </div>
                  <div class="bg-white/60 rounded-lg p-2">
                    <div id="profileWinRate" class="text-lg font-bold text-green-600">0%</div>
                    <div class="text-xs text-gray-600">Kazanma Oranı</div>
                  </div>
                  <div class="bg-white/60 rounded-lg p-2">
                    <div id="profileWins" class="text-lg font-bold text-blue-600">0</div>
                    <div class="text-xs text-gray-600">Galibiyet</div>
                  </div>
                  <div class="bg-white/60 rounded-lg p-2">
                    <div id="profileLosses" class="text-lg font-bold text-red-600">0</div>
                    <div class="text-xs text-gray-600">Mağlubiyet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;

    this.attachEventListeners();
  }

  private setupSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = initGlobalSocket(token);

    registerChatEvents({
      onMessage: (msg) => {
        console.log('📨 Received message via socket:', msg);

        if (
          this.selectedFriend &&
          (
            (msg.senderId === this.selectedFriend.id && msg.receiverId === this.currentUserId) ||
            (msg.senderId === this.currentUserId && msg.receiverId === this.selectedFriend.id)
          )
        ) {
          this.messages.push(msg);
          this.renderMessages();
        }
      },
      onHistory: ({ friendId, messages }) => {
        if (this.selectedFriend && this.selectedFriend.id === friendId) {
          this.messages = messages;
          this.renderMessages();
        }
      },
      onTyping: ({ userId, isTyping }) => {
        if (this.selectedFriend && this.selectedFriend.id === userId) {
          const typingIndicator = this.element.querySelector('#typingIndicator');
          if (typingIndicator) {
            typingIndicator.textContent = isTyping ? 'Yazıyor...' : '';
          }
        }
      },
      onError: (msg) => {
        console.error('❌ Message error:', msg);
      },
    });

  socket.off("friend:status:changed").on("friend:status:changed",   ({ userId, isOnline, lastSeen }: { userId: number; isOnline: boolean; lastSeen?: string }) => {
    console.log(`📡 Friend status changed: User ${userId} is now ${isOnline ? 'online' : 'offline'}`);

    if (this.friends) {
      const friendIndex = this.friends.findIndex(f => f.id === userId);
      if (friendIndex !== -1) {
        this.friends[friendIndex].isOnline = isOnline;
        if (lastSeen) {
          this.friends[friendIndex].lastSeen = lastSeen;
        }

        this.updateFriendsList();

        if (this.selectedFriend && this.selectedFriend.id === userId) {
          this.selectedFriend.isOnline = isOnline;
          if (lastSeen) {
            this.selectedFriend.lastSeen = lastSeen;
          }
          const chatUserStatus = this.element.querySelector('#chatUserStatus');
          if (chatUserStatus) {
            chatUserStatus.textContent = isOnline ? 'Çevrimiçi' : `Çevrimdışı (${this.formatLastSeen(lastSeen)})`;
            chatUserStatus.className = `text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`;
          }
        }
      }
    }
  });


   socket.off("friend:blocked").on("friend:blocked", () => {

    this.selectedFriend = null;
    this.messages = [];

    const chatArea = this.element.querySelector('#chatArea');
    const chatWelcome = this.element.querySelector('#chatWelcome');
    if (chatArea && chatWelcome) {
      chatArea.classList.add('hidden');
      chatWelcome.classList.remove('hidden');
    }

    this.loadFriends();
  });
  }


  private attachEventListeners(): void {
    const friendItems = this.element.querySelectorAll('[data-friend]');
    friendItems.forEach(item => {
      item.addEventListener('click', () => {
        const friendId = item.getAttribute('data-friend');
        if (friendId) {
          const friendObj = this.friends?.find(f => f.id === Number(friendId));
          if (friendObj) {
            this.selectFriend(friendObj);
          }
        }
      });
    });
    
    const chatUserAvatar = this.element.querySelector('#chatUserAvatar');
    const chatUserLetterAvatar = this.element.querySelector('#chatUserLetterAvatar');
    const profilePanel = this.element.querySelector('#profilePanel');
    const closeProfileBtn = this.element.querySelector('#closeProfileBtn');
    
    const messageAvatars = this.element.querySelectorAll('.message-avatar');
    messageAvatars.forEach(avatar => {
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const senderId = avatar.getAttribute('data-sender-id');
        if (senderId && this.friends) {
          const friend = this.friends.find(f => f.id === Number(senderId));
          if (friend) {
            this.showProfilePanel(friend);
          }
        }
      });
    });
    
    const friendAvatars = this.element.querySelectorAll('.friend-avatar');
    friendAvatars.forEach(avatar => {
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const friendId = avatar.getAttribute('data-friend-id');
        if (friendId && this.friends) {
          const friend = this.friends.find(f => f.id === Number(friendId));
          if (friend) {
            this.showProfilePanel(friend);
          }
        }
      });
    });
    
    if (chatUserAvatar) {
      chatUserAvatar.addEventListener('click', () => {
        if (this.selectedFriend) {
          this.showProfilePanel(this.selectedFriend);
        }
      });
    }
    
    if (chatUserLetterAvatar) {
      chatUserLetterAvatar.addEventListener('click', () => {
        if (this.selectedFriend) {
          this.showProfilePanel(this.selectedFriend);
        }
      });
    }
    
    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => {
        this.hideProfilePanel();
      });
    }
    
    if (profilePanel) {
      profilePanel.addEventListener('click', (e) => {
        if (e.target === profilePanel) {
          this.hideProfilePanel();
        }
      });
    }
    
    const sendBtn = this.element.querySelector('#sendMessageBtn');
    const input = this.element.querySelector('#messageInput') as HTMLInputElement;
    const closeBtn = this.element.querySelector('#closeChatBtn');
    const gameInviteBtn = this.element.querySelector('#gameInviteBtn');
    const tournamentInviteBtn = this.element.querySelector('#tournamentInviteBtn');
    
    if (gameInviteBtn) {
      gameInviteBtn.addEventListener('click', () => {
        if (this.selectedFriend) {
          this.sendGameInvite();
        }
      });
    }
     
    if (tournamentInviteBtn) {
      tournamentInviteBtn.addEventListener('click', () => {
        if (this.selectedFriend) {
          this.sendTournamentInvite();
        }
      });
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const chatWelcome = this.element.querySelector('#chatWelcome');
        const chatArea = this.element.querySelector('#chatArea');
        
        if (chatWelcome && chatArea) {
          chatArea.classList.add('hidden');
          chatArea.classList.remove('flex', 'flex-col');
          chatWelcome.classList.remove('hidden');
          this.selectedFriend = null;
          this.messages = [];
        }
      });
    }
    
    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });

      let typingTimer: number;
      input.addEventListener('input', () => {
      if (this.selectedFriend) {
        sendTyping(this.selectedFriend.id, true);

        clearTimeout(typingTimer);
        typingTimer = window.setTimeout(() => {
          sendTyping(this.selectedFriend!.id, false);
        }, 1000);
      }
    });

    }
  }

private sendMessage() {
  const input = this.element.querySelector('#messageInput') as HTMLInputElement;
  const content = input?.value.trim();

  if (this.selectedFriend && content) {
    console.log(`📤 Sending message to ${this.selectedFriend.id}: ${content}`);

    sendPrivateMessage(this.selectedFriend.id, content);

    input.value = '';

    sendTyping(this.selectedFriend.id, false);
  }
}

  private sendGameInvite() {
    if (!this.selectedFriend) return;

    const inviteMessage = `🎮 ${this.selectedFriend.display_name || this.selectedFriend.username}, seni bir dostluk maçına davet ediyorum! Hazır mısın?`;

    sendPrivateMessage(this.selectedFriend.id, inviteMessage);

    this.showNotification('🎮 Oyun daveti gönderildi!', 'success');

    setTimeout(() => {
      (window as any).app.navigate('/twogame');
    }, 1000);
  }


  private sendTournamentInvite() {
    if (!this.selectedFriend) return;

    const inviteMessage = `🏆 ${this.selectedFriend.display_name || this.selectedFriend.username}, seni turnuvaya davet ediyorum! Şampiyonluk için hazır mısın?`;

    sendPrivateMessage(this.selectedFriend.id, inviteMessage);

    this.showNotification('🏆 Turnuva daveti gönderildi!', 'success');

    setTimeout(() => {
      (window as any).app.navigate('/tournament');
    }, 1000);
  }


  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
      notification.className += ' bg-green-500';
    } else if (type === 'error') {
      notification.className += ' bg-red-500';  
    } else {
      notification.className += ' bg-blue-500';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  private selectFriend(friend: Friend): void {
    console.log(`👤 Selecting friend: ${friend.username} (${friend.id})`);
    
    this.selectedFriend = friend;
    const chatWelcome = this.element.querySelector('#chatWelcome');
    const chatArea = this.element.querySelector('#chatArea');
    
    if (chatWelcome && chatArea) {
      chatWelcome.classList.add('hidden');
      chatArea.classList.remove('hidden');
      chatArea.classList.add('flex', 'flex-col');
      
      const chatUserName = this.element.querySelector('#chatUserName');
      const chatUserStatus = this.element.querySelector('#chatUserStatus');
      const chatUserAvatar = this.element.querySelector('#chatUserAvatar') as HTMLImageElement;
      const chatUserLetterAvatar = this.element.querySelector('#chatUserLetterAvatar') as HTMLElement;
      
      if (chatUserName) chatUserName.textContent = friend.display_name || friend.username;
      if (chatUserStatus) chatUserStatus.textContent = friend.isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
      
      if (friend.avatar_url) {
        if (chatUserAvatar) {
          chatUserAvatar.src = this.getAvatarUrl(friend.avatar_url);
          chatUserAvatar.style.display = 'block';
        }
        if (chatUserLetterAvatar) chatUserLetterAvatar.style.display = 'none';
      } else {
        if (chatUserAvatar) chatUserAvatar.style.display = 'none';
        if (chatUserLetterAvatar) {
          chatUserLetterAvatar.textContent = (friend.display_name || friend.username).charAt(0).toUpperCase();
          chatUserLetterAvatar.style.display = 'flex';
        }
      }
      
      this.loadConversation(friend.id);
    }
  }

  private updateFriendsList(): void {
    console.log('🔄 Updating friends list...');
    const friendsListDiv = this.element.querySelector('#friendsList');
    if (!friendsListDiv || !this.friends) {
      console.log('❌ Cannot update friends list: missing element or friends data');
      return;
    }

    console.log(`📋 Updating ${this.friends.length} friends in the list`);
    if (this.friends.length === 0) {
      friendsListDiv.innerHTML = '<div class="text-slate-400">Hiç arkadaşın yok.</div>';
      return;
    }

    friendsListDiv.innerHTML = this.friends.map((friend: Friend) => `
      <div class="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/40 hover:shadow-sm transition-all cursor-pointer" data-friend="${friend.id}">
        <div class="relative">
          ${this.getAvatarElement(friend)}
          <div class="absolute -bottom-1 -right-1 w-3 h-3 ${friend.isOnline ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white rounded-full"></div>
        </div>
        <div class="flex-1">
          <p class="font-medium text-slate-800">${friend.display_name || friend.username}</p>
          <p class="text-xs text-green-600">${friend.isOnline ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}</p>
        </div>
        <div class="text-xs text-slate-400">${this.formatLastSeen(friend.lastSeen)}</div>
      </div>
    `).join('');
    this.attachEventListeners();
    console.log('✅ Friends list updated successfully');
  }

  private async showProfilePanel(friend: Friend): Promise<void> {
    const profilePanel = this.element.querySelector('#profilePanel');
    const profilePanelAvatar = this.element.querySelector('#profilePanelAvatar') as HTMLImageElement;
    const profilePanelLetterAvatar = this.element.querySelector('#profilePanelLetterAvatar');
    const profilePanelUsername = this.element.querySelector('#profilePanelUsername');
    const profilePanelEmail = this.element.querySelector('#profilePanelEmail');
    const profilePanelStatus = this.element.querySelector('#profilePanelStatus');
    const profilePanelStatusText = this.element.querySelector('#profilePanelStatusText');
    
    if (!profilePanel) return;
    
    if (friend.avatar_url) {
      const avatarUrl = this.getAvatarUrl(friend.avatar_url);
      if (profilePanelAvatar) {
        profilePanelAvatar.src = avatarUrl;
        profilePanelAvatar.style.display = 'block';
      }
      if (profilePanelLetterAvatar) {
        (profilePanelLetterAvatar as HTMLElement).style.display = 'none';
      }
    } else {
      if (profilePanelAvatar) {
        profilePanelAvatar.style.display = 'none';
      }
      if (profilePanelLetterAvatar) {
        (profilePanelLetterAvatar as HTMLElement).style.display = 'flex';
        profilePanelLetterAvatar.textContent = (friend.display_name || friend.username).charAt(0).toUpperCase();
      }
    }
    
    if (profilePanelUsername) {
      profilePanelUsername.textContent = friend.display_name || friend.username;
    }
    
    if (profilePanelEmail) {
        profilePanelEmail.textContent = '@' + friend.username;
    }

    if (profilePanelStatus && profilePanelStatusText) {
      if (friend.isOnline) {
        (profilePanelStatus as HTMLElement).className = 'w-3 h-3 bg-green-400 rounded-full';
        profilePanelStatusText.textContent = 'Çevrimiçi';
      } else {
        (profilePanelStatus as HTMLElement).className = 'w-3 h-3 bg-gray-400 rounded-full';
        profilePanelStatusText.textContent = 'Çevrimdışı';
      }
    }

    await this.loadFriendGameStats(friend.id);

    profilePanel.classList.remove('hidden');
  }

  private hideProfilePanel(): void {
    const profilePanel = this.element.querySelector('#profilePanel');
    if (profilePanel) {
      profilePanel.classList.add('hidden');
    }
  }

  private async loadFriendGameStats(userId: number): Promise<void> {
    const loadingEl = this.element.querySelector('#profileGameStatsLoading');
    const contentEl = this.element.querySelector('#profileGameStatsContent');

    try {
      loadingEl?.classList.remove('hidden');
      contentEl?.classList.add('hidden');

      const stats = await this.getUserGameStats(userId);
      
      const totalGamesEl = this.element.querySelector('#profileTotalGames');
      const winsEl = this.element.querySelector('#profileWins');
      const lossesEl = this.element.querySelector('#profileLosses');
      const winRateEl = this.element.querySelector('#profileWinRate');

      if (totalGamesEl) totalGamesEl.textContent = stats.totalGames?.toString() || '0';
      if (winsEl) winsEl.textContent = stats.wins?.toString() || '0';
      if (lossesEl) lossesEl.textContent = stats.losses?.toString() || '0';
      if (winRateEl) winRateEl.textContent = `${stats.winRate || '0.0'}%`;

      contentEl?.classList.remove('hidden');
    } catch (error) {
      console.error('Oyun istatistikleri yüklenemedi:', error);
      if (loadingEl) loadingEl.textContent = 'İstatistikler yüklenemedi';
    } finally {
      loadingEl?.classList.add('hidden');
    }
  }

  private async getUserGameStats(userId: number): Promise<any> {
    try {
      const response = await this.api.get(`/users/${userId}/game-stats`);
      return response.data || response;
    } catch (error) {
      console.error('Kullanıcının oyun istatistikleri alınamadı:', error);
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0
      };
    }
  }

  public render(): HTMLElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
