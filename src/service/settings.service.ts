import { shopSettingsDao } from "../db/dao";
import type { InferInsertModel } from "drizzle-orm";
import { shopSettings } from "../db/schema";

type ShopSettingsInsert = InferInsertModel<typeof shopSettings>;

export const settingsService = {
  get() {
    const settings = shopSettingsDao.get();
    if (!settings) throw new Error("Shop settings not found");
    return settings;
  },

  update(data: Partial<ShopSettingsInsert>) {
    return shopSettingsDao.update(data);
  },
};
