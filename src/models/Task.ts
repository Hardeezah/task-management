import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'timestamp' })
  dueDate!: Date;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({ default: 'medium' })
  priority!: 'low' | 'medium' | 'high';

  // Many-to-Many relationship to allow multiple users to be assigned
  @ManyToMany(() => User, { eager: true })
  @JoinTable()
  assignedTo!: User[];

  // Task creator (Many-to-One relationship)
  @ManyToOne(() => User, (user) => user.tasks, { eager: true })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
