import {
  pgTable,
  pgEnum,
  varchar,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "deleted",
]);

export const tenantTierEnum = pgEnum("tenant_tier", [
  "starter",
  "growth",
  "enterprise",
]);

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "manager",
  "agent",
  "viewer",
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "pending_invite",
]);

export const tenants = pgTable(
  "tenants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    status: tenantStatusEnum("status").notNull().default("active"),
    tier: tenantTierEnum("tier").notNull().default("starter"),
    dbSchema: varchar("db_schema", { length: 100 }).notNull(),
    ownerId: varchar("owner_id", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
    schemaIdx: uniqueIndex("tenants_db_schema_idx").on(t.dbSchema),
  }),
);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("agent"),
    status: userStatusEnum("status").notNull().default("pending_invite"),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: varchar("tenant_id", { length: 36 })
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
