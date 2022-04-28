import { TextInterface } from '@guessir/shared';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('texts')
export class Text implements TextInterface {
  @PrimaryGeneratedColumn()
  @Exclude()
  pk!: number;

  @Column({
    length: 20,
  })
  @Index({ unique: true })
  id!: string;

  @Column({
    length: 500,
  })
  title!: string;

  @Column({
    length: 4000,
    nullable: true,
  })
  description?: string;

  @Column({
    length: 4000,
  })
  text!: string;

  @Column()
  allowShowingFirstLetters!: boolean;

  @Column()
  allowShowingText!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
