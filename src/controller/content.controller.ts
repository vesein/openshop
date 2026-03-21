import { json, notFound, badRequest, parseBody, parsePagination } from "./_utils";
import { pageService, menuService } from "../service/content.service";

export const pageController = {
  GET(req: Request) {
    const { page, pageSize } = parsePagination(req);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    return json(pageService.list({ status, search, page, pageSize }));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.title || !body?.slug) return badRequest("title and slug are required");
    return json(pageService.create(body as any), 201);
  },
};

export const pageDetailController = {
  GET(req: Request) {
    try {
      return json(pageService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(pageService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(pageService.delete(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const menuController = {
  GET() {
    return json(menuService.list());
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.name || !body?.handle) return badRequest("name and handle are required");
    return json(menuService.create(body as any), 201);
  },
};

export const menuDetailController = {
  GET(req: Request) {
    try {
      return json(menuService.getById(Number(req.params.id)));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(menuService.update(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(menuService.delete(Number(req.params.id)));
    } catch { return notFound(); }
  },
};

export const menuItemController = {
  GET(req: Request) {
    return json(menuService.listItems(Number(req.params.menuId)));
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body?.title || !body?.linkType || !body?.linkTarget) return badRequest("title, linkType, linkTarget required");
    return json(menuService.addItem({ ...body, menuId: Number(req.params.menuId) } as any), 201);
  },

  async PUT(req: Request) {
    const body = await parseBody(req);
    if (!body?.orderedIds) return badRequest("orderedIds array required");
    return json(menuService.reorderItems(Number(req.params.menuId), body.orderedIds as number[]));
  },
};

export const menuItemDetailController = {
  async PATCH(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(menuService.updateItem(Number(req.params.id), body as any));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    try {
      return json(menuService.removeItem(Number(req.params.id)));
    } catch { return notFound(); }
  },
};
