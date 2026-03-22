import { json, badRequest, parseBody, handleServiceError } from "./_utils";
import { settingsService } from "../service/settings.service";

export const settingsController = {
  GET() {
    return json(settingsService.get());
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(settingsService.update(body as any));
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
