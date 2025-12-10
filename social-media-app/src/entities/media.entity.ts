import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  type: string; // image, video, etc.

  @ManyToOne(() => UserEntity, { eager: true })
  uploader: UserEntity;

  @CreateDateColumn()
  uploadedAt: Date;
}
