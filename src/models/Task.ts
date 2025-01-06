import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
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

  // Optional parentTask property to handle nullability
  @ManyToOne(() => Task, (task) => task.subtasks, { nullable: true })
  parentTask?: Task | null;

  @OneToMany(() => Task, (task) => task.parentTask, { cascade: true })
  subtasks!: Task[];

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

  // Tags (Optional, add if needed)
  @ManyToMany(() => Tag, (tag) => tag.tasks, { eager: true })
  @JoinTable()
  tags?: Tag[];

  // Validate subtask deadline before saving
  @BeforeInsert()
  @BeforeUpdate()
  validateSubtaskDeadline() {
    if (this.parentTask && this.dueDate > this.parentTask.dueDate) {
      throw new Error('Subtask deadline cannot exceed the parent task deadline.');
    }
  }
}

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToMany(() => Task, (task) => task.tags)
  tasks!: Task[];
}
