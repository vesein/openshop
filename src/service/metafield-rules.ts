import { eq } from "drizzle-orm";
import { db } from "../db/index";
import * as s from "../db/schema";

/** 与 trg_metafield_values_validate_resource_* 一致 */
export function assertMetafieldResourceExists(resourceType: string, resourceId: number) {
  if (resourceType === "shop") {
    if (resourceId !== 1) {
      throw new Error("shop metafield resource_id must be 1");
    }
    return;
  }

  const exists = (() => {
    switch (resourceType) {
      case "product":
        return db.select().from(s.products).where(eq(s.products.id, resourceId)).get() != null;
      case "variant":
        return db.select().from(s.productVariants).where(eq(s.productVariants.id, resourceId)).get() != null;
      case "collection":
        return db.select().from(s.collections).where(eq(s.collections.id, resourceId)).get() != null;
      case "customer":
        return db.select().from(s.customers).where(eq(s.customers.id, resourceId)).get() != null;
      case "order":
        return db.select().from(s.orders).where(eq(s.orders.id, resourceId)).get() != null;
      case "page":
        return db.select().from(s.pages).where(eq(s.pages.id, resourceId)).get() != null;
      case "promotion":
        return db.select().from(s.promotions).where(eq(s.promotions.id, resourceId)).get() != null;
      default:
        return false;
    }
  })();

  if (!exists) {
    throw new Error(`metafield ${resourceType} resource does not exist`);
  }
}

/** 与 trg_metafield_values_validate_type_* 一致（NULL 非法，0/false 合法） */
export function assertMetafieldValueMatchesDefinitionType(
  valueType: string,
  row: {
    valueText?: string | null;
    valueInteger?: number | null;
    valueNumber?: number | null;
    valueBoolean?: number | null;
    valueJson?: string | null;
  },
) {
  const err = (t: string) => new Error(`metafield value must match definition type ${t}`);
  switch (valueType) {
    case "text":
      if (row.valueText == null) throw err("text");
      break;
    case "integer":
      if (row.valueInteger == null) throw err("integer");
      break;
    case "number":
      if (row.valueNumber == null) throw err("number");
      break;
    case "boolean":
      if (row.valueBoolean == null) throw err("boolean");
      break;
    case "json":
      if (row.valueJson == null) throw err("json");
      break;
    default:
      break;
  }
}
