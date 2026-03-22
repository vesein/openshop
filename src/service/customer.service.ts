import { customerDao, addressDao, metafieldValueDao } from "../db/dao";
import { db } from "../db/index";
import type { InferInsertModel } from "drizzle-orm";
import { customers, customerAddresses } from "../db/schema";
import { assertAddressCustomerIdImmutable } from "./address-rules";

type CustomerInsert = InferInsertModel<typeof customers>;
type AddressInsert = InferInsertModel<typeof customerAddresses>;

export const customerService = {
  list(opts: { search?: string; page?: number; pageSize?: number }) {
    const items = customerDao.list(opts);
    const total = customerDao.count({ search: opts.search });
    return { items, total, page: opts.page ?? 1, pageSize: opts.pageSize ?? 20 };
  },

  getById(id: number) {
    const customer = customerDao.findById(id);
    if (!customer) throw new Error("Customer not found");
    return customer;
  },

  create(data: CustomerInsert) {
    const email = data.email.trim();
    const dup = customerDao.findByEmail(email);
    if (dup) throw new Error("email already in use");
    return customerDao.create({ ...data, email });
  },

  update(id: number, data: Partial<CustomerInsert>) {
    const patch = { ...data };
    if (patch.email !== undefined) {
      patch.email = patch.email.trim();
      const dup = customerDao.findByEmail(patch.email);
      if (dup && dup.id !== id) throw new Error("email already in use");
    }
    return customerDao.update(id, patch);
  },

  delete(id: number) {
    return db.transaction(() => {
      metafieldValueDao.deleteByResource("customer", id);
      return customerDao.delete(id);
    });
  },

  // addresses
  listAddresses(customerId: number) {
    return addressDao.findByCustomerId(customerId);
  },

  createAddress(data: AddressInsert) {
    return addressDao.create(data);
  },

  updateAddress(id: number, data: Partial<AddressInsert>) {
    const prev = addressDao.findById(id);
    if (!prev) throw new Error("Address not found");
    assertAddressCustomerIdImmutable(prev.customerId, data);
    return addressDao.update(id, data);
  },

  deleteAddress(id: number) {
    return addressDao.delete(id);
  },
};
