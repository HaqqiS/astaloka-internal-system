"use client";

import { IconRefresh } from "@tabler/icons-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { PageLayout } from "~/components/layout";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Skeleton } from "~/components/ui/skeleton";
import { useEmergencyAnalytics } from "~/hooks";

const chartConfig = {
  deposit: {
    label: "Deposit",
    color: "var(--chart-1)",
  },
  withdrawal: {
    label: "Withdrawal",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function EmergencyClient() {
  const { data, isLoading, isError, error, refetch } = useEmergencyAnalytics();

  if (isLoading) {
    return (
      <PageLayout title="Dana Darurat">
        <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-3 md:p-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full rounded-lg" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Dana Darurat">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm font-medium text-destructive">
            Gagal memuat analitik dana darurat
          </p>
          <p className="text-xs text-muted-foreground">
            {error?.message ?? "Terjadi kesalahan saat mengambil data."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <IconRefresh className="mr-1.5 size-3.5" />
            Coba Lagi
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!data?.projects.length) {
    return (
      <PageLayout title="Dana Darurat">
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Belum ada proyek.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dana Darurat">
      <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-3 md:p-6">
        {data.projects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col overflow-hidden transition-colors hover:border-border/80"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="truncate font-bold text-lg">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    Saldo Saat Ini:
                    <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      Rp {Number(project.balance).toLocaleString("id-ID")}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 pb-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-xs"
                    style={{ backgroundColor: "var(--chart-1)" }}
                    aria-hidden="true"
                  />
                  Deposit
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-xs"
                    style={{ backgroundColor: "var(--chart-2)" }}
                    aria-hidden="true"
                  />
                  Withdrawal
                </span>
              </div>
              <div className="h-[180px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart accessibilityLayer data={project.monthlyActivity}>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      width={44}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v: number) =>
                        v >= 1_000_000
                          ? `${(v / 1_000_000).toFixed(1)}jt`
                          : v >= 1_000
                            ? `${Math.round(v / 1_000)}rb`
                            : String(v)
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="deposit"
                      fill="var(--color-deposit)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="withdrawal"
                      fill="var(--color-withdrawal)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
            <CardFooter className="mt-auto pt-2">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/projects/${project.slug}/emergency`}>
                  Lihat Detail
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
