import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("sessions")
export class Session {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "text" })
  token!: string;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @Column({ type: "datetime", nullable: true })
  expires_at!: Date | null;
}
