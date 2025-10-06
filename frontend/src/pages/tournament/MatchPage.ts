import { sendMatchInput, leaveMatch } from "@/socket/tournament";

export function createMatchPage(
  roomCode: string,
  players?: { p1: string; p2: string }
): string {
  const p1 = players?.p1 ?? "Oyuncu 1";
  const p2 = players?.p2 ?? "Oyuncu 2";

  return `
    <div class="two-player-game-container">
      <div class="game-header">
        <h1 class="game-title">🏆 Turnuva Maçı</h1>
        <div class="game-subtitle">Oda Kodu: ${roomCode}</div>
      </div>

      <div class="score-board">
        <div class="player-score">
          <div class="player-name" id="p1Name">${p1}</div>
          <div class="score" id="player1Score">0</div>
        </div>
        <div class="score-divider">-</div>
        <div class="player-score">
          <div class="player-name" id="p2Name">${p2}</div>
          <div class="score" id="player2Score">0</div>
        </div>
      </div>

      <div class="game-canvas-container">
        <canvas id="pongCanvas" class="game-canvas" width="800" height="400"></canvas>
      </div>

      <div id="countdownModal" style="display:none">
        <div id="countdownNumber">3</div>
        <div>Maç başlıyor...</div>
      </div>

      <div id="winnerModal" class="winner-modal" style="display:none">
        <div class="modal-content">
          <div id="winnerEmoji" class="winner-emoji">🏆</div>
          <div id="winnerText" class="winner-text"></div>
          <div id="winnerScore" class="winner-score"></div>
          <div class="modal-buttons">
            <button id="exitBtn" class="control-btn danger-btn">← Çık</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
}

export function initMatchGame(roomCode: string, playerIndex: 0 | 1, players?: { p1: string; p2: string }) {
  const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
  if (!canvas) return;

  const keyDownHandler = (e: KeyboardEvent) => {
    if (["w"].includes(e.key)) {
      sendMatchInput(roomCode, playerIndex, -1);
    }
    if (["s"].includes(e.key)) {
      sendMatchInput(roomCode, playerIndex, 1);
    }
  };

  const keyUpHandler = (e: KeyboardEvent) => {
    if (["w", "s"].includes(e.key)) {
      sendMatchInput(roomCode, playerIndex, 0);
    }
  };

  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);

  return () => {
    document.removeEventListener("keydown", keyDownHandler);
    document.removeEventListener("keyup", keyUpHandler);
  };
}
