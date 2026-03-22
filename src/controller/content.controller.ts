import { json, notFound, noContent, badRequest, parseBody, parsePagination, parsePositiveIntParam, handleServiceError } from "./_utils";
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
    if (!body) return badRequest("Invalid JSON body");
    if (!body.title || !body.slug) return badRequest("title and slug are required");
    try {
      return json(pageService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const pageDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(pageService.getById(id));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(pageService.update(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      const row = pageService.delete(id);
      if (!row) return notFound("Page not found");
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const menuController = {
  GET() {
    return json(menuService.list());
  },

  async POST(req: Request) {
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.name || !body.handle) return badRequest("name and handle are required");
    try {
      return json(menuService.create(body as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const menuDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(menuService.getById(id));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(menuService.update(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      menuService.delete(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const menuItemController = {
  GET(req: Request) {
    const menuId = parsePositiveIntParam(req.params.menuId);
    if (menuId === null) return badRequest("invalid id");
    return json(menuService.listItems(menuId));
  },

  async POST(req: Request) {
    const menuId = parsePositiveIntParam(req.params.menuId);
    if (menuId === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    if (!body.title || !body.linkType || !body.linkTarget) {
      return badRequest("title, linkType, linkTarget required");
    }
    try {
      return json(menuService.addItem({ ...body, menuId } as any), 201);
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PUT(req: Request) {
    const menuId = parsePositiveIntParam(req.params.menuId);
    if (menuId === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, unknown> | null;
    if (!body) return badRequest("Invalid JSON body");
    if (!Array.isArray(body.orderedIds)) return badRequest("orderedIds array required");
    const ids = body.orderedIds.map((x: unknown) => Number(x));
    if (ids.some((x) => !Number.isInteger(x) || x <= 0)) {
      return badRequest("orderedIds must be positive integers");
    }
    try {
      return json(menuService.reorderItems(menuId, ids));
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const menuItemDetailController = {
  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req);
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(menuService.updateItem(id, body as any));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      menuService.removeItem(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
