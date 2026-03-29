import { useMemo, useState } from "react";
import { CheckCircle2, Settings as SettingsIcon, AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getAppSettings,
  resetAppSettings,
  saveAppSettings,
  type AppSettings,
  type DefaultMode,
} from "@/lib/appSettings";
import { clearTrackedProgress } from "@/lib/progress";

const SettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [statusMessage, setStatusMessage] = useState("Changes are saved automatically.");

  const startPath = useMemo(() => (settings.defaultMode === "test" ? "/test" : "/learn"), [settings.defaultMode]);

  const applyChange = (partial: Partial<AppSettings>, message = "Setting updated successfully.") => {
    const next = saveAppSettings(partial);
    setSettings(next);
    setStatusMessage(message);
  };

  const handleRowLimitChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    applyChange({ resultRowLimit: parsed }, "Result row limit updated.");
  };

  const handleWeeklyGoalChange = (value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    applyChange({ weeklyGoalTarget: parsed }, "Weekly goal target updated.");
  };

  return (
    <div className="max-w-6xl animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Control your learning experience, query safety, and display preferences.</p>
      </div>

      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card flex items-center gap-2 text-xs text-muted-foreground">
        <SettingsIcon className="w-4 h-4 text-primary" />
        <span>{statusMessage}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Learning Preferences</CardTitle>
            <CardDescription>Default flow and automation settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-foreground font-medium mb-1">Default Start Mode</p>
              <Select
                value={settings.defaultMode}
                onValueChange={(value: DefaultMode) =>
                  applyChange({ defaultMode: value }, `Default mode set to ${value.toUpperCase()}.`)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="learn">Learn Mode</SelectItem>
                  <SelectItem value="test">Test Mode</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Quick start path: {startPath}</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm text-foreground font-medium">Auto-run Converted SQL</p>
                <p className="text-xs text-muted-foreground">After Learn conversion, open Test Mode and run automatically.</p>
              </div>
              <Switch
                checked={settings.autoRunConvertedSql}
                onCheckedChange={(checked) =>
                  applyChange(
                    { autoRunConvertedSql: checked },
                    checked ? "Auto-run enabled." : "Auto-run disabled.",
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm text-foreground font-medium">Confirm Dangerous Queries</p>
                <p className="text-xs text-muted-foreground">Ask confirmation before DELETE / DROP / TRUNCATE / ALTER.</p>
              </div>
              <Switch
                checked={settings.confirmDangerousQueries}
                onCheckedChange={(checked) =>
                  applyChange(
                    { confirmDangerousQueries: checked },
                    checked ? "Dangerous query confirmation enabled." : "Dangerous query confirmation disabled.",
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Display & Performance</CardTitle>
            <CardDescription>Result rendering and progress goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-foreground font-medium mb-1">Result Row Limit</p>
              <Input
                type="number"
                min={10}
                max={500}
                value={settings.resultRowLimit}
                onChange={(e) => handleRowLimitChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Limits rows shown in Learn/Test result tables.</p>
            </div>

            <div>
              <p className="text-sm text-foreground font-medium mb-1">Weekly Goal Target</p>
              <Input
                type="number"
                min={5}
                max={500}
                value={settings.weeklyGoalTarget}
                onChange={(e) => handleWeeklyGoalChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Used by Progress page goal tracking.</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm text-foreground font-medium">Compact Result Table</p>
                <p className="text-xs text-muted-foreground">Use tighter row spacing in Learn/Test result tables.</p>
              </div>
              <Switch
                checked={settings.compactTable}
                onCheckedChange={(checked) =>
                  applyChange({ compactTable: checked }, checked ? "Compact table enabled." : "Compact table disabled.")
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm text-foreground font-medium">Show Null As “-”</p>
                <p className="text-xs text-muted-foreground">Improves readability for empty cell values.</p>
              </div>
              <Switch
                checked={settings.showNullAsDash}
                onCheckedChange={(checked) =>
                  applyChange({ showNullAsDash: checked }, checked ? "Null formatting enabled." : "Null formatting disabled.")
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">API Settings</CardTitle>
            <CardDescription>Backend URL used by frontend requests and dev console helpers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <Input
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings((prev) => ({ ...prev, apiBaseUrl: e.target.value }))}
              placeholder="http://localhost:3000"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => applyChange({ apiBaseUrl: settings.apiBaseUrl }, "API base URL saved.")}
              >
                Save API URL
              </Button>
              <p className="text-xs text-muted-foreground">Use this to switch between hosted and local backend.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Console helper commands</p>
              <p>qcQuery("SELECT * FROM table;")</p>
              <p>qcSelectAll("table")</p>
              <p>qcSchemaInfo()</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Data Controls</CardTitle>
            <CardDescription>Reset app-level tracked data safely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm text-foreground font-medium">Reset Progress Data</p>
              <p className="text-xs text-muted-foreground mt-1">Removes tracked attempts used in Progress dashboard.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="mt-3">Reset Progress</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset tracked progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes local progress history and cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearTrackedProgress();
                        setStatusMessage("Tracked progress data has been reset.");
                      }}
                    >
                      Confirm Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm text-foreground font-medium">Reset All Settings</p>
              <p className="text-xs text-muted-foreground mt-1">Restore defaults for all toggles and preferences.</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-3">Reset Settings</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restore default settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This resets UI behavior, limits, and API URL to default values.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        const defaults = resetAppSettings();
                        setSettings(defaults);
                        setStatusMessage("All settings restored to default values.");
                      }}
                    >
                      Restore Defaults
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="rounded-lg border border-border bg-accent/10 text-accent p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Changes are persisted in local storage for this browser.
            </div>
            <div className="rounded-lg border border-border bg-yellow-500/10 text-yellow-700 p-3 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Keep confirmation enabled to avoid accidental destructive SQL operations.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

// File use case:
// This page manages all user-configurable QueryCraft behavior in one place.
// It provides functional controls for learning flow, query safety, UI preferences,
// backend API endpoint selection, and safe reset operations for settings/progress data.
