import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";

// =========================================================
// Metafield Definitions
// =========================================================

export const metafieldDefinitionDao = {
  findById(id: number) {
    return db.select().from(s.metafieldDefinitions)
      .where(eq(s.metafieldDefinitions.id, id)).get() ?? null;
  },

  findByResource(resourceType: string) {
    return db.select().from(s.metafieldDefinitions)
      .where(eq(s.metafieldDefinitions.resourceType, resourceType))
      .orderBy(asc(s.metafieldDefinitions.namespace), asc(s.metafieldDefinitions.key))
      .all();
  },

  findByKey(resourceType: string, namespace: string, key: string) {
    return db.select().from(s.metafieldDefinitions)
      .where(and(
        eq(s.metafieldDefinitions.resourceType, resourceType),
        eq(s.metafieldDefinitions.namespace, namespace),
        eq(s.metafieldDefinitions.key, key),
      )).get() ?? null;
  },

  create(data: InferInsertModel<typeof s.metafieldDefinitions>) {
    return db.insert(s.metafieldDefinitions).values(data).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.metafieldDefinitions>>) {
    return db.update(s.metafieldDefinitions)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(s.metafieldDefinitions.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.metafieldDefinitions).where(eq(s.metafieldDefinitions.id, id)).run();
  },
};

// =========================================================
// Metafield Values
// =========================================================

export const metafieldValueDao = {
  findByResource(resourceType: string, resourceId: number) {
    return db.select({
      id: s.metafieldValues.id,
      definitionId: s.metafieldValues.definitionId,
      resourceType: s.metafieldValues.resourceType,
      resourceId: s.metafieldValues.resourceId,
      valueText: s.metafieldValues.valueText,
      valueInteger: s.metafieldValues.valueInteger,
      valueNumber: s.metafieldValues.valueNumber,
      valueBoolean: s.metafieldValues.valueBoolean,
      valueJson: s.metafieldValues.valueJson,
      namespace: s.metafieldDefinitions.namespace,
      key: s.metafieldDefinitions.key,
      name: s.metafieldDefinitions.name,
      valueType: s.metafieldDefinitions.valueType,
    })
    .from(s.metafieldValues)
    .innerJoin(s.metafieldDefinitions, eq(s.metafieldValues.definitionId, s.metafieldDefinitions.id))
    .where(and(
      eq(s.metafieldValues.resourceType, resourceType),
      eq(s.metafieldValues.resourceId, resourceId),
    ))
    .all();
  },

  upsert(data: {
    definitionId: number;
    resourceType: string;
    resourceId: number;
    valueText?: string | null;
    valueInteger?: number | null;
    valueNumber?: number | null;
    valueBoolean?: number | null;
    valueJson?: string | null;
  }) {
    const row = {
      definitionId: data.definitionId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      valueText: data.valueText ?? null,
      valueInteger: data.valueInteger ?? null,
      valueNumber: data.valueNumber ?? null,
      valueBoolean: data.valueBoolean ?? null,
      valueJson: data.valueJson ?? null,
    };
    return db.insert(s.metafieldValues)
      .values(row)
      .onConflictDoUpdate({
        target: [s.metafieldValues.definitionId, s.metafieldValues.resourceId],
        set: {
          valueText: row.valueText,
          valueInteger: row.valueInteger,
          valueNumber: row.valueNumber,
          valueBoolean: row.valueBoolean,
          valueJson: row.valueJson,
          updatedAt: new Date().toISOString(),
        },
      })
      .run();
  },

  delete(id: number) {
    return db.delete(s.metafieldValues).where(eq(s.metafieldValues.id, id)).run();
  },

  deleteByResource(resourceType: string, resourceId: number) {
    return db.delete(s.metafieldValues)
      .where(and(
        eq(s.metafieldValues.resourceType, resourceType),
        eq(s.metafieldValues.resourceId, resourceId),
      )).run();
  },
};
