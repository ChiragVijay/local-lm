import { useState, useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sidebar } from "../components/sidebar";
import { seedDatabase } from "../lib/seed-data";
import { cn } from "../lib/utils";
import { InferenceProvider } from "../contexts/InferenceContext";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarCollapseToggle = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleSidebarOpen = () => {
    setSidebarOpen(true);
  };

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Initialization timeout")), 10000);
        });

        await Promise.race([seedDatabase(), timeoutPromise]);

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        if (mounted) {
          setIsInitialized(true);
          setInitError((error as Error).message);
        }
      }
    };

    initApp();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    console.warn("App initialized with error:", initError);
  }

  return (
    <InferenceProvider>
      <div className="group flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onToggleCollapse={handleSidebarCollapseToggle}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <header className={cn("flex items-center gap-3 h-14 px-4 lg:hidden", "border-b border-border bg-background")}>
            <button
              onClick={handleSidebarOpen}
              className="w-9 h-9 -ml-1 rounded-md flex items-center justify-center hover:bg-muted text-foreground transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display text-sm font-bold text-foreground tracking-tight">LocalLM</span>
          </header>

          <Outlet />
        </main>
      </div>
    </InferenceProvider>
  );
}
