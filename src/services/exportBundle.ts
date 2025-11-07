import JSZip from "jszip";
import { exportDatabase, importDatabase } from "./persistence";
import { logger } from "./logger";
// Note: We can't use hooks here, so we'll pass state as parameters

export interface ExportBundle {
  version: string;
  exportedAt: string;
  metadata: {
    currentDate: string;
    experimentProfile: string;
    adapterName: string;
  };
  database: unknown;
  logs: string;
  config: {
    toolsEnabled: unknown;
    guardrails: unknown;
    privacyBannerText: string;
  };
}

export async function createExportBundle(
  experimentState?: {
    activeProfileId: string | null;
    adapterName: string;
    toolsEnabled: unknown;
    guardrails: unknown;
    privacyBannerText: string;
  },
  timeState?: {
    currentDate: string;
  }
): Promise<Blob> {
  const zip = new JSZip();

  // Export database
  const dbBlob = await exportDatabase();
  const dbData = await dbBlob.text();
  zip.file("database.json", dbData);

  // Export logs
  const logsNDJSON = logger.exportNDJSON();
  zip.file("logs.ndjson", logsNDJSON);

  // Export config (if state provided)
  if (experimentState && timeState) {
    const config = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      metadata: {
        currentDate: timeState.currentDate,
        experimentProfile: experimentState.activeProfileId || "",
        adapterName: experimentState.adapterName,
      },
      config: {
        toolsEnabled: experimentState.toolsEnabled,
        guardrails: experimentState.guardrails,
        privacyBannerText: experimentState.privacyBannerText,
      },
    };
    zip.file("config.json", JSON.stringify(config, null, 2));
  }

  // Create manifest
  const manifest = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    files: experimentState && timeState 
      ? ["database.json", "logs.ndjson", "config.json"]
      : ["database.json", "logs.ndjson"],
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate zip
  const blob = await zip.generateAsync({ type: "blob" });
  logger.log("system", "info", "Export bundle created", {
    size: blob.size,
    files: manifest.files,
  });

  return blob;
}

export async function importExportBundle(blob: Blob): Promise<void> {
  const zip = await JSZip.loadAsync(blob);
  
  // Read manifest
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) {
    throw new Error("Manifest not found in bundle");
  }
  JSON.parse(await manifestFile.async("string")); // Validate manifest exists

  // Import database
  const dbFile = zip.file("database.json");
  if (dbFile) {
    const dbData = await dbFile.async("blob");
    await importDatabase(dbData);
  }

  // Import config (optional - could restore experiment state)
  const configFile = zip.file("config.json");
  if (configFile) {
    const config = JSON.parse(await configFile.async("string"));
    // Restore experiment state if needed
    logger.log("system", "info", "Config imported", { config });
  }

  logger.log("system", "info", "Export bundle imported successfully");
}

