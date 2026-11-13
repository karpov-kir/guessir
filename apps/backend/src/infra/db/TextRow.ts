import { createTextLimits } from "@guessir/game";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("texts")
export class TextRow {
  @PrimaryGeneratedColumn()
  pk!: number;

  @Column({
    length: 20,
  })
  @Index({ unique: true })
  id!: string;

  @Column({
    length: createTextLimits.title,
  })
  title!: string;

  // The column names its type. TypeORM reads a `string | null` property as Object and then
  // refuses to start.
  @Column({
    type: "varchar",
    length: createTextLimits.description,
    nullable: true,
  })
  description!: string | null;

  @Column({
    length: createTextLimits.text,
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
