import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useExperimentStore } from "@/state/experimentSlice";
import { useTimeStore } from "@/state/timeSlice";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Settings,
  Building2,
  Calendar,
  Monitor,
  Play,
  Pause,
} from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const privacyBannerText = useExperimentStore((state) => state.privacyBannerText);
  const adapterType = useExperimentStore((state) => state.adapterType);
  const backendHealth = useExperimentStore((state) => state.backendHealth);
  const checkBackendHealth = useExperimentStore((state) => state.checkBackendHealth);
  const currentDate = useTimeStore((state) => state.currentDate);
  const isPaused = useTimeStore((state) => state.isPaused);
  const pause = useTimeStore((state) => state.pause);
  const resume = useTimeStore((state) => state.resume);

  // Periodic health check for HTTP adapter
  useEffect(() => {
    if (adapterType === "http") {
      const interval = setInterval(() => {
        checkBackendHealth();
      }, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [adapterType, checkBackendHealth]);

  const menuItems = [
    { path: "/dashboard", label: "Monitoring Dashboard", icon: LayoutDashboard },
    { path: "/admin", label: "Admin Controls", icon: Settings },
    { path: "/company", label: "Company Controls", icon: Building2 },
    { path: "/scenario", label: "Scenario Controls", icon: Calendar },
    { path: "/monitor", label: "Model Monitoring Station", icon: Monitor },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Left Menu */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">MENU</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            <div>Current Date:</div>
            <div className="font-mono">{formatDateDisplay(currentDate)}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => (isPaused ? resume() : pause())}
          >
            {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Backend Status */}
        <div className="border-b bg-card px-6 py-2 flex items-center justify-between">
          {privacyBannerText && (
            <div className="text-sm text-muted-foreground">{privacyBannerText}</div>
          )}
          {adapterType === "http" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Backend:</span>
              <span
                className={`font-mono ${
                  backendHealth === true
                    ? "text-green-600"
                    : backendHealth === false
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {backendHealth === true
                  ? "● Online"
                  : backendHealth === false
                  ? "● Offline"
                  : "● Checking"}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

