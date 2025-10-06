export class TournamentModal {
	private modal: HTMLElement;
	private onCreate: (payload: { name: string; maxPlayers: number; description?: string }) => void;

	constructor(modal: HTMLElement, onCreate: (payload: { name: string; maxPlayers: number; description?: string }) => void) {
	  this.modal = modal;
	  this.onCreate = onCreate;
	  this.attachEvents();
	}

	private attachEvents() {
	  const cancelBtn = this.modal.querySelector('#cancelCreateBtn') as HTMLButtonElement;
	  const form = this.modal.querySelector('#createTournamentForm') as HTMLFormElement;

	  cancelBtn?.addEventListener('click', () => this.hide());

	  form?.addEventListener('submit', (e) => {
		e.preventDefault();
		const name = (form.querySelector('#tournamentName') as HTMLInputElement).value.trim();
		const maxPlayers = Number((form.querySelector('#maxPlayers') as HTMLSelectElement).value);

		if (!name || ![4].includes(maxPlayers)) return;

		this.onCreate({ name, maxPlayers});
		this.hide();
		form.reset();
	  });
	}

	public show()  { this.modal.classList.add("active"); }
	public hide()  { this.modal.classList.remove("active"); }
  }
