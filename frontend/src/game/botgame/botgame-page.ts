import { BotPongGame } from './BotPongGame.js';
import './botgame-styles.css';

export class BotGamePageTest {
  private container: HTMLElement | null = null;
  private game: BotPongGame | null = null;
  private canvas: HTMLCanvasElement | null = null;

  public render(): string {
    return `
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #2d1b4e 100%); color: white; padding: 20px;">
        <h1 style="text-align: center; font-size: 3rem; color: #22c55e; margin-bottom: 30px;">
          🤖 AI Bot Rakip Test
        </h1>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; display: inline-block; border: 1px solid rgba(34, 197, 94, 0.3);">
            <!-- Player Score -->
            <div style="display: inline-block; text-align: center; margin-right: 30px;">
              <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 5px;">👤 OYUNCU</div>
              <span id="player1Score" style="font-size: 2.5rem; color: #22c55e; font-weight: bold; text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);">0</span>
            </div>
            
            <!-- VS Separator -->
            <div style="display: inline-block; margin: 0 20px; text-align: center;">
              <div style="font-size: 0.7rem; color: #64748b; margin-bottom: 5px;">VS</div>
              <span style="font-size: 1.5rem; color: #64748b;">⚔️</span>
            </div>
            
            <!-- Bot Score -->
            <div style="display: inline-block; text-align: center; margin-left: 30px;">
              <div style="font-size: 0.9rem; color: #f59e0b; margin-bottom: 5px;">🤖 AI BOT</div>
              <span id="player2Score" style="font-size: 2.5rem; color: #f59e0b; font-weight: bold; text-shadow: 0 0 10px rgba(245, 158, 11, 0.5); font-family: 'Courier New', monospace;">0</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px; position: relative;">
          <canvas id="botGameCanvas" width="800" height="400" 
                  style="border: 2px solid #22c55e; border-radius: 15px; background: black;">
          </canvas>
          
          <!-- Game Over Overlay -->
          <div id="gameOverlay" style="display: none; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 800px; height: 400px; background: rgba(0,0,0,0.9); border-radius: 15px; align-items: center; justify-content: center;">
            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; border: 2px solid #22c55e;">
              <h2 id="gameResultTitle" style="color: #22c55e; font-size: 2.5rem; margin: 0 0 20px 0;">🎮 Oyun Bitti!</h2>
              <p id="gameResultText" style="font-size: 1.3rem; margin: 0 0 30px 0; color: #e5e7eb;">Sonuç burada görünecek</p>
              <button id="playAgainBtn" style="background: #22c55e; color: white; border: none; padding: 15px 30px; border-radius: 15px; font-size: 1.2rem; cursor: pointer; font-weight: 600;">
                🔄 Tekrar Oyna
              </button>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <button id="resetBtn" style="background: #22c55e; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.1rem; cursor: pointer; margin-right: 10px;">
            🔄 Yeniden Başlat
          </button>
          <button id="quitBtn" style="background: #ef4444; color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 1.1rem; cursor: pointer;">
            🔙 Geri Dön
          </button>
        </div>
      </div>
    `;
  }

  public mount(container: HTMLElement): void {
    console.log('BotGamePageTest mount called', container);
    this.container = container;
    
    try {
      container.innerHTML = this.render();
      console.log('HTML rendered successfully');
      
      this.resetScoreDisplay();
      
      this.setupPageChangeListener();
      
      setTimeout(() => {
        this.setupEventListeners();
        console.log('Event listeners setup completed');
        this.initializeGame();
      }, 100);
      
    } catch (error) {
      console.error('Error in mount:', error);
      this.showError('Sayfa yüklenirken bir hata oluştu.');
    }
  }

  private setupEventListeners(): void {
    console.log('Setting up event listeners...');
    
    const resetBtn = document.getElementById('resetBtn');
    const quitBtn = document.getElementById('quitBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');

    console.log('Found buttons:', { resetBtn, quitBtn, playAgainBtn });

    if (resetBtn) {
      console.log('Adding reset button listener');
      resetBtn.addEventListener('click', () => {
        console.log('Reset button clicked');
        this.handleReset();
      });
    }

    if (quitBtn) {
      console.log('Adding quit button listener');
      quitBtn.addEventListener('click', () => {
        console.log('Quit button clicked');
        this.handleQuit();
      });
    }

    if (playAgainBtn) {
      console.log('Adding play again button listener');
      playAgainBtn.addEventListener('click', () => {
        console.log('Play again button clicked');
        this.handlePlayAgain();
      });
    }
  }

  private initializeGame(): void {
    console.log('Initializing game...');
    
    this.resetScoreDisplay();
    
    this.canvas = document.getElementById('botGameCanvas') as HTMLCanvasElement;
    
    if (!this.canvas) {
      console.error('Canvas element bulunamadı!');
      return;
    }

    console.log('Canvas found:', this.canvas);

    try {
      this.game = new BotPongGame(this.canvas);
      console.log('Game created successfully');
      
      setTimeout(() => {
        this.resetScoreDisplay();
      }, 200);
      
    } catch (error) {
      console.error('Oyun başlatılırken hata:', error);
    }
  }

  private handleReset(): void {
    console.log('handleReset called');
    try {
      if (this.game) {
        console.log('Resetting game...');
        this.game.resetGame();
      } else {
        console.log('No game instance found, reinitializing...');
        this.initializeGame();
      }
      this.hideGameOverlay();
    } catch (error) {
      console.error('Error in handleReset:', error);
    }
  }

  private handlePlayAgain(): void {
    console.log('handlePlayAgain called');
    try {
      if (this.game) {
        console.log('Restarting game...');
        this.game.resetGame();
      } else {
        console.log('No game instance found, reinitializing...');
        this.initializeGame();
      }
      this.hideGameOverlay();
    } catch (error) {
      console.error('Error in handlePlayAgain:', error);
    }
  }

  private hideGameOverlay(): void {
    console.log('hideGameOverlay called');
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
      console.log('Hiding overlay...');
      overlay.style.display = 'none';
    } else {
      console.log('Overlay not found!');
    }
  }

  private handleQuit(): void {
    console.log('handleQuit called - direct quit without confirmation');
    
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }

    console.log('Redirecting to /game');
    window.location.href = '/game';
  }

  private showError(message: string): void {
    console.error(message);
    if (this.container) {
      this.container.innerHTML = `
        <div style="min-height: 100vh; background: #1a1a1a; color: white; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; background: rgba(239,68,68,0.1); padding: 40px; border-radius: 15px; border: 2px solid #ef4444;">
            <h2 style="color: #ef4444; margin: 0 0 15px 0;">❌ Hata</h2>
            <p style="margin: 0 0 20px 0;">${message}</p>
            <button onclick="window.location.reload()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
              Sayfayı Yenile
            </button>
          </div>
        </div>
      `;
    }
  }

  public unmount(): void {
    console.log('BotGamePageTest unmounting...');
    
    if (this.game) {
      console.log('Destroying game...');
      this.game.destroy();
      this.game = null;
    }
    
    this.removePageChangeListeners();
    
    this.canvas = null;
    
    this.hideGameOverlay();
    
    this.resetScoreDisplay();
    
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    
    console.log('BotGamePageTest unmounted successfully');
  }

  private removePageChangeListeners(): void {
    console.log('Removing page change listeners...');
    
    window.removeEventListener('popstate', this.handlePageChange);
    document.removeEventListener('click', this.handleLinkClick);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private resetScoreDisplay(): void {
    console.log('Resetting score display...');
    
    setTimeout(() => {
      const p1Score = document.getElementById("player1Score");
      const p2Score = document.getElementById("player2Score");
      
      console.log('Score elements found:', { p1Score, p2Score });
      
      if (p1Score) {
        p1Score.textContent = "0";
        p1Score.removeAttribute('data-value');
        console.log('Player 1 score reset to 0, current text:', p1Score.textContent);
      } else {
        console.warn('Player 1 score element not found!');
      }
      
      if (p2Score) {
        p2Score.textContent = "0";
        p2Score.removeAttribute('data-value');
        console.log('Player 2 score reset to 0, current text:', p2Score.textContent);
      } else {
        console.warn('Player 2 score element not found!');
      }
    }, 50);
  }

  private setupPageChangeListener(): void {
    console.log('Setting up page change listener...');
    
    window.addEventListener('popstate', this.handlePageChange);
    
    document.addEventListener('click', this.handleLinkClick);
    
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handlePageChange = () => {
    console.log('Page change detected, ending game...');
    this.endGameOnPageChange();
  }

  private handleLinkClick = (e: Event) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'A' || target.closest('a') || 
        target.classList.contains('nav-link') || target.closest('.nav-link')) {
      
      const href = target.getAttribute('href') || target.closest('a')?.getAttribute('href');
      
      if (href && !href.includes('/botgame') && !href.includes('#')) {
        console.log('Navigation to different page detected:', href);
        this.endGameOnPageChange();
      }
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('Tab hidden, pausing/ending game...');
      this.endGameOnPageChange();
    }
  }

  private endGameOnPageChange(): void {
    if (this.game) {
      console.log('Ending game due to page change - direct destroy without overlay');
      this.game.destroy();
      this.game = null;
    }
  }
}
