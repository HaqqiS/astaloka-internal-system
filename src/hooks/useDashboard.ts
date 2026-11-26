import { api } from "~/trpc/react";

/**
 * Dashboard Hooks
 *
 * Consolidated hooks for all role-based dashboards
 */

export function useExecutiveOverview() {
  return api.dashboard.getExecutiveOverview.useQuery();
}

export function useExecutiveTrends() {
  return api.dashboard.getExecutiveTrends.useQuery();
}

export function useAdminOverview() {
  return api.dashboard.getAdminOverview.useQuery();
}

export function useFinanceRecentTransactions(
  limit?: number,
  status?: "UNREVIEWED" | "REVIEWED",
) {
  return api.emergency.getRecentTransactions.useQuery({ limit, status });
}

export function useUserOverview() {
  return api.dashboard.getUserOverview.useQuery();
}
