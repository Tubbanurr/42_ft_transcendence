import type { TournamentDTO } from "./tournament.types";
import { TournamentList } from "./TournamentList";
import { TournamentModal } from "./TournamentModal";
import {
  registerTournamentEvents,
  listTournaments,
  createTournament,
  joinTournament,
  startTournament,
  joinMatch,
  sendMatchInput,
  leaveMatch,
} from "../../socket/tournament";
import { authService } from "../../services/auth";
import { fetchMyMatches } from "../../services/matches";


export class TournamentPage {
  private element: HTMLElement;
  private tournaments: TournamentDTO[] = [];
  private list: TournamentList;
  private modal: TournamentModal;

  constructor() {
    this.element = document.createElement("div");
    this.setup();

    const listContainer = this.element.querySelector('#activeTournaments') as HTMLElement;
    const modalElement = this.element.querySelector('#createTournamentModal') as HTMLElement;

    this.list = new TournamentList(listContainer, {
      onJoin: (id) => this.onJoin(id),
      onStart: (id) => this.onStart(id),
    });

    this.modal = new TournamentModal(modalElement, (payload) => this.onCreate(payload));

    this.attachEventListeners();
    this.initData();
  }

  private attachEventListeners() {
    const createBtn = this.element.querySelector('#createTournamentBtn') as HTMLButtonElement;

    createBtn?.addEventListener('click', () => this.modal.show());
  }

  private setup() {
  this.element.className = "min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50";
  this.element.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Başlık ve Turnuva Oluştur -->
      <div class="mb-10">
        <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl">
          <div class="text-center mb-8">
            <h1 class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">Turnuvalar</h1>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto">Turnuva oluştur veya katıl!</p>
          </div>
          <div class="flex flex-wrap justify-center gap-4">
            <button id="createTournamentBtn" class="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-xl font-semibold">
              Turnuva Oluştur
            </button>
          </div>
        </div>
      </div>

      <!-- Aktif Turnuvalar -->
      <div id="activeTournamentsBlock" class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Aktif Turnuva Odaları</h2>
        <div id="activeTournaments" class="space-y-6"></div>
      </div>

      <!-- Geçmiş Maçlarım -->
      <div id="pastMatchesBlock" class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-xl">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Geçmiş Maçlarım</h2>
        <div id="pastMatches" class="space-y-4 text-gray-700"></div>
      </div>
    </div>

    <!-- Modal -->
    <div id="createTournamentModal" class="modal-overlay">
      <div class="modal-box">
        <h3 class="text-2xl font-bold mb-4">Yeni Turnuva Oluştur</h3>
        <form id="createTournamentForm" class="space-y-4">
          <div>
            <label for="tournamentName" class="block text-sm font-medium mb-2">Turnuva Adı</label>
            <input type="text" id="tournamentName" class="input" required placeholder="Bing Bong Cup">
          </div>
          <div>
            <label for="maxPlayers" class="block text-sm font-medium mb-2">Oyuncu Sayısı</label>
            <select id="maxPlayers" class="input">
              <option value="4">4 Oyuncu</option>
            </select>
          </div>
          <div class="flex justify-end gap-4 pt-4">
            <button type="button" id="cancelCreateBtn" class="px-4 py-2 border rounded-lg">İptal</button>
            <button type="submit" class="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg">Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  `;
}


  private async initData() {
    const token = localStorage.getItem("token") || "";
    if (!(window as any).socket) {
      const { initGlobalSocket } = await import("@/socket/client");
      initGlobalSocket(token);
    }

    let keyDownHandler: (e: KeyboardEvent) => void;
    let keyUpHandler: (e: KeyboardEvent) => void;

    registerTournamentEvents({
      onCreated: (t) => this.upsert(t),
      onUpdated: (t) => this.upsert(t),
      onStarted: (t) => this.upsert(t),
      onError: (msg) => console.error("tournament socket error:", msg),

      onMatchState: ({ state }) => {
        const canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
        if (canvas) {
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.beginPath();
          ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = "white";
          ctx.fill();

          ctx.fillStyle = "cyan";
          ctx.fillRect(20, state.paddles[0].y, 10, 80);
          ctx.fillStyle = "magenta";
          ctx.fillRect(canvas.width - 30, state.paddles[1].y, 10, 80);

          const s1 = document.getElementById("player1Score");
          const s2 = document.getElementById("player2Score");
          if (s1) s1.textContent = String(state.scores[0]);
          if (s2) s2.textContent = String(state.scores[1]);
        }
      },

      onMatchCountdown: ({ seconds }) => {
        const modal = document.getElementById("countdownModal");
        const num = document.getElementById("countdownNumber");
        if (modal && num) {
          modal.style.display = "flex";
          num.textContent = String(seconds);
        }
      },

      onMatchStart: () => {
        const modal = document.getElementById("countdownModal");
        if (modal) modal.style.display = "none";
      },

      onMatchFinished: ({ roomCode, winnerName, usernames, scores, hasNextMatch }) => {
        const modal = document.getElementById("winnerModal");
        const text = document.getElementById("winnerText");
        const score = document.getElementById("winnerScore");
        const exitBtn = document.getElementById("exitBtn");

        if (modal && text && score) {
          modal.style.display = "flex";

          let actualWinner = null;
          if (scores && scores.length === 2) {
            if (scores[0] > scores[1]) {
              actualWinner = usernames ? usernames[0] : "Oyuncu 1";
            } else if (scores[1] > scores[0]) {
              actualWinner = usernames ? usernames[1] : "Oyuncu 2";
            }
          }

          const finalWinner = winnerName || actualWinner;

          if (finalWinner) {
            text.textContent = `Kazanan: ${finalWinner}`;
          } else {
            text.textContent = "Berabere";
          }

          if (usernames && usernames.length === 2) {
            score.textContent = `${usernames[0]} ${scores[0]} - ${scores[1]} ${usernames[1]}`;
          } else {
            score.textContent = `${scores[0]} - ${scores[1]}`;
          }
        }

        if (hasNextMatch) {
          if (exitBtn) exitBtn.style.display = "none";
          if (text) text.textContent = "Sonraki maç bekleniyor...";
        } else {
          if (exitBtn) {
            exitBtn.style.display = "inline-block";
            exitBtn.addEventListener(
              "click",
              () => {
                leaveMatch(roomCode);
                (window as any).app.navigate("/home");
              },
              { once: true }
            );
          }
        }
      },


      onMatchAssigned: async ({ tournamentId, roomCode, players }) => {
        const res = await joinMatch(roomCode);
        const playerIndex = res.playerIndex;

        if (keyDownHandler) document.removeEventListener("keydown", keyDownHandler);
        if (keyUpHandler) document.removeEventListener("keyup", keyUpHandler);

        keyDownHandler = (e: KeyboardEvent) => {
          if (["w"].includes(e.key)) sendMatchInput(roomCode, playerIndex, -1);
          if (["s"].includes(e.key)) sendMatchInput(roomCode, playerIndex, 1);
        };
        keyUpHandler = (e: KeyboardEvent) => {
          if (["w", "s"].includes(e.key)) sendMatchInput(roomCode, playerIndex, 0);
        };

        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);

        (window as any).app.navigate(`/tournament/${tournamentId}/match/${roomCode}`, {
          id: String(tournamentId),
          roomCode,
          players,
          playerIndex,
        });
      },
    });

    await this.reload();
    await this.loadPastMatches();
  }

  private async reload() {
    try {
      this.tournaments = await listTournaments();
      this.renderList();
    } catch (e: any) {
      console.error(e?.message || e);
    }
  }

  private upsert(t: TournamentDTO) {
    const idx = this.tournaments.findIndex((x) => x.id === t.id);
    if (idx === -1) this.tournaments.unshift(t);
    else this.tournaments[idx] = t;
    this.renderList();
  }

  private async onCreate(payload: { name: string; maxPlayers: number; description?: string }) {
    try {
      const created = await createTournament(payload);
      this.upsert(created);
    } catch (e: any) {
      alert(e?.message ?? "Oluşturma başarısız");
    }
  }

  private async onJoin(id: number) {
    try {
      const t = await joinTournament(id);
      this.upsert(t);
    } catch (e: any) {
      alert(e?.message ?? "Katılım başarısız");
    }
  }

  private async onStart(id: number) {
    try {
      const t = await startTournament(id);
      this.upsert(t);

      if (t.matches && t.matches.length > 0) {
        const user = authService.getUser();
        const myId = user?.id;
        const myMatch = t.matches.find(
          (m) => m.player1?.user?.id === myId || m.player2?.user?.id === myId
        );
        if (myMatch) {
          const players = {
            p1: myMatch.player1?.user?.username ?? "Oyuncu 1",
            p2: myMatch.player2?.user?.username ?? "Oyuncu 2",
          };
          (window as any).app.navigate(`/tournament/${t.id}/match/${myMatch.roomCode}`, {
            id: String(t.id),
            roomCode: myMatch.roomCode!,
            players,
          });
        }
      }
    } catch (e: any) {
      alert(e?.message ?? "Başlatma başarısız");
    }
  }

  private renderList() {
    this.list.setTournaments(this.tournaments);
  }

  public render(): HTMLElement { return this.element; }
  public destroy() { this.element.remove(); }

  private async loadPastMatches() {
    try {
      const { matches } = await fetchMyMatches();
      const container = this.element.querySelector("#pastMatches") as HTMLElement;
      if (!container) return;

      if (matches.length === 0) {
        container.innerHTML = `<p class="text-gray-500">Henüz geçmiş maçınız yok.</p>`;
        return;
      }

      container.innerHTML = matches.map((m: any) => `
        <div class="p-4 border rounded-lg bg-white shadow-sm">
          <div class="font-semibold">${m.tournament?.name ?? "Turnuva"} - #${m.id}</div>
          <div>${m.player1} vs ${m.player2}</div>
          <div class="text-sm text-gray-600">Skor: ${m.score}</div>
          <div class="text-sm ${m.winner === "Berabere" ? "text-yellow-600" : "text-green-600"}">
            Kazanan: ${m.winner}
          </div>
        </div>
      `).join("");
    } catch (e: any) {
      console.error("Geçmiş maçlar yüklenemedi:", e);
    }
  }

}


