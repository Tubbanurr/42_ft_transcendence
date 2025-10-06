export type TournamentStatus = "pending" | "ongoing" | "finished";

export type TournamentParticipantDTO = {
  id: number;
  user: { id: number; username?: string };
};



export type MatchDTO = {
	id: number;
	round: number;
	status: "pending" | "ongoing" | "finished";
	roomCode?: string;
	player1?: TournamentParticipantDTO;
	player2?: TournamentParticipantDTO;
	winner?: TournamentParticipantDTO;
	player1Score?: number;
	player2Score?: number;
  };

  
export type TournamentDTO = {
  id: number;
  name: string;
  maxParticipants: number;
  status: TournamentStatus;
  description?: string;
  createdAt: string;
  createdBy?: { id: number; username?: string };
  participants?: TournamentParticipantDTO[];
  matches?: MatchDTO[];
};
