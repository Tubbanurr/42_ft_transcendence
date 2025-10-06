import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer" })
  userId!: number;

  @Column({ type: "text" })
  type!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "boolean", default: false })
  read!: boolean;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: Date;
}
