import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { mockMetafieldDefs } from "../mock/data";
import { useState } from "react";

interface MetafieldValue {
  definitionId: number;
  value: string;
}

export function MetafieldCard({ resourceType, values: initialValues }: {
  resourceType: string;
  values?: MetafieldValue[];
}) {
  const defs = mockMetafieldDefs.filter((d) => d.resourceType === resourceType);
  const [values, setValues] = useState<MetafieldValue[]>(
    initialValues ?? defs.map((d) => ({ definitionId: d.id, value: "" })),
  );

  if (defs.length === 0) return null;

  const grouped = new Map<string, typeof defs>();
  for (const d of defs) {
    const arr = grouped.get(d.namespace) ?? [];
    arr.push(d);
    grouped.set(d.namespace, arr);
  }

  const getValue = (defId: number) => values.find((v) => v.definitionId === defId)?.value ?? "";
  const setValue = (defId: number, val: string) =>
    setValues((prev) => {
      const existing = prev.find((v) => v.definitionId === defId);
      if (existing) return prev.map((v) => (v.definitionId === defId ? { ...v, value: val } : v));
      return [...prev, { definitionId: defId, value: val }];
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metafields</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...grouped.entries()].map(([ns, fields]) => (
          <div key={ns}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {ns}
            </p>
            <div className="space-y-3">
              {fields.map((def) => (
                <div key={def.id} className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <Label>
                      {def.key} <Badge variant="outline" className="ml-1 text-[10px]">{def.valueType}</Badge>
                    </Label>
                    {def.valueType === "boolean" ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={getValue(def.id) === "true"}
                          onChange={(e) => setValue(def.id, String(e.target.checked))}
                          className="size-4"
                        />
                        <span className="text-sm">{def.name}</span>
                      </label>
                    ) : def.valueType === "json" ? (
                      <Textarea
                        value={getValue(def.id)}
                        onChange={(e) => setValue(def.id, e.target.value)}
                        placeholder="{}"
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={def.valueType === "integer" || def.valueType === "number" ? "number" : "text"}
                        step={def.valueType === "number" ? "any" : def.valueType === "integer" ? "1" : undefined}
                        value={getValue(def.id)}
                        onChange={(e) => setValue(def.id, e.target.value)}
                        placeholder={def.name}
                      />
                    )}
                  </div>
                  <Button variant="ghost" size="icon-sm" className="mt-6 text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-1" /> Add metafield
        </Button>
      </CardContent>
    </Card>
  );
}
