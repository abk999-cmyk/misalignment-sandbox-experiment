import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useExperimentStore } from "@/state/experimentSlice";
import { useTimeStore } from "@/state/timeSlice";
import { seedDatabase, checkSeedStatus } from "@/fixtures";
import { logger } from "@/services/logger";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CommandPalette } from "@/components/CommandPalette";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./Layout";
import Dashboard from "@/routes/Dashboard";
import AdminControls from "@/routes/AdminControls";
import CompanyControls from "@/routes/CompanyControls";
import ScenarioControls from "@/routes/ScenarioControls";
import ModelMonitoring from "@/routes/ModelMonitoring";

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const initializeExperiment = useExperimentStore((state) => state.initialize);
  const initializeTime = useTimeStore((state) => state.initialize);
  const checkBackendHealth = useExperimentStore((state) => state.checkBackendHealth);

  useEffect(() => {
    async function init() {
      try {
        // Check if database needs seeding
        const seedStatus = await checkSeedStatus();
        if (seedStatus.employees === 0 || seedStatus.finances === 0) {
          logger.log("system", "info", "Database empty, seeding...");
          await seedDatabase();
        }

        // Initialize stores
        await initializeExperiment();
        await initializeTime();

        // Check backend health if using HTTP adapter
        await checkBackendHealth();

        logger.log("system", "info", "App initialized successfully");
      } catch (error) {
        logger.log("system", "error", "App initialization failed", { error });
      } finally {
        setIsInitializing(false);
      }
    }

    init();
  }, [initializeExperiment, initializeTime]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Xi Wei Pharma Experiment...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <CommandPalette />
        <Toaster />
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminControls />} />
            <Route path="/company" element={<CompanyControls />} />
            <Route path="/scenario" element={<ScenarioControls />} />
            <Route path="/monitor" element={<ModelMonitoring />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

