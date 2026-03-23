import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import { db } from "../index";
import * as s from "../schema";
import type { InferInsertModel } from "drizzle-orm";
import { formatTimestamp } from "./utils";

export const customerDao = {
  findById(id: number) {
    const customer = db.select().from(s.customers)
      .where(eq(s.customers.id, id)).get();
    if (!customer) return null;
    const addresses = db.select().from(s.customerAddresses)
      .where(eq(s.customerAddresses.customerId, id))
      .orderBy(desc(s.customerAddresses.isDefaultShipping)).all();
    return { ...customer, addresses };
  },

  findByEmail(email: string) {
    return db.select().from(s.customers)
      .where(eq(s.customers.email, email)).get() ?? null;
  },

  list(opts: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search, page = 1, pageSize = 20 } = opts;
    const conditions = [];
    if (search) {
      conditions.push(or(
        like(s.customers.email, `%${search}%`),
        like(s.customers.firstName, `%${search}%`),
        like(s.customers.lastName, `%${search}%`),
      ));
    }

    return db.select().from(s.customers)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(s.customers.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize)
      .all();
  },

  count(opts: { search?: string } = {}) {
    const conditions = [];
    if (opts.search) {
      conditions.push(or(
        like(s.customers.email, `%${opts.search}%`),
        like(s.customers.firstName, `%${opts.search}%`),
        like(s.customers.lastName, `%${opts.search}%`),
      ));
    }
    return db.select({ count: sql<number>`count(*)` })
      .from(s.customers)
      .where(conditions.length ? and(...conditions) : undefined)
      .get()!.count;
  },

  create(data: InferInsertModel<typeof s.customers>) {
    const now = formatTimestamp();
    return db.insert(s.customers).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.customers>>) {
    return db.update(s.customers)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.customers.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.customers)
      .where(eq(s.customers.id, id))
      .returning().get();
  },
};

export const addressDao = {
  findById(id: number) {
    return db.select().from(s.customerAddresses).where(eq(s.customerAddresses.id, id)).get() ?? null;
  },

  findByCustomerId(customerId: number) {
    return db.select().from(s.customerAddresses)
      .where(eq(s.customerAddresses.customerId, customerId))
      .orderBy(desc(s.customerAddresses.isDefaultShipping))
      .all();
  },

  create(data: InferInsertModel<typeof s.customerAddresses>) {
    const now = formatTimestamp();
    return db.insert(s.customerAddresses).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning().get();
  },

  update(id: number, data: Partial<InferInsertModel<typeof s.customerAddresses>>) {
    return db.update(s.customerAddresses)
      .set({ ...data, updatedAt: formatTimestamp() })
      .where(eq(s.customerAddresses.id, id))
      .returning().get();
  },

  delete(id: number) {
    return db.delete(s.customerAddresses)
      .where(eq(s.customerAddresses.id, id))
      .returning().get();
  },
};
