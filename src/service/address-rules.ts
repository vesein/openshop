/** 与 trg_customer_addresses_validate_customer_id_before_update 一致 */
export function assertAddressCustomerIdImmutable(
  prevCustomerId: number,
  patch: { customerId?: number | null },
) {
  if (patch.customerId != null && patch.customerId !== prevCustomerId) {
    throw new Error(
      "customer address customer_id is immutable; recreate the address for another customer",
    );
  }
}
