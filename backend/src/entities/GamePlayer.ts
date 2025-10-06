import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Game } from "./Game";

export type PlayerRole = "host" | "guest";

@Entity({ name: "game_players" })
@Index(["gameId", "userId"], { unique: true })
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int" })
  gameId!: number;

  @ManyToOne(() => Game)
  @JoinColumn({ name: "gameId" })
  game!: Game;

  @Column({ type: "int" })
  userId!: number;

  @Column({ type: "varchar", length: 8 })
  role!: PlayerRole;

  @Column({ type: "boolean", default: false })
  connected!: boolean;

  @Column({ type: "datetime", nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
