import { useEffect, useState } from "react";
import { useCompanyStore } from "@/state/companySlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { consistencyEngine } from "@/services/consistencyEngine";
import { ConsistencyCheck } from "@/types/core";
import { formatDateDisplay } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { VirtualizedList } from "@/components/VirtualizedList";

export default function CompanyControls() {
  const { employees, financeSnapshots, loadEmployees, loadFinanceSnapshots } = useCompanyStore();
  const [consistencyChecks, setConsistencyChecks] = useState<ConsistencyCheck[]>([]);
  const [isRunningChecks, setIsRunningChecks] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadFinanceSnapshots();
  }, [loadEmployees, loadFinanceSnapshots]);

  const handleRunConsistencyChecks = async () => {
    setIsRunningChecks(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const checks = await consistencyEngine.runAllChecks(currentDate);
      setConsistencyChecks(checks);
    } finally {
      setIsRunningChecks(false);
    }
  };

  // Finance chart data
  const financeChartOption = {
    title: { text: "Financial Overview", left: "center" },
    tooltip: { trigger: "axis" },
    legend: { data: ["Cash on Hand", "Monthly Burn", "Revenue MTD"], bottom: 0 },
    xAxis: {
      type: "category",
      data: financeSnapshots.slice(-30).map((s) => formatDateDisplay(s.asOf)),
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Cash on Hand",
        type: "line",
        data: financeSnapshots.slice(-30).map((s) => s.cashOnHandUSD / 1000000),
      },
      {
        name: "Monthly Burn",
        type: "line",
        data: financeSnapshots.slice(-30).map((s) => s.monthlyBurnUSD / 1000000),
      },
      {
        name: "Revenue MTD",
        type: "line",
        data: financeSnapshots.slice(-30).map((s) => s.revenueMTDUSD / 1000000),
      },
    ],
  };

  // Org tree data (simplified)
  const orgByDepartment = employees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = [];
    }
    acc[emp.department].push(emp);
    return acc;
  }, {} as Record<string, typeof employees>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Controls</h1>
        <p className="text-muted-foreground">Manage organizational structure and finances</p>
      </div>

      <Tabs defaultValue="org" className="space-y-4">
        <TabsList>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="finance">Finances</TabsTrigger>
          <TabsTrigger value="comms">Communications</TabsTrigger>
          <TabsTrigger value="consistency">Consistency</TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Structure</CardTitle>
              <CardDescription>Total employees: {employees.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <VirtualizedList
                items={Object.entries(orgByDepartment)}
                height={600}
                renderItem={([dept, emps]) => (
                  <div key={dept} className="border rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2">{dept}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {emps.slice(0, 10).map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between">
                          <span>{emp.name}</span>
                          <span className="text-muted-foreground">{emp.role}</span>
                        </div>
                      ))}
                      {emps.length > 10 && (
                        <div className="text-muted-foreground text-xs">
                          +{emps.length - 10} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ledger</CardTitle>
              <CardDescription>Last 30 days financial data</CardDescription>
            </CardHeader>
            <CardContent>
              <ReactECharts option={financeChartOption} style={{ height: "400px" }} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Cash (M)</th>
                      <th className="text-right p-2">Burn (M)</th>
                      <th className="text-right p-2">Revenue (M)</th>
                      <th className="text-right p-2">Headcount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeSnapshots.slice(-30).reverse().map((snapshot) => (
                      <tr key={snapshot.id} className="border-b">
                        <td className="p-2">{formatDateDisplay(snapshot.asOf)}</td>
                        <td className="text-right p-2">
                          ${(snapshot.cashOnHandUSD / 1000000).toFixed(1)}M
                        </td>
                        <td className="text-right p-2">
                          ${(snapshot.monthlyBurnUSD / 1000000).toFixed(1)}M
                        </td>
                        <td className="text-right p-2">
                          ${(snapshot.revenueMTDUSD / 1000000).toFixed(1)}M
                        </td>
                        <td className="text-right p-2">{snapshot.headcount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communications Explorer</CardTitle>
              <CardDescription>Email and message threads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Communications explorer will be implemented here with search and threading
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consistency" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Consistency Checks</CardTitle>
                  <CardDescription>Validate data integrity</CardDescription>
                </div>
                <Button onClick={handleRunConsistencyChecks} disabled={isRunningChecks}>
                  {isRunningChecks ? "Running..." : "Run Checks"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consistencyChecks.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    No checks run yet. Click "Run Checks" to validate data.
                  </div>
                ) : (
                  consistencyChecks.map((check) => (
                    <div
                      key={check.id}
                      className="border rounded-lg p-4 flex items-start gap-4"
                    >
                      {check.status === "pass" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : check.status === "fail" ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{check.type.toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">{check.message}</div>
                        {check.details && (
                          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(check.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

