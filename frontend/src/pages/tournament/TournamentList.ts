import type { TournamentDTO } from "./tournament.types";

type Callbacks = {
  onJoin?: (id: number) => void;
  onStart?: (id: number) => void;
};

export class TournamentList {
  private container: HTMLElement;
  private tournaments: TournamentDTO[] = [];
  private cb: Callbacks;

  constructor(container: HTMLElement, cb: Callbacks = {}) {
    this.container = container;
    this.cb = cb;
  }

  public setTournaments(tournaments: TournamentDTO[]) {
    this.tournaments = tournaments;
    this.render();
  }

  private render() {
    if (this.tournaments.length === 0) {
      this.container.innerHTML = `
        <div class="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50/50">
          <p class="text-xl font-semibold text-gray-600 mb-2">Henüz aktif turnuva yok</p>
          <p class="text-gray-500">Yeni turnuva oluştur veya başkalarının turnuvalarına katıl</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.tournaments.map(t => {
      const playersText = `${(t.participants?.length ?? 0)}/${t.maxParticipants}`;
      const statusText =
        t.status === "pending" ? "Open" :
        t.status === "ongoing" ? "Started" :
        "Finished";

      return `
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-800">${t.name}</h3>
              ${t.description ? `<p class="text-gray-600 text-sm">${t.description}</p>` : ""}
            </div>
            <span class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-200">${statusText}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-700 mb-4">
            <span>Oyuncular: ${playersText}</span>
            <span>Kurucu: ${t.createdBy?.username ?? "-"}</span>
          </div>
          <div class="flex gap-3">
            <button data-join="${t.id}" class="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl font-semibold">Katıl</button>
            <button data-start="${t.id}" class="px-4 py-2 rounded-xl font-semibold border border-gray-300">Başlat</button>
          </div>
        </div>
      `;
    }).join("");

    this.container.querySelectorAll<HTMLButtonElement>("button[data-join]").forEach(btn => {
      btn.onclick = () => this.cb.onJoin?.(Number(btn.dataset.join));
    });
    this.container.querySelectorAll<HTMLButtonElement>("button[data-start]").forEach(btn => {
      btn.onclick = () => this.cb.onStart?.(Number(btn.dataset.start));
    });
  }
}
