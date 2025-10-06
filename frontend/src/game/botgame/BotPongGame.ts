interface GameState {
  paddles: Array<{ x: number; y: number }>;
  ball: { x: number; y: number; velocityX: number; velocityY: number };
  scores: [number, number];
  gameActive: boolean;
}

interface BotPersonality {
  reflexTime: number;
  accuracy: number;
  aggressiveness: number;
  mistakeChance: number;
  speedVariation: number;
}

export class BotPongGame {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private animationId: number | null = null;
  
  private gameState: GameState = {
    paddles: [
      { x: 20, y: 160 },
      { x: 770, y: 160 } 
    ],
    ball: { 
      x: 400, 
      y: 200, 
      velocityX: 5, 
      velocityY: 3 
    },
    scores: [0, 0],
    gameActive: true
  };

  private keys: { [key: string]: boolean } = {};
  private playerSpeed = 6;
  
  private botPersonality: BotPersonality;
  private botLastDecision = 0;
  private botTargetY = 200;
  private botDecisionDelay = 0;
  private botCurrentSpeed = 0;
  private botDirection = 0; // -1, 0, 1
  
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 80;
  private readonly BALL_RADIUS = 8;
  private readonly WINNING_SCORE = 5;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context alınamadı");
    
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.gameState.scores = [0, 0];
    console.log('Game scores initialized:', this.gameState.scores);
    
    this.botPersonality = this.generateBotPersonality();
    
    this.setupEventListeners();
    
    console.log('About to update score display in constructor');
    this.updateScoreDisplay();
    
    setTimeout(() => {
      console.log('Delayed score update in constructor');
      this.updateScoreDisplay();
    }, 100);
    
    this.startGameLoop();
  }

  private generateBotPersonality(): BotPersonality {
    const personalities = [
      { reflexTime: 200, accuracy: 0.7, aggressiveness: 0.3, mistakeChance: 0.15, speedVariation: 0.4 },
      { reflexTime: 150, accuracy: 0.8, aggressiveness: 0.5, mistakeChance: 0.1, speedVariation: 0.3 },
      { reflexTime: 100, accuracy: 0.9, aggressiveness: 0.7, mistakeChance: 0.05, speedVariation: 0.2 },
      { reflexTime: 180, accuracy: 0.75, aggressiveness: 0.6, mistakeChance: 0.12, speedVariation: 0.5 }
    ];
    
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key] = true;
  }

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key] = false;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      if (this.gameState.gameActive) {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(gameLoop);
      }
    };
    gameLoop();
  }

  private update(): void {
    this.updatePlayer();
    this.updateBot();
    this.updateBall();
    this.checkCollisions();
    this.checkScore();
  }

  private updatePlayer(): void {
    const paddle = this.gameState.paddles[0];
    
    if (this.keys['w'] || this.keys['W']) {
      paddle.y -= this.playerSpeed;
    }
    if (this.keys['s'] || this.keys['S']) {
      paddle.y += this.playerSpeed;
    }
    
    paddle.y = Math.max(0, Math.min(this.height - this.PADDLE_HEIGHT, paddle.y));
  }

  private updateBot(): void {
    const currentTime = Date.now();
    const botPaddle = this.gameState.paddles[1];
    const ball = this.gameState.ball;
    
    const shouldReact = ball.velocityX > 0 && ball.x > this.width / 2;
    
    if (shouldReact && currentTime - this.botLastDecision > this.botPersonality.reflexTime) {
      this.makeBotDecision();
      this.botLastDecision = currentTime;
    }
    
    if (this.botDecisionDelay <= 0) {
      this.executeBotMovement(botPaddle);
    } else {
      this.botDecisionDelay -= 16;
    }
  }

  private makeBotDecision(): void {
    const ball = this.gameState.ball;
    const botPaddle = this.gameState.paddles[1];
    
    if (Math.random() < this.botPersonality.mistakeChance) {
      const errorType = Math.random();
      if (errorType < 0.3) {
        this.botTargetY = ball.y + (Math.random() - 0.5) * 100;
      } else if (errorType < 0.6) {
        this.botDecisionDelay = 100 + Math.random() * 200;
        return;
      } else {
        this.botTargetY = ball.y + (Math.random() - 0.5) * 150;
      }
    } else {
      const predictedY = this.predictBallPosition();
      const accuracy = this.botPersonality.accuracy;
      const offset = (Math.random() - 0.5) * (1 - accuracy) * 100;
      this.botTargetY = predictedY + offset;
    }
    
    this.botTargetY = Math.max(
      this.PADDLE_HEIGHT / 2, 
      Math.min(this.height - this.PADDLE_HEIGHT / 2, this.botTargetY)
    );
    
    const paddleCenter = botPaddle.y + this.PADDLE_HEIGHT / 2;
    const difference = this.botTargetY - paddleCenter;
    
    if (Math.abs(difference) > 10) {
      this.botDirection = difference > 0 ? 1 : -1;
      const speedVariation = 1 + (Math.random() - 0.5) * this.botPersonality.speedVariation;
      this.botCurrentSpeed = 4 * speedVariation;
    } else {
      this.botDirection = 0;
    }
  }

  private predictBallPosition(): number {
    const ball = this.gameState.ball;
    const botX = this.gameState.paddles[1].x;
    const timeToReach = (botX - ball.x) / Math.abs(ball.velocityX);
    
    let predictedY = ball.y + ball.velocityY * timeToReach;
    
    while (predictedY < 0 || predictedY > this.height) {
      if (predictedY < 0) {
        predictedY = -predictedY;
      }
      if (predictedY > this.height) {
        predictedY = 2 * this.height - predictedY;
      }
    }
    
    return predictedY;
  }

  private executeBotMovement(botPaddle: { x: number; y: number }): void {
    if (this.botDirection !== 0) {
      const targetSpeed = this.botCurrentSpeed * this.botDirection;
      botPaddle.y += targetSpeed;
      
      if (Math.random() < 0.1) {
        botPaddle.y += (Math.random() - 0.5) * 2;
      }
    }
    
    botPaddle.y = Math.max(0, Math.min(this.height - this.PADDLE_HEIGHT, botPaddle.y));
  }

  private updateBall(): void {
    const ball = this.gameState.ball;
    
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    if (ball.y <= this.BALL_RADIUS || ball.y >= this.height - this.BALL_RADIUS) {
      ball.velocityY = -ball.velocityY;
      ball.y = Math.max(this.BALL_RADIUS, Math.min(this.height - this.BALL_RADIUS, ball.y));
    }
  }

  private checkCollisions(): void {
    const ball = this.gameState.ball;
    const paddles = this.gameState.paddles;
    
    if (ball.x - this.BALL_RADIUS <= paddles[0].x + this.PADDLE_WIDTH &&
        ball.x + this.BALL_RADIUS >= paddles[0].x &&
        ball.y >= paddles[0].y &&
        ball.y <= paddles[0].y + this.PADDLE_HEIGHT &&
        ball.velocityX < 0) {
      
      this.handlePaddleCollision(0);
    }
    
    if (ball.x + this.BALL_RADIUS >= paddles[1].x &&
        ball.x - this.BALL_RADIUS <= paddles[1].x + this.PADDLE_WIDTH &&
        ball.y >= paddles[1].y &&
        ball.y <= paddles[1].y + this.PADDLE_HEIGHT &&
        ball.velocityX > 0) {
      
      this.handlePaddleCollision(1);
    }
  }

  private handlePaddleCollision(paddleIndex: number): void {
    const ball = this.gameState.ball;
    const paddle = this.gameState.paddles[paddleIndex];
    
    ball.velocityX = -ball.velocityX;
    
    const paddleCenter = paddle.y + this.PADDLE_HEIGHT / 2;
    const hitPosition = (ball.y - paddleCenter) / (this.PADDLE_HEIGHT / 2);
    
    ball.velocityY = hitPosition * 6;
    
    const speedMultiplier = 1.05;
    ball.velocityX *= speedMultiplier;
    ball.velocityY *= speedMultiplier;
    
    const maxSpeed = 12;
    if (Math.abs(ball.velocityX) > maxSpeed) {
      ball.velocityX = ball.velocityX > 0 ? maxSpeed : -maxSpeed;
    }
    if (Math.abs(ball.velocityY) > maxSpeed) {
      ball.velocityY = ball.velocityY > 0 ? maxSpeed : -maxSpeed;
    }
  }

  private checkScore(): void {
    const ball = this.gameState.ball;
    
    if (ball.x < -this.BALL_RADIUS) {
      this.gameState.scores[1]++;
      console.log('Bot scored! New score:', this.gameState.scores);
      this.resetBall(1);
      this.updateScoreDisplay();
    } else if (ball.x > this.width + this.BALL_RADIUS) {
      this.gameState.scores[0]++;
      console.log('Player scored! New score:', this.gameState.scores);
      this.resetBall(-1);
      this.updateScoreDisplay();
    }
    
    if (this.gameState.scores[0] >= this.WINNING_SCORE || this.gameState.scores[1] >= this.WINNING_SCORE) {
      this.endGame();
    }
  }

  private resetBall(direction: number): void {
    const ball = this.gameState.ball;
    
    ball.x = this.width / 2;
    ball.y = this.height / 2;
    ball.velocityX = 5 * direction;
    ball.velocityY = (Math.random() - 0.5) * 6;
    
    if (Math.random() < 0.3) {
      this.botPersonality = this.generateBotPersonality();
    }
  }

  private updateScoreDisplay(): void {
    console.log('Updating score display:', this.gameState.scores);
    
    const p1Score = document.getElementById("player1Score");
    const p2Score = document.getElementById("player2Score");
    
    if (p1Score) {
      const newScore = String(this.gameState.scores[0]);
      p1Score.textContent = newScore;
      p1Score.setAttribute('data-value', newScore);
      console.log('Player 1 score updated to:', newScore);
    } else {
      console.warn('Player 1 score element not found!');
    }
    
    if (p2Score) {
      const newScore = String(this.gameState.scores[1]);
      p2Score.textContent = newScore;
      p2Score.setAttribute('data-value', newScore);
      console.log('Player 2 score updated to:', newScore);
    } else {
      console.warn('Player 2 score element not found!');
    }
  }

  public endGame(): void {
    console.log('Ending game...');
    this.gameState.gameActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    const winner = this.gameState.scores[0] >= this.WINNING_SCORE ? "Oyuncu" : "Bot";
    
    setTimeout(() => {
      this.showGameOverlay(winner, this.gameState.scores);
    }, 500);
  }

  private showGameOverlay(winner: string, finalScore: [number, number]): void {
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
      const resultTitle = document.getElementById('gameResultTitle');
      const resultText = document.getElementById('gameResultText');

      if (resultTitle && resultText) {
        if (winner === 'Oyuncu') {
          resultTitle.textContent = '🎉 Tebrikler! Kazandınız!';
          resultTitle.style.color = '#22c55e';
          resultText.innerHTML = `<span style="color: #22c55e;">👤 Oyuncu: ${finalScore[0]}</span> - <span style="color: #f59e0b;">🤖 AI Bot: ${finalScore[1]}</span>`;
        } else {
          resultTitle.textContent = '🤖 AI Bot Kazandı!';
          resultTitle.style.color = '#f59e0b';
          resultText.innerHTML = `<span style="color: #22c55e;">👤 Oyuncu: ${finalScore[0]}</span> - <span style="color: #f59e0b; font-family: 'Courier New', monospace;">🤖 AI Bot: ${finalScore[1]}</span>`;
        }
        overlay.style.display = 'flex';
      }
    } else {
      console.log(`Game ended: ${winner} won! Final score: ${finalScore[0]} - ${finalScore[1]}`);
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.gameState.ball.x, this.gameState.ball.y, this.BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#2357ff";
    ctx.fillRect(
      this.gameState.paddles[0].x, 
      this.gameState.paddles[0].y, 
      this.PADDLE_WIDTH, 
      this.PADDLE_HEIGHT
    );
    
    ctx.fillStyle = "#19b35a";
    ctx.fillRect(
      this.gameState.paddles[1].x, 
      this.gameState.paddles[1].y, 
      this.PADDLE_WIDTH, 
      this.PADDLE_HEIGHT
    );
  }

  public destroy(): void {
    console.log('Destroying BotPongGame...');
    
    this.gameState.gameActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    this.gameState.scores = [0, 0];
    this.gameState.paddles = [
      { x: 20, y: 160 },
      { x: 770, y: 160 }
    ];
    this.gameState.ball = { 
      x: 400, 
      y: 200, 
      velocityX: 5, 
      velocityY: 3 
    };
    
    this.botLastDecision = 0;
    this.botTargetY = 200;
    this.botDecisionDelay = 0;
    this.botCurrentSpeed = 0;
    this.botDirection = 0;
    
    setTimeout(() => {
      this.updateScoreDisplay();
    }, 50);
    
    console.log('BotPongGame destroyed successfully');
  }

  public resetGame(): void {
    console.log('Resetting game...');
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.gameState = {
      paddles: [
        { x: 20, y: 160 },
        { x: 770, y: 160 }
      ],
      ball: { 
        x: 400, 
        y: 200, 
        velocityX: 5, 
        velocityY: 3 
      },
      scores: [0, 0],
      gameActive: true
    };
    
    this.botPersonality = this.generateBotPersonality();
    this.botLastDecision = 0;
    this.botTargetY = 200;
    this.botDecisionDelay = 0;
    this.botCurrentSpeed = 0;
    this.botDirection = 0;
    
    this.updateScoreDisplay();
    
    const overlay = document.getElementById('gameOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
    
    this.startGameLoop();
    
    console.log('Game reset completed');
  }
}
