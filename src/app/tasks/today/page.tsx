import AppShell from "@/components/shell/AppShell";

export const metadata = {
  title: "Today's Tasks — PulseTask",
  description: "Tasks due today.",
};

export default function TodayTasksPage() {
  return <AppShell initialView="today" />;
}

