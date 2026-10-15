import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  pgEnum,
  uuid,
  vector,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["ppd_admin", "school_admin", "teacher"]);
export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);
export const levelEnum = pgEnum("level", ["district", "state", "national", "international"]);
export const teacherRoleEnum = pgEnum("teacher_role", [
  "peserta",
  "jurulatih",
  "penganjur",
  "fasilitator",
  "hakim",
]);

// ─── Schools ─────────────────────────────────────────────────────────────────

export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  district: varchar("district", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  principalClerkId: text("principal_clerk_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Users (synced from Clerk via webhook) ───────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: roleEnum("role").notNull().default("teacher"),
  schoolId: uuid("school_id").references(() => schools.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Achievements ─────────────────────────────────────────────────────────────

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id),
  uploadedByUserId: uuid("uploaded_by_user_id")
    .notNull()
    .references(() => users.id),
  approvedByUserId: uuid("approved_by_user_id").references(() => users.id),

  // Raw data from teacher
  programName: varchar("program_name", { length: 500 }).notNull(),
  achievementDate: timestamp("achievement_date").notNull(),
  level: levelEnum("level").notNull(),
  teacherRole: teacherRoleEnum("teacher_role").notNull(),
  participantName: varchar("participant_name", { length: 255 }),
  position: varchar("position", { length: 100 }),

  // Certificate image
  certificateImageUrl: text("certificate_image_url"),
  certificateImageKey: text("certificate_image_key"),

  // AI-generated fields
  aiExtractedData: jsonb("ai_extracted_data"),
  aiDraftDescription: text("ai_draft_description"),
  aiSuggestedStandard: varchar("ai_suggested_standard", { length: 20 }),
  aiSuggestedScore: real("ai_suggested_score"),
  aiConfidence: real("ai_confidence"),

  // Tags (e.g. #NationalLevel, #Standard3.2)
  tags: text("tags").array(),

  // SK@S rubric fields
  skasStandard: varchar("skas_standard", { length: 20 }),
  skasScore: real("skas_score"),
  skasJustification: text("skas_justification"),

  // Workflow status
  status: statusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),

  // Timestamps
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Document Embeddings (for RAG on SK@S Manual) ────────────────────────────

export const documentEmbeddings = pgTable("document_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  metadata: jsonb("metadata"),
  source: varchar("source", { length: 255 }),
  chunkIndex: integer("chunk_index"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  achievements: many(achievements),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, { fields: [users.schoolId], references: [schools.id] }),
  uploadedAchievements: many(achievements, { relationName: "uploader" }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  school: one(schools, { fields: [achievements.schoolId], references: [schools.id] }),
  uploadedBy: one(users, {
    fields: [achievements.uploadedByUserId],
    references: [users.id],
    relationName: "uploader",
  }),
  approvedBy: one(users, {
    fields: [achievements.approvedByUserId],
    references: [users.id],
  }),
}));

// ─── Types ───────────────────────────────────────────────────────────────────

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
