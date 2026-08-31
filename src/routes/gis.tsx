import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getAllRecords } from "@/lib/records";

const GisMap = lazy(() => import("@/components/gis-map"));

export const Route = createFileRoute("/gis")({
  head: () => ({
    meta: [
      { title: "GIS Map — Land Record AI" },
      {
        name: "description",
        content:
          "Land parcels plotted on an OpenStreetMap view with status-coded markers for verified, under review, high risk and rejected records.",
      },
      { property: "og:title", content: "GIS Map — Land Record AI" },
      {
        property: "og:description",
        content: "Geospatial view of digitized land records around Wagholi, Pune (demo data).",
      },
    ],
  }),
  component: GisPage,
});

const LEGEND = [
  { label: "Verified / Approved", color: "#15803d" },
  { label: "Under Review", color: "#b45309" },
  { label: "High Risk (60+)", color: "#b91c1c" },
  { label: "Rejected", color: "#b91c1c" },
];

function GisPage() {
  const { data: records = [] } = useQuery({ queryKey: ["records"], queryFn: getAllRecords });

  return (
    <AppShell
      title="GIS Visualization"
      subtitle="Sample/demo coordinates around Wagholi, Haveli taluka, Pune — not authoritative cadastral geometry."
    >
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-4 text-xs">
            {LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
          </div>
          <ClientOnly
            fallback={
              <div className="flex h-[70vh] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="flex h-[70vh] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
                  Loading map…
                </div>
              }
            >
              <GisMap records={records} />
            </Suspense>
          </ClientOnly>
        </CardContent>
      </Card>
    </AppShell>
  );
}
