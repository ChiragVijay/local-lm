import { createFileRoute } from "@tanstack/react-router";
import { SettingsPanel } from "../components/settings";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsPanel />;
}
