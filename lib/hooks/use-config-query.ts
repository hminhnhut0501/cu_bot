"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Row } from "@/lib/cp-types";
import { isConfigBoolean } from "@/lib/cp-helpers";

export type UseConfigOptions = {
  botKey: string;
  scope?: string;
  enabled?: boolean;
};

/**
 * Hook to fetch and cache configuration rows for a given bot and scope.
 */
export function useConfigQuery({ botKey, scope = "all", enabled = true }: UseConfigOptions) {
  const queryKey = queryKeys.config.byScope(botKey, scope);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await apiClient.getTableRows("config", {
        botKey,
        groupId: scope !== "all" ? scope : undefined,
      });
      return result.rows || [];
    },
    enabled: Boolean(botKey) && enabled,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

/**
 * Optimistic mutation to toggle boolean config switches instantly.
 * Updates the TanStack Query cache before the server responds.
 * If the API call fails, rolls back automatically to the previous state.
 */
export function useOptimisticToggleConfig({ botKey, scope = "all" }: UseConfigOptions) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.config.byScope(botKey, scope);

  return useMutation({
    mutationFn: async ({ row, nextValue }: { row: Row; nextValue?: string | boolean }) => {
      if (!row.id) {
        throw new Error("Không thể cập nhật cấu hình thiếu ID.");
      }
      const calculatedNext =
        nextValue !== undefined
          ? String(nextValue)
          : String(row.value).toLowerCase() === "true"
            ? "false"
            : "true";

      const result = await apiClient.patchTableRow("config", row.id, {
        value: calculatedNext,
      });
      return result.row;
    },

    onMutate: async ({ row, nextValue }) => {
      // 1. Cancel in-flight queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot previous state for rollback
      const previousRows = queryClient.getQueryData<Row[]>(queryKey) || [];

      // 3. Determine next value
      const targetNext =
        nextValue !== undefined
          ? String(nextValue)
          : String(row.value).toLowerCase() === "true"
            ? "false"
            : "true";

      // 4. Optimistically update TanStack Query cache
      queryClient.setQueryData<Row[]>(queryKey, (current = []) =>
        current.map((item) => {
          if (item.id === row.id || (item.key && item.key === row.key)) {
            return {
              ...item,
              value: targetNext,
            };
          }
          return item;
        })
      );

      return { previousRows };
    },

    onError: (_err, _variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousRows) {
        queryClient.setQueryData(queryKey, context.previousRows);
      }
    },

    onSettled: () => {
      // Re-sync with database state
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Optimistic mutation to update any configuration value (e.g. from ConfigEditor).
 */
export function useOptimisticUpdateConfig({ botKey, scope = "all" }: UseConfigOptions) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.config.byScope(botKey, scope);

  return useMutation({
    mutationFn: async ({ rowId, values }: { rowId: string | number; values: Record<string, any> }) => {
      const result = await apiClient.patchTableRow("config", rowId, values);
      return result.row;
    },

    onMutate: async ({ rowId, values }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousRows = queryClient.getQueryData<Row[]>(queryKey) || [];

      queryClient.setQueryData<Row[]>(queryKey, (current = []) =>
        current.map((item) => {
          if (String(item.id) === String(rowId)) {
            return {
              ...item,
              ...values,
            };
          }
          return item;
        })
      );

      return { previousRows };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousRows) {
        queryClient.setQueryData(queryKey, context.previousRows);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
