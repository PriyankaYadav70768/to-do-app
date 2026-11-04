import AppShell from "@/components/shell/AppShell";

export const metadata = {
  title: "Upcoming Tasks — PulseTask",
  description: "Tasks scheduled for upcoming dates.",
};

export default function UpcomingTasksPage() {
  return <AppShell initialView="upcoming" />;
}

