import { metafieldDefinitionDao, metafieldValueDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { metafieldDefinitions, metafieldValues } from "../db/schema";
import {
  assertMetafieldResourceExists,
  assertMetafieldValueMatchesDefinitionType,
} from "./metafield-rules";

type MetafieldDefinitionInsert = InferInsertModel<typeof metafieldDefinitions>;

export const metafieldService = {
  // definitions
  listDefinitions(resourceType: string) {
    return metafieldDefinitionDao.findByResource(resourceType);
  },

  getDefinitionById(id: number) {
    const def = metafieldDefinitionDao.findById(id);
    if (!def) throw new Error("Metafield definition not found");
    return def;
  },

  getDefinitionByKey(resourceType: string, namespace: string, key: string) {
    return metafieldDefinitionDao.findByKey(resourceType, namespace, key);
  },

  createDefinition(data: MetafieldDefinitionInsert) {
    return metafieldDefinitionDao.create(data);
  },

  updateDefinition(id: number, data: Partial<MetafieldDefinitionInsert>) {
    return metafieldDefinitionDao.update(id, data);
  },

  deleteDefinition(id: number) {
    return metafieldDefinitionDao.delete(id);
  },

  // values
  listValues(resourceType: string, resourceId: number) {
    return metafieldValueDao.findByResource(resourceType, resourceId);
  },

  upsertValue(data: {
    definitionId: number;
    resourceType: string;
    resourceId: number;
    valueText?: string | null;
    valueInteger?: number | null;
    valueNumber?: number | null;
    valueBoolean?: number | null;
    valueJson?: string | null;
  }) {
    const def = metafieldDefinitionDao.findById(data.definitionId);
    if (!def) throw new Error("Metafield definition not found");
    if (def.resourceType !== data.resourceType) {
      throw new Error("metafield definition resource_type does not match value resource_type");
    }
    assertMetafieldResourceExists(data.resourceType, data.resourceId);
    assertMetafieldValueMatchesDefinitionType(def.valueType, data);
    return metafieldValueDao.upsert(data);
  },

  deleteValue(id: number) {
    return metafieldValueDao.delete(id);
  },

  deleteValuesByResource(resourceType: string, resourceId: number) {
    return metafieldValueDao.deleteByResource(resourceType, resourceId);
  },
};