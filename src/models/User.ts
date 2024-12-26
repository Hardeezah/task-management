// src/models/User.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
import { Task } from './Task';
  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ unique: true })
    email!: string;
  
    @Column({ unique: true, nullable: true })
    username!: string;
  
    @Column({ nullable: true }) // Allow password to be null for Google-authenticated users
    password?: string;

    @Column({ nullable: true, unique: true }) // Make googleId optional
    googleId?: string;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    @OneToMany(() => Task, (task) => task.createdBy)
    tasks?: Task[];
  }
  