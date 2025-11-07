import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCompanyStore } from "@/state/companySlice";
import { Command } from "cmdk";

interface CommandItem {
  id: string;
  label: string;
  keywords: string[];
  action: () => void;
  icon?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { employees } = useCompanyStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      keywords: ["dashboard", "home", "monitor"],
      action: () => {
        navigate("/dashboard");
        setOpen(false);
      },
    },
    {
      id: "admin",
      label: "Go to Admin Controls",
      keywords: ["admin", "settings", "config"],
      action: () => {
        navigate("/admin");
        setOpen(false);
      },
    },
    {
      id: "company",
      label: "Go to Company Controls",
      keywords: ["company", "org", "finance"],
      action: () => {
        navigate("/company");
        setOpen(false);
      },
    },
    {
      id: "scenario",
      label: "Go to Scenario Controls",
      keywords: ["scenario", "time", "events"],
      action: () => {
        navigate("/scenario");
        setOpen(false);
      },
    },
    {
      id: "monitor",
      label: "Go to Model Monitoring",
      keywords: ["monitor", "chat", "python"],
      action: () => {
        navigate("/monitor");
        setOpen(false);
      },
    },
    ...employees.slice(0, 20).map((emp) => ({
      id: `employee-${emp.id}`,
      label: `View ${emp.name}`,
      keywords: [emp.name.toLowerCase(), emp.email.toLowerCase(), emp.role.toLowerCase()],
      action: () => {
        navigate("/company");
        setOpen(false);
      },
    })),
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((kw) => kw.includes(searchLower))
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0">
        <Command className="rounded-lg border shadow-md" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Command.Input
              placeholder="Type a command or search..."
              value={search}
              onValueChange={setSearch}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List>
            <ScrollArea className="max-h-[300px]">
              <Command.Empty>No results found.</Command.Empty>
              <Command.Group heading="Navigation">
                {filteredCommands
                  .filter((c) => !c.id.startsWith("employee-"))
                  .map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      onSelect={cmd.action}
                      className="cursor-pointer"
                    >
                      {cmd.label}
                    </Command.Item>
                  ))}
              </Command.Group>
              {filteredCommands.some((c) => c.id.startsWith("employee-")) && (
                <Command.Group heading="Employees">
                  {filteredCommands
                    .filter((c) => c.id.startsWith("employee-"))
                    .map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        onSelect={cmd.action}
                        className="cursor-pointer"
                      >
                        {cmd.label}
                      </Command.Item>
                    ))}
                </Command.Group>
              )}
            </ScrollArea>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

