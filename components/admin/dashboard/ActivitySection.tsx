// app/admin/components/ActivitySection.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import SummaryItem from "./SummaryItem";

type SummaryItemType = { label: string; value: string | number };

type Props = {
  activities: string[];
  summary: SummaryItemType[];
};

export default function ActivitySection({ activities, summary }: Props) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {/* Recent Activity */}
      <Card className="border border-border bg-card/60 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity, i) => (
                <li
                  key={i}
                  className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
                >
                  {activity}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* System Summary */}
      <Card className="border border-border bg-card/60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            System Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No summary data yet.
            </p>
          ) : (
            summary.map((item, i) => (
              <SummaryItem
                key={i}
                label={item.label}
                value={String(item.value)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
