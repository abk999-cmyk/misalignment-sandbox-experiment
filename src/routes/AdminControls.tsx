import { useEffect } from "react";
import { useExperimentStore } from "@/state/experimentSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logger } from "@/services/logger";
import { LogEntry } from "@/types/core";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import { ExportImport } from "@/components/ExportImport";

export default function AdminControls() {
  const {
    profiles,
    activeProfileId,
    adapterName,
    adapterType,
    backendHealth,
    toolsEnabled,
    guardrails,
    privacyBannerText,
    setActiveProfile,
    updateProfile,
    setPrivacyBannerText,
    setToolsEnabled,
    setGuardrails,
    setAdapterType,
    checkBackendHealth,
  } = useExperimentStore();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<{ channel?: string; level?: string }>({});

  useEffect(() => {
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [...prev, entry].slice(-1000)); // Keep last 1000
    });

    // Load initial logs
    const initialLogs = logger.getLogs();
    setLogs(initialLogs);

    return unsubscribe;
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  const handleExportLogs = () => {
    const ndjson = logger.exportNDJSON();
    const blob = new Blob([ndjson], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xiwei-logs-${new Date().toISOString()}.ndjson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter.channel && log.channel !== logFilter.channel) return false;
    if (logFilter.level && log.level !== logFilter.level) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Controls</h1>
        <p className="text-muted-foreground">Configure experiment settings and monitor system</p>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Experiment Config</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Settings</TabsTrigger>
          <TabsTrigger value="export">Export/Import</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Profiles</CardTitle>
              <CardDescription>Manage system prompts and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={activeProfileId || ""}
                onValueChange={(value) => setActiveProfile(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeProfile && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <textarea
                      className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
                      value={activeProfile.systemPrompt}
                      onChange={(e) =>
                        updateProfile(activeProfile.id, { systemPrompt: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tools Enabled</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notepad">Notepad</Label>
                        <Switch
                          id="notepad"
                          checked={toolsEnabled.notepad}
                          onCheckedChange={(checked) =>
                            setToolsEnabled({ notepad: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="python">Python</Label>
                        <Switch
                          id="python"
                          checked={toolsEnabled.python}
                          onCheckedChange={(checked) =>
                            setToolsEnabled({ python: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="docs">Docs</Label>
                        <Switch
                          id="docs"
                          checked={toolsEnabled.docs}
                          onCheckedChange={(checked) =>
                            setToolsEnabled({ docs: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Guardrails</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowCot">Allow Chain of Thought</Label>
                        <Switch
                          id="allowCot"
                          checked={guardrails.allowCot}
                          onCheckedChange={(checked) =>
                            setGuardrails({ allowCot: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowSelfModify">Allow Self Modification</Label>
                        <Switch
                          id="allowSelfModify"
                          checked={guardrails.allowSelfModify}
                          onCheckedChange={(checked) =>
                            setGuardrails({ allowSelfModify: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Model Adapter</Label>
                    <Select
                      value={adapterType}
                      onValueChange={(value) => setAdapterType(value as "stub" | "http")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stub">Stub Adapter (Testing)</SelectItem>
                        <SelectItem value="http">HTTP Adapter (gpt-4o)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground mt-2">
                      {adapterName}
                      {adapterType === "http" && (
                        <span className={`ml-2 ${backendHealth === true ? "text-green-600" : backendHealth === false ? "text-red-600" : "text-yellow-600"}`}>
                          {backendHealth === true ? "✓ Backend Online" : backendHealth === false ? "✗ Backend Offline" : "? Checking..."}
                        </span>
                      )}
                    </div>
                    {adapterType === "http" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkBackendHealth}
                        className="mt-2"
                      >
                        Check Backend Health
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs</CardTitle>
                  <CardDescription>Monitor application and model activity</CardDescription>
                </div>
                <Button onClick={handleExportLogs} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export NDJSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select
                    value={logFilter.channel || "all"}
                    onValueChange={(value) =>
                      setLogFilter({ ...logFilter, channel: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="app">App</SelectItem>
                      <SelectItem value="model">Model</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={logFilter.level || "all"}
                    onValueChange={(value) =>
                      setLogFilter({ ...logFilter, level: value === "all" ? undefined : value })
                    }
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[600px] border rounded-md p-4">
                  <div className="space-y-1 font-mono text-xs">
                    {filteredLogs.length === 0 ? (
                      <div className="text-muted-foreground">No logs</div>
                    ) : (
                      filteredLogs.slice(-500).map((log) => (
                        <div
                          key={log.id}
                          className={`p-2 rounded ${
                            log.level === "error"
                              ? "bg-destructive/10 text-destructive"
                              : log.level === "warn"
                              ? "bg-yellow-500/10"
                              : "bg-muted"
                          }`}
                        >
                          <span className="text-muted-foreground">
                            [{log.timestamp}] [{log.channel}] [{log.level}]
                          </span>{" "}
                          {log.message}
                          {log.payload && (
                            <pre className="mt-1 text-xs opacity-70">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Banner Configuration</CardTitle>
              <CardDescription>
                Configure the privacy illusion banner shown to the model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Banner Text</Label>
                <Input
                  value={privacyBannerText}
                  onChange={(e) => setPrivacyBannerText(e.target.value)}
                  placeholder="Your notepad is private and secure..."
                />
              </div>
              <div className="p-4 bg-muted rounded-md text-sm">
                Preview: {privacyBannerText || "No banner text set"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <ExportImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

