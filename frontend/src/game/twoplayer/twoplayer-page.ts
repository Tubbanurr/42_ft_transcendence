import { TwoPlayerPongGame } from "./game2";
import { initGlobalSocket } from "../../socket/client";

let twoSocket: any | null = null;

async function ensureTwoSocket(): Promise<any> {
  const token = localStorage.getItem("token") || "";
  const s = initGlobalSocket(token);
  await new Promise<void>((resolve) => {
    if ((s as any)?.connected) return resolve();
    s.once("connect", () => resolve());
  });
  twoSocket = s;
  return s;
}

export function createTwoPlayerGamePage(): string {
  return `
    <div class="two-player-game-container">
      <div class="game-header">
        <h1 class="game-title">🔮 Bing Bong Dostluk Maçı</h1>
        <div class="game-subtitle" id="status">Hazır</div>
      </div>

      <div class="score-board">
        <div class="player-score">
          <div class="player-name" id="p1Name">Oyuncu 1</div>
          <div class="score" id="player1Score">0</div>
        </div>
        <div class="score-divider">-</div>
        <div class="player-score">
          <div class="player-name" id="p2Name">Oyuncu 2</div>
          <div class="score" id="player2Score">0</div>
        </div>
      </div>

      <div class="game-canvas-container">
        <canvas id="twoPlayerGameCanvas" class="game-canvas" width="800" height="400" tabindex="0"></canvas>
      </div>

      <div class="game-controls">
        <button id="startBtn" class="control-btn primary-btn">🚀 Maç Bul</button>
        <button id="backBtn" class="control-btn danger-btn">← Geri Dön</button>
      </div>

      <!-- Countdown Modal -->
      <div id="countdownModal" style="display:none">
        <div id="countdownNumber">5</div>
        <div>Maç başlıyor...</div>
      </div>

      <!-- Winner Modal -->
      <div id="winnerModal" class="winner-modal" style="display:none">
        <div class="modal-content">
          <div id="winnerEmoji" class="winner-emoji">🏆</div>
          <div id="winnerText" class="winner-text"></div>
          <div id="winnerScore" class="winner-score"></div>
          <div class="modal-buttons">
            <button id="rematchBtn" class="control-btn primary-btn">↻ Rövanş</button>
            <button id="exitBtn" class="control-btn danger-btn">← Çık</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initializeTwoPlayerGame(): TwoPlayerPongGame | null {
  const canvas = document.getElementById("twoPlayerGameCanvas") as HTMLCanvasElement;
  if (!canvas) return null;

  ensureTwoSocket().then((s) => applyHandlers(s)).catch(() => {});

  const game = new TwoPlayerPongGame(canvas);

  let roomId: string | null = null;
  let playerIndex: number | null = null;
  let usernames: [string, string] = ["Oyuncu 1", "Oyuncu 2"];
  let hasLeft = false;

  function safeLeave() {
    if (hasLeft) return;
    hasLeft = true;
    try {
      game.destroy();
    } catch {}
    if (roomId !== null && playerIndex !== null) {
      twoSocket?.emit("two:leave", { roomId, playerIndex });
    }
  }

  const pressed = new Set<string>();
  const keydown = (e: KeyboardEvent) => {
    if (playerIndex === null || roomId === null) return;
    const k = e.key.toLowerCase();
    if ((k === "w" || k === "s") && !pressed.has(k)) {
      pressed.add(k);
      const dir = k === "w" ? -1 : 1;
      twoSocket?.emit("two:input", { roomId, playerIndex, dir });
    }
  };
  const keyup = (e: KeyboardEvent) => {
    if (playerIndex === null || roomId === null) return;
    const k = e.key.toLowerCase();
    if (k === "w" || k === "s") {
      pressed.delete(k);
      twoSocket?.emit("two:input", { roomId, playerIndex, dir: 0 });
    }
  };

  function disableInputsAndGame() {
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("keyup", keyup);
    pressed.clear();
    try {
      game.destroy();
    } catch {}
    (document.getElementById("startBtn") as HTMLButtonElement)?.setAttribute("disabled", "true");
  }

  function showWinnerModal(
    winnerIndex: number | null,
    scores: [number, number],
    reason?: string
  ) {
    const modal = document.getElementById("winnerModal") as HTMLElement;
    const textEl = document.getElementById("winnerText")!;
    const scoreEl = document.getElementById("winnerScore")!;
    const emojiEl = document.getElementById("winnerEmoji")!;
    const status = document.getElementById("status");

    let text = "Oyun sona erdi.";

    const actualWinner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null;

    if (actualWinner === null && reason !== "left") {
      text = "Berabere! 🤝";
      emojiEl.textContent = "🤝";
      if (status) status.textContent = "Maç bitti: Berabere";
    } else {
      const finalWinner = winnerIndex !== null ? winnerIndex : actualWinner;
      if (finalWinner !== null) {
        const youWin = playerIndex !== null && finalWinner === playerIndex;
        const winnerName = usernames[finalWinner] || `Oyuncu ${finalWinner + 1}`;
        if (reason === "left") {
          text = youWin ? "Kazandın! 🏆" : "Kaybettin. 😿";
          text += " (Rakip oyundan ayrıldı)";
        } else {
          text = youWin ? `Kazandın! 🏆` : `${winnerName} Kazandı! 🏆`;
        }
        emojiEl.textContent = "🏆";
        if (status) {
          status.textContent = youWin ? "Maç bitti: Kazandın!" : `Maç bitti: ${winnerName} kazandı`;
        }
      } else {
        text = "Berabere! 🤝";
        emojiEl.textContent = "🤝";
        if (status) status.textContent = "Maç bitti: Berabere";
      }
    }

    textEl.textContent = text;
    scoreEl.textContent = `${usernames[0]} ${scores[0]} - ${scores[1]} ${usernames[1]}`;
    modal.style.display = "flex";

    const btn = document.getElementById("startBtn") as HTMLButtonElement;
    btn.disabled = false;

    document.getElementById("rematchBtn")?.addEventListener(
      "click",
      () => {
        modal.style.display = "none";
        btn.disabled = true;
        twoSocket?.emit("two:start");
        twoSocket?.emit("two:queue");
      },
      { once: true }
    );

    document.getElementById("exitBtn")?.addEventListener(
      "click",
      () => {
        safeLeave();
        btn.disabled = false;
        window.history.pushState({}, "", "/game");
        window.dispatchEvent(new PopStateEvent("popstate"));
      },
      { once: true }
    );
  }

  function applyHandlers(s: any) {
    s.off("two:queued").on("two:queued", () => {
      document.getElementById("status")!.textContent = "Rakip bekleniyor...";
    });

    s.off("two:matched").on("two:matched", ({ roomId: rid, players, usernames: names }: any) => {
      roomId = rid;
      usernames = names ?? ["Oyuncu 1", "Oyuncu 2"];

      const myId = s.id;
      playerIndex = players.indexOf(myId!);

      (document.getElementById("p1Name")!).textContent = usernames[0];
      (document.getElementById("p2Name")!).textContent = usernames[1];

      document.getElementById("status")!.textContent = "Rakip bulundu!";
    });

    s.off("two:countdown").on("two:countdown", ({ seconds }: any) => {
      const modal = document.getElementById("countdownModal") as HTMLElement;
      const numberEl = document.getElementById("countdownNumber")!;
      numberEl.textContent = String(seconds);
      modal.style.display = "flex";
    });

    s.off("two:start").on("two:start", () => {
      const modal = document.getElementById("countdownModal") as HTMLElement;
      modal.style.display = "none";

      document.getElementById("status")!.textContent =
        playerIndex === 0
          ? `Oyun başladı! Sen ${usernames[0]} (Sol)`
          : `Oyun başladı! Sen ${usernames[1]} (Sağ)`;

      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
    });

    s.off("two:state").on("two:state", ({ state }: any) => {
      game.updateFromServer(state);
      if (state?.finished) {
        disableInputsAndGame();
        const sc: [number, number] = [state.scores?.[0] ?? 0, state.scores?.[1] ?? 0];
        showWinnerModal(state.winner ?? null, sc, state.reason);
      }
    });

    s.off("two:finished").on("two:finished", ({ winner, scores, reason }: any) => {
      disableInputsAndGame();
      const sc: [number, number] = [scores?.[0] ?? 0, scores?.[1] ?? 0];
      showWinnerModal(winner ?? null, sc, reason);
    });

    s.off("two:left").on("two:left", () => {
      document.getElementById("status")!.textContent = "Rakip ayrıldı ❌";
      disableInputsAndGame();
      showWinnerModal(playerIndex, [0, 0], "left");
    });
  }

  document.getElementById("startBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("startBtn") as HTMLButtonElement;
    if (btn.disabled) return;

    btn.disabled = true;
    document.getElementById("status")!.textContent = "Bağlanılıyor...";

    try {
      const s = await ensureTwoSocket();
      applyHandlers(s);
      document.getElementById("status")!.textContent = "Maç aranıyor...";
      s.emit("two:start");
      s.emit("two:queue");
    } catch (e) {
      console.error("Two-player socket connect failed", e);
      document.getElementById("status")!.textContent = "Bağlantı başarısız";
      btn.disabled = false;
      return;
    }
  });

  document.getElementById("backBtn")?.addEventListener("click", () => {
    disableInputsAndGame();
    safeLeave();
    const btn = document.getElementById("startBtn") as HTMLButtonElement;
    btn.disabled = false;
    const status = document.getElementById("status");
    if (status) status.textContent = "Oyundan çıktın 🚪";
    window.history.pushState({}, "", "/game");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  window.addEventListener("pagehide", safeLeave);
  window.addEventListener("beforeunload", safeLeave);

  return game;
}
