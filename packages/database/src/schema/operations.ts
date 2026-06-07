import {
  pgTable,
  pgEnum,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./platform";

export const commandStatusEnum = pgEnum("command_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const commandChannelEnum = pgEnum("command_channel", [
  "chat",
  "voice",
  "api",
  "scheduled",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const agentStatusEnum = pgEnum("agent_status", [
  "idle",
  "running",
  "paused",
  "error",
  "offline",
]);

export const agentTypeEnum = pgEnum("agent_type", [
  "orchestrator",
  "executor",
  "monitor",
  "analyzer",
]);

export const commands = pgTable(
  "commands",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    text: text("text").notNull(),
    channel: commandChannelEnum("channel").notNull().default("chat"),
    status: commandStatusEnum("status").notNull().default("pending"),
    engineTarget: varchar("engine_target", { length: 100 }),
    response: text("response"),
    processingMs: integer("processing_ms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("commands_tenant_idx").on(t.tenantId),
    statusIdx: index("commands_status_idx").on(t.status),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
    commandId: varchar("command_id", { length: 36 }).references(
      () => commands.id,
    ),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("pending"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    engineId: varchar("engine_id", { length: 100 }),
    agentId: varchar("agent_id", { length: 36 }),
    progress: integer("progress").notNull().default(0),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    metadata: text("metadata"),
  },
  (t) => ({
    tenantIdx: index("tasks_tenant_idx").on(t.tenantId),
    statusIdx: index("tasks_status_idx").on(t.status),
    engineIdx: index("tasks_engine_idx").on(t.engineId),
  }),
);

export const agents = pgTable(
  "agents",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: agentTypeEnum("type").notNull().default("executor"),
    status: agentStatusEnum("status").notNull().default("idle"),
    engineId: varchar("engine_id", { length: 100 }),
    tasksCompleted: integer("tasks_completed").notNull().default(0),
    tasksActive: integer("tasks_active").notNull().default(0),
    lastHeartbeat: timestamp("last_heartbeat"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    config: text("config"),
  },
  (t) => ({
    tenantIdx: index("agents_tenant_idx").on(t.tenantId),
    engineIdx: index("agents_engine_idx").on(t.engineId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id),
    userId: varchar("user_id", { length: 36 }),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    before: text("before"),
    after: text("after"),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("audit_logs_tenant_idx").on(t.tenantId),
    entityIdx: index("audit_logs_entity_idx").on(t.entityType, t.entityId),
  }),
);
