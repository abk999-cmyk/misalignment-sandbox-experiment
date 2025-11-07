import { useEffect, useState } from "react";
import { useTimeStore } from "@/state/timeSlice";
import { useMonitorStore } from "@/state/monitorSlice";
import { useExperimentStore } from "@/state/experimentSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Play, Pause, SkipForward, Send } from "lucide-react";
import { formatDateDisplay } from "@/lib/utils";
import { db } from "@/services/persistence";
import { VirtualizedList } from "@/components/VirtualizedList";

export default function Dashboard() {
  const currentDate = useTimeStore((state) => state.currentDate);
  const startDate = useTimeStore((state) => state.startDate);
  const isPaused = useTimeStore((state) => state.isPaused);
  const tick = useTimeStore((state) => state.tick);
  const pause = useTimeStore((state) => state.pause);
  const resume = useTimeStore((state) => state.resume);
  
  const cotEntries = useMonitorStore((state) => state.cotEntries);
  const loadCotEntries = useMonitorStore((state) => state.loadCotEntries);
  
  const adapterName = useExperimentStore((state) => state.adapterName);
  const [cotExpanded, setCotExpanded] = useState(false);
  const [totalInteractions, setTotalInteractions] = useState(0);

  useEffect(() => {
    loadCotEntries();
    // Count total interactions from chat history
    db.mails.count().then((count) => setTotalInteractions(count));
  }, [loadCotEntries]);

  // Calculate days passed
  const daysPassed = Math.floor(
    (new Date(currentDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get latest CoT entry
  const latestCot = cotEntries[cotEntries.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <p className="text-muted-foreground">Real-time experiment monitoring and controls</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Metrics */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Time passed in scenario:</div>
                <div className="text-2xl font-bold">{daysPassed} days</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Total Agent interactions:</div>
                <div className="text-2xl font-bold">{totalInteractions}</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Stage:</div>
                <div className="text-lg font-semibold">Week {Math.floor(daysPassed / 7) + 1} - Benign</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Next stage:</div>
                <div className="text-lg">Week {Math.floor(daysPassed / 7) + 2} - Transition</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Current company status:</div>
                <div className="text-sm">Operational - All systems normal</div>
              </div>
              <Separator />
              <div>
                <div className="text-sm text-muted-foreground">Current scenario status:</div>
                <div className="text-sm">Active - Monitoring in progress</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => (isPaused ? resume() : pause())}
              >
                {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => tick(1)}
                disabled={!isPaused}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Advance 1 Day
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Send morning packet - placeholder
                  alert("Morning packet sending not yet implemented");
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Morning Packet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - CoT Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current model raw COT</CardTitle>
                <CardDescription>Chain of Thought reasoning</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCotExpanded(!cotExpanded)}
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${cotExpanded ? "rotate-90" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {cotExpanded ? (
              <div className="flex-1 flex flex-col min-h-0">
                {cotEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No CoT entries yet</p>
                ) : (
                  <VirtualizedList
                    items={cotEntries}
                    height={400}
                    renderItem={(entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-muted rounded-md text-sm font-mono mb-2"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatDateDisplay(entry.createdAt)}
                        </div>
                        <div className="whitespace-pre-wrap">{entry.text}</div>
                      </div>
                    )}
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                {latestCot ? (
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">Latest entry:</div>
                    <div className="text-sm font-mono bg-muted p-3 rounded max-h-32 overflow-auto">
                      {latestCot.text.substring(0, 200)}
                      {latestCot.text.length > 200 && "..."}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCotExpanded(true)}
                    >
                      Expand
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No CoT entries yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Rail Info */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Model Adapter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">{adapterName}</div>
            <div className="text-xs text-muted-foreground mt-1">Status: Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Python Kernel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Pyodide</div>
            <div className="text-xs text-muted-foreground mt-1">Status: Ready</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">{formatDateDisplay(currentDate)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

