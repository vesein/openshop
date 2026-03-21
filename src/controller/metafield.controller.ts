import { json, notFound, badRequest, parseBody } from "./_utils";
import { metafieldService } from "../service/metafield.service";

export const metafieldDefinitionController = {
  GET(req: Request) {
    const resourceType = req.params.resourceType ?? "";
    if (!resourceType) return badRequest("resourceType is required");
    return json(metafieldService.listDefinitions(resourceType));
  },

  async POST(req: Request) {
    const body = await parseBody(req) as Record<string, any>;
    if (!body?.resourceType) return badRequest("resourceType is required");
    if (!body?.namespace) return badRequest("namespace is required");
    if (!body?.key) return badRequest("key is required");
    if (!body?.name) return badRequest("name is required");
    if (!body?.valueType) return badRequest("valueType is required");
    return json(metafieldService.createDefinition({
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
    }), 201);
  },
};

export const metafieldDefinitionDetailController = {
  GET(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(metafieldService.getDefinitionById(id));
    } catch { return notFound(); }
  },

  async PATCH(req: Request) {
    const id = Number(req.params.id);
    const body = await parseBody(req) as Record<string, any>;
    if (!body) return badRequest("Invalid JSON body");
    try {
      return json(metafieldService.updateDefinition(id, body));
    } catch (e: any) { return badRequest(e.message); }
  },

  DELETE(req: Request) {
    const id = Number(req.params.id);
    try {
      return json(metafieldService.deleteDefinition(id));
    } catch { return notFound(); }
  },
};

export const metafieldValueController = {
  GET(req: Request) {
    const resourceType = req.params.resourceType ?? "";
    const resourceId = Number(req.params.resourceId);
    if (!resourceType) return badRequest("resourceType is required");
    return json(metafieldService.listValues(resourceType, resourceId));
  },

  async POST(req: Request) {
    const resourceType = req.params.resourceType ?? "";
    const resourceId = Number(req.params.resourceId);
    const body = await parseBody(req) as Record<string, any>;
    if (!resourceType) return badRequest("resourceType is required");
    if (!body?.definitionId) return badRequest("definitionId is required");
    return json(metafieldService.upsertValue({
      definitionId: Number(body.definitionId),
      resourceType,
      resourceId,
      valueText: body.valueText ? String(body.valueText) : undefined,
      valueInteger: body.valueInteger !== undefined ? Number(body.valueInteger) : undefined,
      valueNumber: body.valueNumber !== undefined ? Number(body.valueNumber) : undefined,
      valueBoolean: body.valueBoolean !== undefined ? Number(body.valueBoolean) : undefined,
      valueJson: body.valueJson ? String(body.valueJson) : undefined,
    }), 201);
  },
};

export const metafieldValueDetailController = {
  DELETE(req: Request) {
    const id = Number(req.params.id);
    return json(metafieldService.deleteValue(id));
  },
};