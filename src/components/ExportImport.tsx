import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createExportBundle, importExportBundle } from "@/services/exportBundle";
import { logger } from "@/services/logger";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useExperimentStore } from "@/state/experimentSlice";
import { useTimeStore } from "@/state/timeSlice";

export function ExportImport() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const experimentState = useExperimentStore();
  const timeState = useTimeStore();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await createExportBundle(
        {
          activeProfileId: experimentState.activeProfileId,
          adapterName: experimentState.adapterName,
          toolsEnabled: experimentState.toolsEnabled,
          guardrails: experimentState.guardrails,
          privacyBannerText: experimentState.privacyBannerText,
        },
        {
          currentDate: timeState.currentDate,
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xiwei-experiment-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Experiment bundle downloaded successfully",
      });
    } catch (error) {
      logger.log("system", "error", "Export failed", { error });
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        await importExportBundle(file);
        toast({
          title: "Import Successful",
          description: "Experiment bundle imported successfully. Please refresh the page.",
        });
        // Optionally reload the page
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        logger.log("system", "error", "Import failed", { error });
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export / Import Experiment</CardTitle>
        <CardDescription>
          Create a complete backup of your experiment or restore from a previous export
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Export includes: database, logs, and configuration. This creates a complete snapshot
            that can be imported to reproduce the experiment state.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Bundle"}
          </Button>
          <Button onClick={handleImport} variant="outline" disabled={isImporting}>
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "Importing..." : "Import Bundle"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

