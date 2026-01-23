"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ParamConfig } from "@/types";
import { groupParamsByCategory, CATEGORY_DISPLAY_NAMES } from "@/lib/workflow-parser";

interface ParamEditorProps {
  params: ParamConfig[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function ParamEditor({ params, values, onChange }: ParamEditorProps) {
  const groupedParams = groupParamsByCategory(params);

  const getParamKey = (param: ParamConfig) => `${param.nodeId}.${param.paramPath}`;

  const getValue = (param: ParamConfig) => {
    const key = getParamKey(param);
    return values[key] ?? param.defaultValue;
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedParams).map(([category, categoryParams]) => {
        if (categoryParams.length === 0) return null;

        return (
          <div key={category} className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {CATEGORY_DISPLAY_NAMES[category] || category}
            </h3>
            <div className="grid gap-4">
              {categoryParams.map((param) => {
                const key = getParamKey(param);
                const value = getValue(param);

                return (
                  <div key={key} className="space-y-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {param.displayNameKo}
                        <span className="text-muted-foreground ml-1 font-normal">
                          ({param.displayName})
                        </span>
                      </Label>
                      {param.type === "number" && (
                        <span className="text-sm font-mono text-muted-foreground">
                          {typeof value === "number" ? value.toFixed(2) : value}
                        </span>
                      )}
                    </div>
                    {param.description && (
                      <p className="text-xs text-muted-foreground">
                        {param.description}
                      </p>
                    )}

                    {param.type === "number" && param.paramPath !== "inputs.seed" && (
                      <div className="flex items-center gap-4">
                        <Slider
                          id={key}
                          min={param.min || 0}
                          max={param.max || 100}
                          step={param.step || 1}
                          value={[Number(value)]}
                          onValueChange={([v]) => onChange(key, v)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={value as number}
                          onChange={(e) => onChange(key, parseFloat(e.target.value))}
                          className="w-20"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                        />
                      </div>
                    )}

                    {param.type === "number" && param.paramPath === "inputs.seed" && (
                      <div className="flex items-center gap-2">
                        <Input
                          id={key}
                          type="number"
                          value={value as number}
                          onChange={(e) => onChange(key, parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => onChange(key, Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))}
                          className="px-3 py-2 text-sm bg-secondary rounded-md hover:bg-secondary/80"
                        >
                          랜덤
                        </button>
                      </div>
                    )}

                    {param.type === "select" && param.options && (
                      <Select
                        value={value as string}
                        onValueChange={(v) => onChange(key, v)}
                      >
                        <SelectTrigger id={key}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
