/**
 * 与后端一致：金额字段为最小货币单位（如分）；展示时按 ISO 货币代码格式化。
 * 默认货币为 USD（与 `shop_settings.currency_code` 库默认一致）；实际展示应传入店铺或订单的 `currencyCode`。
 */
export function formatMoneyMinorUnits(amountMinor: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(amountMinor / 100);
}
