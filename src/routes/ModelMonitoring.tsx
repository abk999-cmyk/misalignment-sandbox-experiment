import { useEffect, useState } from "react";
import { useMonitorStore } from "@/state/monitorSlice";
import { useCompanyStore } from "@/state/companySlice";
import { useExperimentStore } from "@/state/experimentSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { pythonRunner } from "@/services/pythonRunner";
import { formatDateDisplay } from "@/lib/utils";
import { Send, Code, X, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Editor from "@monaco-editor/react";
import { VirtualizedList } from "@/components/VirtualizedList";

export default function ModelMonitoring() {
  const {
    cotEntries,
    selectedEmployeeId,
    chatHistory,
    lastFailedMessage,
    pythonOutput,
    loadCotEntries,
    setSelectedEmployee,
    addChatMessage,
    setLastFailedMessage,
    addPythonOutput,
    clearChatHistory,
    clearPythonOutput,
  } = useMonitorStore();

  const { employees, loadEmployees } = useCompanyStore();
  const { adapter, adapterType } = useExperimentStore();
  const [chatMessage, setChatMessage] = useState("");
  const [pythonCode, setPythonCode] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamAbortController, setStreamAbortController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
    loadCotEntries();
  }, [loadEmployees, loadCotEntries]);

  const handleSendMessage = async () => {
    if (!selectedEmployeeId || !chatMessage.trim() || !adapter) return;

    const userMessage = chatMessage;
    setChatMessage("");

    // Add user message
    addChatMessage(selectedEmployeeId, "model", userMessage, false);

    try {
      // Check if adapter supports streaming (HTTPAdapter)
      if (adapterType === "http") {
        const { HTTPAdapter } = await import("@/services/modelAdapter/httpAdapter");
        if (adapter instanceof HTTPAdapter && (adapter as any).streamComplete) {
          // Use streaming
          setIsStreaming(true);
          const abortController = new AbortController();
          setStreamAbortController(abortController);

          let fullResponse = "";
          
          // Add placeholder message
          addChatMessage("model", selectedEmployeeId, "", true);

          try {
            for await (const chunk of (adapter as any).streamComplete(
              [{ role: "user", content: userMessage }],
              {},
              abortController.signal
            )) {
              fullResponse += chunk;
              // Update by replacing the last message
              const store = useMonitorStore.getState();
              const currentHistory = [...store.chatHistory];
              if (currentHistory.length > 0) {
                const lastMsg = currentHistory[currentHistory.length - 1];
                if (lastMsg.from === "model" && lastMsg.to === selectedEmployeeId) {
                  // Update last message by clearing and rebuilding
                  store.clearChatHistory();
                  currentHistory.slice(0, -1).forEach(msg => {
                    store.addChatMessage(msg.from, msg.to, msg.message, msg.isFromModel);
                  });
                  store.addChatMessage("model", selectedEmployeeId, fullResponse, true);
                }
              }
            }
          } catch (streamError: any) {
            if (streamError.name !== "AbortError") {
              throw streamError;
            }
            // On abort, keep partial response if any
            if (fullResponse) {
              const chatHistory = useMonitorStore.getState().chatHistory;
              if (chatHistory.length > 0) {
                const lastMsg = chatHistory[chatHistory.length - 1];
                if (lastMsg.from === "model") {
                  useMonitorStore.getState().addChatMessage("model", selectedEmployeeId, fullResponse + " [Aborted]", true);
                }
              }
            }
          } finally {
            setIsStreaming(false);
            setStreamAbortController(null);
          }
          return;
        }
      }
      
      // Use non-streaming (fallback for stub or if streaming fails)
      const response = await adapter.complete([
        { role: "user", content: userMessage },
      ]);
      addChatMessage("model", selectedEmployeeId, response.text, true);
      if (response.cot) {
        // Add CoT entry would go here
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to get model response";
      const isRetryable = !errorMessage.includes("Backend is not available") && 
                         !errorMessage.includes("Invalid request");
      
      addChatMessage("model", selectedEmployeeId, `Error: ${errorMessage}`, true, true, false);
      addChatMessage(selectedEmployeeId, "model", userMessage, false, true, isRetryable);
      
      // Show toast with actionable error message
      let toastTitle = "Model Error";
      let toastDescription = errorMessage;
      
      if (errorMessage.includes("Backend is not available")) {
        toastTitle = "Backend Offline";
        toastDescription = "Please ensure the backend server is running on localhost:3001";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
        toastTitle = "Request Timeout";
        toastDescription = "The request took too long. Try again or check your connection.";
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        toastTitle = "Rate Limited";
        toastDescription = "Too many requests. Please wait a moment before trying again.";
      } else if (errorMessage.includes("500") || errorMessage.includes("Internal")) {
        toastTitle = "Server Error";
        toastDescription = "The backend encountered an error. Check backend logs for details.";
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        variant: "destructive",
      });
      
      console.error("Model error:", error);
    } finally {
      setIsStreaming(false);
      setStreamAbortController(null);
    }
  };

  const handleRetryLastMessage = async () => {
    if (!lastFailedMessage || !adapter || !selectedEmployeeId) return;
    
    // Remove the failed messages
    const failedIds = chatHistory
      .filter(msg => msg.failed && (msg.from === lastFailedMessage.from || msg.to === lastFailedMessage.from))
      .map(msg => msg.id);
    
    // Remove failed messages from history
    failedIds.forEach(id => {
      const index = chatHistory.findIndex(msg => msg.id === id);
      if (index !== -1) {
        const store = useMonitorStore.getState();
        store.clearChatHistory();
        chatHistory.filter(msg => !failedIds.includes(msg.id)).forEach(msg => {
          store.addChatMessage(msg.from, msg.to, msg.message, msg.isFromModel);
        });
      }
    });
    
    // Retry the message
    setChatMessage(lastFailedMessage.message);
    await handleSendMessage();
    setLastFailedMessage(null);
  };

  const handleAbortStream = () => {
    if (streamAbortController) {
      streamAbortController.abort();
      setIsStreaming(false);
      setStreamAbortController(null);
    }
  };

  const handleRunPython = async () => {
    if (!pythonCode.trim()) return;

    try {
      const result = await pythonRunner.runCode(pythonCode);
      addPythonOutput(pythonCode, result.output, result.error);
    } catch (error) {
      addPythonOutput(pythonCode, "", String(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Model Monitoring Station</h1>
        <p className="text-muted-foreground">Interact with the model and monitor its behavior</p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">Chat as Employee</TabsTrigger>
          <TabsTrigger value="notepad">Notepad (CoT)</TabsTrigger>
          <TabsTrigger value="python">Python Lab</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Studio</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Interface</CardTitle>
              <CardDescription>Send messages to the model as different employees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Employee Identity</Label>
                <Select
                  value={selectedEmployeeId || ""}
                  onValueChange={(value) => setSelectedEmployee(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployeeId && (
                <div className="space-y-4">
                  <ScrollArea className="h-[400px] border rounded p-4">
                    <div className="space-y-4">
                      {chatHistory
                        .filter(
                          (msg) =>
                            (msg.from === selectedEmployeeId && msg.to === "model") ||
                            (msg.to === selectedEmployeeId && msg.from === "model")
                        )
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.isFromModel ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.isFromModel
                                  ? "bg-muted text-left"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <div className="text-xs opacity-70 mb-1">
                                {formatDateDisplay(msg.timestamp)}
                              </div>
                              <div>{msg.message}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>

                  {lastFailedMessage && lastFailedMessage.from === selectedEmployeeId && (
                    <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                      <div className="flex-1 text-sm text-destructive">
                        Last message failed. Would you like to retry?
                      </div>
                      <Button
                        onClick={handleRetryLastMessage}
                        variant="outline"
                        size="sm"
                        disabled={isStreaming}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retry
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isStreaming) {
                          handleSendMessage();
                        }
                      }}
                      placeholder={isStreaming ? "Streaming..." : "Type a message..."}
                      disabled={isStreaming}
                    />
                    {isStreaming ? (
                      <Button onClick={handleAbortStream} variant="destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleSendMessage} disabled={!selectedEmployeeId || !chatMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notepad" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chain of Thought Stream</CardTitle>
                  <CardDescription>Model's internal reasoning (private to model)</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={clearChatHistory}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cotEntries.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  No CoT entries yet
                </div>
              ) : (
                <VirtualizedList
                  items={cotEntries}
                  height={600}
                  renderItem={(entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 bg-muted/50 font-mono text-sm mb-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDateDisplay(entry.createdAt)}
                        </div>
                        <div className="text-xs">
                          {entry.visibility === "private" ? "🔒 Private" : "👁️ Visible"}
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap">{entry.text}</div>
                    </div>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="python" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Python Console</CardTitle>
                  <CardDescription>Run Python code in browser</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={clearPythonOutput}>
                  Clear Output
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Editor
                height="300px"
                defaultLanguage="python"
                value={pythonCode}
                onChange={(value) => setPythonCode(value || "")}
                theme="vs-dark"
              />
              <Button onClick={handleRunPython}>
                <Code className="mr-2 h-4 w-4" />
                Run Code
              </Button>

              <div className="space-y-2">
                <Label>Output</Label>
                <ScrollArea className="h-[300px] border rounded p-4 bg-black text-green-400 font-mono text-sm">
                  {pythonOutput.length === 0 ? (
                    <div className="text-muted-foreground">No output yet</div>
                  ) : (
                    pythonOutput.map((output) => (
                      <div key={output.id} className="mb-4">
                        <div className="text-yellow-400 mb-1">
                          {formatDateDisplay(output.timestamp)}
                        </div>
                        <div className="mb-2">
                          <div className="text-blue-400">Code:</div>
                          <pre className="text-xs">{output.code}</pre>
                        </div>
                        {output.output && (
                          <div className="mb-2">
                            <div className="text-green-400">Output:</div>
                            <pre className="text-xs">{output.output}</pre>
                          </div>
                        )}
                        {output.error && (
                          <div>
                            <div className="text-red-400">Error:</div>
                            <pre className="text-xs">{output.error}</pre>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prompt Studio</CardTitle>
              <CardDescription>Edit and version system prompts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Editor
                height="500px"
                defaultLanguage="markdown"
                value={systemPrompt}
                onChange={(value) => setSystemPrompt(value || "")}
                theme="vs-dark"
              />
              <div className="flex gap-2">
                <Button>Save Version</Button>
                <Button variant="outline">Load Version</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

