import AppShell from "@/components/shell/AppShell";

export const metadata = {
  title: "Completed Tasks — PulseTask",
  description: "History of completed tasks.",
};

export default function CompletedTasksPage() {
  return <AppShell initialView="completed" />;
}

