import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  vector,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chat = pgTable("chat", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chat.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  error: boolean("error").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  chats: many(chat),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, { fields: [chat.userId], references: [user.id] }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, { fields: [message.chatId], references: [chat.id] }),
}));

export const document = pgTable("document", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => message.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  totalPages: integer("total_pages").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentChunk = pgTable("document_chunk", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => document.id, { onDelete: "cascade" }),
  chatId: text("chat_id")
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  index: integer("index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const embedding = pgTable("embedding", {
  id: text("id").primaryKey(),
  chunkId: text("chunk_id")
    .notNull()
    .unique()
    .references(() => documentChunk.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  vector: vector("vector", { dimensions: 3072 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentRelations = relations(document, ({ one, many }) => ({
  chat: one(chat, { fields: [document.chatId], references: [chat.id] }),
  message: one(message, { fields: [document.messageId], references: [message.id] }),
  chunks: many(documentChunk),
}));

export const documentChunkRelations = relations(documentChunk, ({ one }) => ({
  document: one(document, { fields: [documentChunk.documentId], references: [document.id] }),
  chat: one(chat, { fields: [documentChunk.chatId], references: [chat.id] }),
  embedding: one(embedding, { fields: [documentChunk.id], references: [embedding.chunkId] }),
}));

export const embeddingRelations = relations(embedding, ({ one }) => ({
  chunk: one(documentChunk, { fields: [embedding.chunkId], references: [documentChunk.id] }),
}));
