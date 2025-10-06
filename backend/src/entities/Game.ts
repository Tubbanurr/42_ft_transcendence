import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type GameStatus = "waiting" | "running" | "finished";
export type GameType = "two_player" | "bot" | "tournament";

@Entity({ name: "games" })
export class Game {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 12 })
  roomCode!: string;

  @Column({ type: "int", nullable: true })
  hostId!: number | null;

  @Column({ type: "int", nullable: true })
  guestId!: number | null;

  @Column({ type: "varchar", length: 16, default: "waiting" })
  status!: GameStatus;

  @Column({ type: "varchar", length: 16, default: "two_player" })
  gameType!: GameType;

  @Column({ type: "int", default: 0 })
  hostScore!: number;

  @Column({ type: "int", default: 0 })
  guestScore!: number;

  @Column({ type: "int", nullable: true })
  winnerId!: number | null;

  @Column({ type: "datetime", nullable: true })
  startedAt!: Date | null;

  @Column({ type: "datetime", nullable: true })
  finishedAt!: Date | null;

  @Column({ type: "int", nullable: true })
  duration!: number | null; // saniye olarak

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
