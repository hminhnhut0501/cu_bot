"use client";

import type { ComponentType, SVGProps } from "react";

export type BulkRow = Record<string, string | number | boolean | null>;

export type BulkDefaults = {
  bot_key: string;
  pool: string;
  weight: number;
  action: string;
  match: string;
  reason: string;
  risk: string;
  risk_level: string;
  status: string;
  source: string;
  enabled: boolean;
};

export type ToastState = {
  type: "success" | "error" | "info";
  message: string;
};

export type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
