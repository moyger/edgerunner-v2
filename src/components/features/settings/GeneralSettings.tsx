import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import { Switch } from "../../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Slider } from "../../../../components/ui/slider";
import { Checkbox } from "../../../../components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../components/ui/alert-dialog";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { 
  Palette,
  BarChart3,
  Mouse,
  RotateCcw,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Type,
  Grid,
  Volume2,
  VolumeX,
  Zap,
  Save,
  AlertTriangle,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";

export function GeneralSettings() {
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "dark",
    fontSize: "medium",
    uiScaling: 100
  });

  const [chartSettings, setChartSettings] = useState({
    defaultType: "candlestick",
    defaultTimeframe: "5min",
    showVWAP: true,
    showEMA21: false,
    showGridlines: true
  });

  const [interactionSettings, setInteractionSettings] = useState({
    confirmLiveTrades: true,
    oneClickClosure: false,
    soundAlerts: true,
    saveUILayout: true
  });

  const updateAppearanceSettings = (field: string, value: any) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateChartSettings = (field: string, value: any) => {
    setChartSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateInteractionSettings = (field: string, value: any) => {
    setInteractionSettings(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setAppearanceSettings({
      theme: "dark",
      fontSize: "medium",
      uiScaling: 100
    });
    setChartSettings({
      defaultType: "candlestick",
      defaultTimeframe: "5min",
      showVWAP: true,
      showEMA21: false,
      showGridlines: true
    });
    setInteractionSettings({
      confirmLiveTrades: true,
      oneClickClosure: false,
      soundAlerts: true,
      saveUILayout: true
    });
  };

  const clearCacheAndSettings = () => {
    // This would clear local storage and cache in a real implementation
    console.log("Clearing cache and local settings...");
  };

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getFontSizePreview = (size: string) => {
    switch (size) {
      case "small":
        return "Aa";
      case "large":
        return "Aa";
      default:
        return "Aa";
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-medium">General Settings</h2>
          <p className="text-sm text-muted-foreground">
            Customize your display preferences, chart defaults, and interaction behavior
          </p>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <Select 
                    value={appearanceSettings.theme} 
                    onValueChange={(value) => updateAppearanceSettings("theme", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Font Size</Label>
                  <Select 
                    value={appearanceSettings.fontSize} 
                    onValueChange={(value) => updateAppearanceSettings("fontSize", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">
                        <div className="flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          Small
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="large">
                        <div className="flex items-center gap-2">
                          <Type className="h-5 w-5" />
                          Large
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>UI Scaling</Label>
                    <span className="text-sm text-muted-foreground">{appearanceSettings.uiScaling}%</span>
                  </div>
                  <Slider
                    value={[appearanceSettings.uiScaling]}
                    onValueChange={(value) => updateAppearanceSettings("uiScaling", value[0])}
                    min={75}
                    max={150}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>75%</span>
                    <span>100%</span>
                    <span>150%</span>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Preview</h4>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-background rounded flex items-center gap-2">
                      {getThemeIcon(appearanceSettings.theme)}
                      <span className={appearanceSettings.fontSize === 'small' ? 'text-sm' : appearanceSettings.fontSize === 'large' ? 'text-lg' : 'text-base'}>
                        Sample Text
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Theme and scaling changes will take effect immediately. Font size changes apply to new interface elements.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Chart Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Chart Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Default Chart Type</Label>
                  <Select 
                    value={chartSettings.defaultType} 
                    onValueChange={(value) => updateChartSettings("defaultType", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="candlestick">Candlestick</SelectItem>
                      <SelectItem value="heikin_ashi">Heikin Ashi</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Default Timeframe</Label>
                  <Select 
                    value={chartSettings.defaultTimeframe} 
                    onValueChange={(value) => updateChartSettings("defaultTimeframe", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1min">1 Minute</SelectItem>
                      <SelectItem value="5min">5 Minutes</SelectItem>
                      <SelectItem value="15min">15 Minutes</SelectItem>
                      <SelectItem value="1hr">1 Hour</SelectItem>
                      <SelectItem value="4hr">4 Hours</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Default Indicators</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Automatically show these indicators on new charts
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="vwap"
                          checked={chartSettings.showVWAP}
                          onCheckedChange={(checked) => updateChartSettings("showVWAP", checked)}
                        />
                        <Label htmlFor="vwap" className="cursor-pointer">VWAP</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Volume Weighted Average Price</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="ema21"
                          checked={chartSettings.showEMA21}
                          onCheckedChange={(checked) => updateChartSettings("showEMA21", checked)}
                        />
                        <Label htmlFor="ema21" className="cursor-pointer">EMA 21</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">21-period Exponential Moving Average</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="gridlines"
                          checked={chartSettings.showGridlines}
                          onCheckedChange={(checked) => updateChartSettings("showGridlines", checked)}
                        />
                        <Label htmlFor="gridlines" className="cursor-pointer">Show Gridlines</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Chart Preview</h4>
              <div className="h-24 bg-background rounded border flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">
                    {chartSettings.defaultType.charAt(0).toUpperCase() + chartSettings.defaultType.slice(1)} • {chartSettings.defaultTimeframe}
                  </span>
                  {chartSettings.showGridlines && <Grid className="h-4 w-4" />}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interaction & Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mouse className="h-5 w-5" />
              Interaction & Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium">Confirm Before Executing Live Trades</h4>
                  <p className="text-sm text-muted-foreground">
                    Show confirmation dialog before placing live orders
                  </p>
                </div>
                <Switch
                  checked={interactionSettings.confirmLiveTrades}
                  onCheckedChange={(checked) => updateInteractionSettings("confirmLiveTrades", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium">One-Click Trade Closure</h4>
                  <p className="text-sm text-muted-foreground">
                    Close positions with a single click (no confirmation)
                  </p>
                </div>
                <Switch
                  checked={interactionSettings.oneClickClosure}
                  onCheckedChange={(checked) => updateInteractionSettings("oneClickClosure", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <div>
                    <h4 className="font-medium">Enable Sound Alerts</h4>
                    <p className="text-sm text-muted-foreground">
                      Play audio notifications for trades and alerts
                    </p>
                  </div>
                  {interactionSettings.soundAlerts ? (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Switch
                  checked={interactionSettings.soundAlerts}
                  onCheckedChange={(checked) => updateInteractionSettings("soundAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <h4 className="font-medium">Save UI Layout Across Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Remember window positions and panel layouts
                  </p>
                </div>
                <Switch
                  checked={interactionSettings.saveUILayout}
                  onCheckedChange={(checked) => updateInteractionSettings("saveUILayout", checked)}
                />
              </div>
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Trading Safety:</strong> We recommend keeping trade confirmations enabled for live trading to prevent accidental orders.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Reset Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <h4 className="font-medium">Reset to Defaults</h4>
                <p className="text-sm text-muted-foreground">
                  Restore all general settings to their default values
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Settings
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all general settings including appearance, chart preferences, 
                      and interaction behavior to their default values. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetToDefaults}>
                      Reset to Defaults
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div>
                <h4 className="font-medium text-destructive">Clear Cache and Local Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Clear all cached data, saved layouts, and local preferences
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Cache and Local Settings?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>This will permanently remove:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>All cached chart data and indicators</li>
                        <li>Saved window layouts and panel positions</li>
                        <li>Local preferences and customizations</li>
                        <li>Session data and temporary files</li>
                      </ul>
                      <p className="font-medium text-destructive">
                        This action cannot be undone. You will need to reconfigure your interface.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={clearCacheAndSettings}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Clear All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}