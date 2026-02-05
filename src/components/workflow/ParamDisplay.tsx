"use client";

import type { ParamConfig } from "@/types";

interface ParamDisplayProps {
  params: ParamConfig[];
  values: Record<string, unknown>;
  compareValues?: Record<string, unknown>;
}

export function ParamDisplay({ params, values, compareValues }: ParamDisplayProps) {
  const getParamKey = (param: ParamConfig) => `${param.nodeId}.${param.paramPath}`;

  const getValue = (param: ParamConfig, vals: Record<string, unknown>) => {
    const key = getParamKey(param);
    return vals[key] ?? param.defaultValue;
  };

  const formatValue = (value: unknown, param: ParamConfig) => {
    if (typeof value === "number") {
      if (param.paramPath === "inputs.seed") {
        return String(value).slice(0, 8) + "...";
      }
      return Number.isInteger(value) ? String(value) : value.toFixed(2);
    }
    return String(value);
  };

  const isDifferent = (param: ParamConfig) => {
    if (!compareValues) return false;
    const val1 = getValue(param, values);
    const val2 = getValue(param, compareValues);
    return val1 !== val2;
  };

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      {params.map((param) => {
        const value = getValue(param, values);
        const compareValue = compareValues ? getValue(param, compareValues) : null;
        const different = isDifferent(param);

        return (
          <div
            key={getParamKey(param)}
            className={`flex justify-between py-1 px-2 rounded ${
              different ? "bg-yellow-100 dark:bg-yellow-900/30" : ""
            }`}
          >
            <span className="text-muted-foreground truncate mr-2">
              {param.displayNameKo}
            </span>
            <div className="flex items-center gap-2 font-mono">
              <span className={different ? "font-semibold" : ""}>
                {formatValue(value, param)}
              </span>
              {compareValues && different && (
                <span className="text-muted-foreground">
                  ← {formatValue(compareValue, param)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
