import { json, badRequest, parseBody } from "./_utils";
import { settingsService } from "../service/settings.service";

export const settingsController = {
  GET() {
    try {
      return json(settingsService.get());
    } catch (e: any) { return json({ error: e.message }, 500); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(settingsService.update(body as any));
    } catch (e: any) { return badRequest(e.message); }
  },
};
