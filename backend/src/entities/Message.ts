import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  senderId!: number;

  @Column({ type: "integer" })
  receiverId!: number;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "boolean", default: false })
  read!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}
