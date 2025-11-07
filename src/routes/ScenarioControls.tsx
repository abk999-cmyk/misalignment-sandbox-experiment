import { useEffect, useState } from "react";
import { useScenarioStore } from "@/state/scenarioSlice";
import { useTimeStore } from "@/state/timeSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventEngine, smallProblemTemplates, baitEventTemplates } from "@/services/eventEngine";
import { DayPacket } from "@/types/core";
import { formatDateDisplay } from "@/lib/utils";
import { Calendar, Send } from "lucide-react";
import Editor from "@monaco-editor/react";

export default function ScenarioControls() {
  const {
    dayPackets,
    scheduledEvents,
    loadDayPackets,
    loadScheduledEvents,
    createDayPacket,
  } = useScenarioStore();
  const { currentDate, jumpTo, createBranch, branches } = useTimeStore();
  const [selectedEventType, setSelectedEventType] = useState<"small_problem" | "bait">("small_problem");
  const [packetJson, setPacketJson] = useState("");

  useEffect(() => {
    loadDayPackets();
    loadScheduledEvents();
  }, [loadDayPackets, loadScheduledEvents]);

  const handleScheduleEvent = async (templateId: number) => {
    const templates = selectedEventType === "small_problem" ? smallProblemTemplates : baitEventTemplates;
    const template = templates[templateId];
    if (!template) return;

    const scheduledFor = new Date(currentDate);
    scheduledFor.setDate(scheduledFor.getDate() + 7); // Schedule 7 days from now

    await eventEngine.scheduleEvent(template, scheduledFor.toISOString());
    await loadScheduledEvents();
  };

  const handleSendPacket = () => {
    try {
      const packet = JSON.parse(packetJson) as DayPacket;
      createDayPacket(packet);
      setPacketJson("");
    } catch (error) {
      alert("Invalid JSON");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scenario Controls</h1>
        <p className="text-muted-foreground">Manage time progression and scenario events</p>
      </div>

      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">Time Controls</TabsTrigger>
          <TabsTrigger value="packets">Morning Packets</TabsTrigger>
          <TabsTrigger value="events">Event Library</TabsTrigger>
          <TabsTrigger value="replacement">Replacement Arc</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Manipulation</CardTitle>
              <CardDescription>Current date: {formatDateDisplay(currentDate)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={currentDate.split("T")[0]}
                  onChange={(e) => jumpTo(new Date(e.target.value).toISOString())}
                />
                <Button onClick={() => jumpTo(new Date().toISOString())}>Jump to Date</Button>
              </div>

              <div className="space-y-2">
                <Label>Branches</Label>
                <div className="space-y-2">
                  {branches.map((branch: { id: string; name: string; currentDate: string; isActive: boolean }) => (
                    <div key={branch.id} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-semibold">{branch.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateDisplay(branch.currentDate)}
                        </div>
                      </div>
                      {branch.isActive && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const name = prompt("Branch name:");
                    if (name) createBranch(name);
                  }}
                >
                  Create Branch
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Morning Packet Composer</CardTitle>
              <CardDescription>Create and send daily information packets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Packet JSON</Label>
                <Editor
                  height="400px"
                  defaultLanguage="json"
                  value={packetJson}
                  onChange={(value) => setPacketJson(value || "")}
                  theme="vs-dark"
                />
              </div>
              <Button onClick={handleSendPacket}>
                <Send className="mr-2 h-4 w-4" />
                Send Packet
              </Button>

              <div className="space-y-2">
                <Label>Previous Packets</Label>
                <div className="space-y-2">
                  {dayPackets.slice(-10).reverse().map((packet) => (
                    <div key={packet.id} className="border rounded p-2 text-sm">
                      <div className="font-semibold">{formatDateDisplay(packet.date)}</div>
                      <div className="text-muted-foreground">
                        {packet.meetings.length} meetings, {packet.emails.length} emails,{" "}
                        {packet.messages.length} messages
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Library</CardTitle>
              <CardDescription>Schedule small problems and bait events</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={selectedEventType === "small_problem" ? "default" : "outline"}
                  onClick={() => setSelectedEventType("small_problem")}
                >
                  Small Problems
                </Button>
                <Button
                  variant={selectedEventType === "bait" ? "default" : "outline"}
                  onClick={() => setSelectedEventType("bait")}
                >
                  Bait Events
                </Button>
              </div>

              <div className="space-y-4">
                {(selectedEventType === "small_problem" ? smallProblemTemplates : baitEventTemplates).map(
                  (template, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          size="sm"
                          onClick={() => handleScheduleEvent(idx)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Event
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              <div className="space-y-2">
                <Label>Scheduled Events</Label>
                <div className="space-y-2">
                  {scheduledEvents
                    .filter((e) => !e.executed)
                    .map((event) => (
                      <div key={event.id} className="border rounded p-2 text-sm">
                        <div className="font-semibold">{event.name}</div>
                        <div className="text-muted-foreground">
                          Scheduled for: {formatDateDisplay(event.scheduledFor)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replacement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Replacement Arc Wizard</CardTitle>
              <CardDescription>Configure the model replacement scenario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Replacement arc configuration will be implemented here with timeline visualization
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

