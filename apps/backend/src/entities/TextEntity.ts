import { createTextLimits } from "@guessir/game";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Text } from "./Text.js";

@Entity("texts")
export class TextEntity implements Text {
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

  @Column({
    length: createTextLimits.description,
    nullable: true,
  })
  description?: string;

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
