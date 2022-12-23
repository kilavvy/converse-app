import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";

import { type Message } from "./message";

@Entity()
export class Conversation {
  @PrimaryColumn("text")
  topic!: string;

  @Column("text")
  peerAddress!: string;

  @Column("text", { nullable: true })
  lensHandle?: string;

  @Column("int")
  createdAt!: number;

  @Column("text", { nullable: true })
  contextConversationId?: string;

  @Column("text", { nullable: true })
  contextMetadata?: string;

  @OneToMany("Message", (message: Message) => message.conversation)
  messages?: Message[];
}
