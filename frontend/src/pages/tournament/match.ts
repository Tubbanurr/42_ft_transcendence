import { createMatchPage, initMatchGame } from "./MatchPage";
import { initGlobalSocket } from "@/socket/client";

export class MatchPage {
  private element: HTMLElement;

  constructor(params: { id: string; roomCode: string; players?: any; playerIndex: 0 | 1 }) {
    this.element = document.createElement("div");
    this.element.innerHTML = createMatchPage(params.roomCode, params.players);

    const token = localStorage.getItem("token") || "";
    initGlobalSocket(token);

    initMatchGame(params.roomCode, params.playerIndex);
  }

  public render(): HTMLElement {
    return this.element;
  }
}
