import { customerDao, addressDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { customers, customerAddresses } from "../db/schema";

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
    return customerDao.create(data);
  },

  update(id: number, data: Partial<CustomerInsert>) {
    return customerDao.update(id, data);
  },

  delete(id: number) {
    return customerDao.delete(id);
  },

  // addresses
  listAddresses(customerId: number) {
    return addressDao.findByCustomerId(customerId);
  },

  createAddress(data: AddressInsert) {
    return addressDao.create(data);
  },

  updateAddress(id: number, data: Partial<AddressInsert>) {
    return addressDao.update(id, data);
  },

  deleteAddress(id: number) {
    return addressDao.delete(id);
  },
};
