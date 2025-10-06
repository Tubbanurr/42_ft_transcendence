import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  name!: string;

  @Column("int", { default: 4 })
  maxParticipants!: number;

  @Column("text", { default: "pending" })
  status!: string;

  @Column("int", { default: 1 })
  currentRound!: number;

  @ManyToOne(() => User)
  createdBy!: User;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;

  @OneToMany(() => TournamentParticipant, (p) => p.tournament)
  participants!: TournamentParticipant[];

  @OneToMany(() => Match, (m) => m.tournament)
  matches!: Match[];
}

@Entity()
export class TournamentParticipant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (t) => t.participants)
  tournament!: Tournament;

  @ManyToOne(() => User)
  user!: User;

  @Column("boolean", { default: false })
  eliminated!: boolean;

  @CreateDateColumn({ type: "datetime" })
  joinedAt!: Date;
}

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Tournament, (t) => t.matches)
  tournament!: Tournament;

  @ManyToOne(() => TournamentParticipant)
  player1!: TournamentParticipant;

  @ManyToOne(() => TournamentParticipant)
  player2!: TournamentParticipant;

  @ManyToOne(() => TournamentParticipant, { nullable: true })
  winner?: TournamentParticipant;

  @Column("int")
  round!: number;

  @Column("int", { nullable: true })
  player1Score?: number;

  @Column("int", { nullable: true })
  player2Score?: number;

  // pending,ongoing,finished durumu
  @Column("text", { default: "pending" })
  status!: string;

  @Column("text", { nullable: true })
  roomCode?: string;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}
