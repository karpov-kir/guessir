import { Text } from '@guessir/shared/dist/Text';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('texts')
export class TextEntity implements Text {
  @PrimaryGeneratedColumn()
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
