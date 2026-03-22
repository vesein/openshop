import { json, noContent, badRequest, parseBody, parsePositiveIntParam, handleServiceError } from "./_utils";
import { metafieldService } from "../service/metafield.service";

export const metafieldDefinitionController = {
  GET(req: Request) {
    const url = new URL(req.url);
    const resourceType = url.searchParams.get("resourceType") ?? "";
    if (!resourceType) return badRequest("resourceType query param is required");
    return json(metafieldService.listDefinitions(resourceType));
  },

  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.resourceType) return badRequest("resourceType is required");
    if (!body?.namespace) return badRequest("namespace is required");
    if (!body?.key) return badRequest("key is required");
    if (!body?.name) return badRequest("name is required");
    if (!body?.valueType) return badRequest("valueType is required");
    try {
      return json(
        metafieldService.createDefinition({
          resourceType: String(body.resourceType),
          namespace: String(body.namespace),
          key: String(body.key),
          name: String(body.name),
          valueType: String(body.valueType),
          description: body.description ? String(body.description) : undefined,
          validationsJson: body.validationsJson ? String(body.validationsJson) : undefined,
          defaultValueJson: body.defaultValueJson ? String(body.defaultValueJson) : undefined,
          visibleInAdmin: body.visibleInAdmin !== undefined ? Number(body.visibleInAdmin) : undefined,
          visibleInStorefront: body.visibleInStorefront !== undefined ? Number(body.visibleInStorefront) : undefined,
          pinnedPosition: body.pinnedPosition !== undefined ? Number(body.pinnedPosition) : undefined,
        }),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const metafieldDefinitionDetailController = {
  GET(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      return json(metafieldService.getDefinitionById(id));
    } catch (e) {
      return handleServiceError(e);
    }
  },

  async PATCH(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(metafieldService.updateDefinition(id, body));
    } catch (e: any) {
      return handleServiceError(e);
    }
  },

  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      metafieldService.deleteDefinition(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const metafieldValueController = {
  GET(req: Request) {
    const resourceType = req.params.resourceType ?? "";
    const resourceId = parsePositiveIntParam(req.params.resourceId);
    if (!resourceType) return badRequest("resourceType is required");
    if (resourceId === null) return badRequest("invalid resourceId");
    return json(metafieldService.listValues(resourceType, resourceId));
  },

  async POST(req: Request) {
    const resourceType = req.params.resourceType ?? "";
    const resourceId = parsePositiveIntParam(req.params.resourceId);
    if (!resourceType) return badRequest("resourceType is required");
    if (resourceId === null) return badRequest("invalid resourceId");
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    if (!body?.definitionId) return badRequest("definitionId is required");
    const definitionId = parsePositiveIntParam(String(body.definitionId));
    if (definitionId === null) return badRequest("invalid definitionId");
    const hasAny =
      body.valueText !== undefined ||
      body.valueInteger !== undefined ||
      body.valueNumber !== undefined ||
      body.valueBoolean !== undefined ||
      body.valueJson !== undefined;
    if (!hasAny) {
      return badRequest(
        "at least one of valueText, valueInteger, valueNumber, valueBoolean, valueJson is required",
      );
    }
    try {
      return json(
        metafieldService.upsertValue({
          definitionId,
          resourceType,
          resourceId,
          valueText: body.valueText !== undefined ? (body.valueText == null ? null : String(body.valueText)) : undefined,
          valueInteger: body.valueInteger !== undefined ? Number(body.valueInteger) : undefined,
          valueNumber: body.valueNumber !== undefined ? Number(body.valueNumber) : undefined,
          valueBoolean: body.valueBoolean !== undefined ? Number(body.valueBoolean) : undefined,
          valueJson: body.valueJson !== undefined ? String(body.valueJson) : undefined,
        }),
        201,
      );
    } catch (e) {
      return handleServiceError(e);
    }
  },
};

export const metafieldValueDetailController = {
  DELETE(req: Request) {
    const id = parsePositiveIntParam(req.params.id);
    if (id === null) return badRequest("invalid id");
    try {
      metafieldService.deleteValue(id);
      return noContent();
    } catch (e) {
      return handleServiceError(e);
    }
  },
};
