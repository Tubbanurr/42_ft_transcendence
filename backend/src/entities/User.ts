import 
{
  Entity, PrimaryGeneratedColumn, Column, Index,
  CreateDateColumn, UpdateDateColumn
} from "typeorm";

@Entity("users")
export class User 
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: "text" })
  username!: string;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  email?: string;

  @Column({ type: "text", nullable: true })
  password_hash?: string;

  @Index({ unique: true })
  @Column({ type: "text", nullable: true })
  google_id?: string; 

  @Column({ type: "text", nullable: true })
  display_name?: string;

  @Column({ type: "text", nullable: true })
  avatar_url?: string;

  @Column({ type: "boolean", default: false })
  is_online!: boolean;

  @Column({ type: "integer", default: 0 })
  wins!: number;

  @Column({ type: "integer", default: 0 })
  losses!: number;

  @Column({ type: "integer", default: 0 })
  games_played!: number;

  @CreateDateColumn({ type: "datetime" })
  created_at!: Date;

  @UpdateDateColumn({ type: "datetime" })
  updated_at!: Date;

  @Column({ type: "datetime", nullable: true })
  lastSeen!: Date;


  @Column({ type: "boolean", default: false })
  two_factor_enabled!: boolean;

  @Column({ type: "text", nullable: true })
  two_factor_secret!: string | null; 

  @Column({ type: "text", nullable: true })
  two_factor_temp_secret!: string | null;

  @Column({ type: "text", nullable: true })
  two_factor_recovery_codes!: string | null;

}
