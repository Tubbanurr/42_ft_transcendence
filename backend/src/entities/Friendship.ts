import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("friendships")
@Index(["userId", "friendId"], { unique: true })
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  userId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "integer" })
  friendId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "friendId" })
  friend!: User;

  @Column({ type: "text", default: "pending" })
  status!: "pending" | "accepted" | "blocked";

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;
}
