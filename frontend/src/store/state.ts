import type { User } from '../services/auth';

export interface GameState {
  isInGame: boolean;
  currentGameId?: string;
  opponentId?: number;
  score?: {
    player1: number;
    player2: number;
  };
}

export interface TournamentState {
  activeTournaments: any[];
  currentTournament?: any;
  userTournaments: any[];
}

export interface ChatState {
  activeChannels: string[];
  currentChannel?: string;
  unreadCounts: Record<string, number>;
  onlineUsers: any[];
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  game: GameState;
  tournament: TournamentState;
  chat: ChatState;
  notifications: any[];
}

export type StateListener<T = AppState> = (state: T) => void;

export class StateManager {
  private state: AppState;
  private listeners: Array<StateListener> = [];

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): AppState {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      game: {
        isInGame: false,
      },
      tournament: {
        activeTournaments: [],
        userTournaments: [],
      },
      chat: {
        activeChannels: [],
        unreadCounts: {},
        onlineUsers: [],
      },
      notifications: [],
    };
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public setState(partialState: Partial<AppState>): void {
    this.state = {
      ...this.state,
      ...partialState,
    };
    this.notifyListeners();
  }

  public updateState<K extends keyof AppState>(
    key: K,
    value: Partial<AppState[K]>
  ): void {
    const currentValue = this.state[key];
    if (typeof currentValue === 'object' && currentValue !== null) {
      this.state[key] = {
        ...currentValue,
        ...value,
      } as AppState[K];
    } else {
      this.state[key] = value as AppState[K];
    }
    this.notifyListeners();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.getState());
    });
  }

  public setUser(user: User | null): void {
    this.setState({
      user,
      isAuthenticated: !!user,
    });
  }

  public setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  public startGame(gameId: string, opponentId?: number): void {
    this.updateState('game', {
      isInGame: true,
      currentGameId: gameId,
      opponentId,
      score: { player1: 0, player2: 0 },
    });
  }

  public updateGameScore(player1: number, player2: number): void {
    this.updateState('game', {
      score: { player1, player2 },
    });
  }

  public endGame(): void {
    this.updateState('game', {
      isInGame: false,
      currentGameId: undefined,
      opponentId: undefined,
      score: undefined,
    });
  }

  public setActiveTournaments(tournaments: any[]): void {
    this.updateState('tournament', {
      activeTournaments: tournaments,
    });
  }

  public setCurrentTournament(tournament: any): void {
    this.updateState('tournament', {
      currentTournament: tournament,
    });
  }

  public setUserTournaments(tournaments: any[]): void {
    this.updateState('tournament', {
      userTournaments: tournaments,
    });
  }

  public addActiveChannel(channelId: string): void {
    const { activeChannels } = this.state.chat;
    if (!activeChannels.includes(channelId)) {
      this.updateState('chat', {
        activeChannels: [...activeChannels, channelId],
      });
    }
  }

  public removeActiveChannel(channelId: string): void {
    const { activeChannels } = this.state.chat;
    this.updateState('chat', {
      activeChannels: activeChannels.filter(id => id !== channelId),
    });
  }

  public setCurrentChannel(channelId: string | undefined): void {
    this.updateState('chat', {
      currentChannel: channelId,
    });
  }

  public updateUnreadCount(channelId: string, count: number): void {
    this.updateState('chat', {
      unreadCounts: {
        ...this.state.chat.unreadCounts,
        [channelId]: count,
      },
    });
  }

  public setOnlineUsers(users: any[]): void {
    this.updateState('chat', {
      onlineUsers: users,
    });
  }

  public addNotification(notification: any): void {
    this.setState({
      notifications: [...this.state.notifications, notification],
    });
  }

  public removeNotification(notificationId: string): void {
    this.setState({
      notifications: this.state.notifications.filter(
        notif => notif.id !== notificationId
      ),
    });
  }

  public clearNotifications(): void {
    this.setState({
      notifications: [],
    });
  }

  public saveToStorage(): void {
    try {
      const stateToSave = {
        user: this.state.user,
        chat: {
          activeChannels: this.state.chat.activeChannels,
          currentChannel: this.state.chat.currentChannel,
        },
      };
      localStorage.setItem('appState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  }

  public loadFromStorage(): void {
    try {
      const savedState = localStorage.getItem('appState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.setState({
          ...this.state,
          ...parsedState,
        });
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error);
    }
  }

  public reset(): void {
    this.state = this.getInitialState();
    this.notifyListeners();
  }
}

export const state = new StateManager();
