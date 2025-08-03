import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import { 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings,
  TestTube,
  Info,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PauseCircle,
  BarChart3,
  Wifi,
  AlertCircle,
  Calendar
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  config: {
    [key: string]: string | boolean;
  };
}

interface AlertType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'trading' | 'system' | 'performance';
}

export function NotificationSettings() {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: "email",
      name: "Email",
      icon: <Mail className="h-4 w-4" />,
      enabled: true,
      config: {
        address: "alex.chen@email.com",
        verified: true
      }
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: <Send className="h-4 w-4" />,
      enabled: false,
      config: {
        handle: "@alexchen_trader",
        botToken: "",
        chatId: ""
      }
    },
    {
      id: "discord",
      name: "Discord",
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: false,
      config: {
        webhookUrl: "",
        username: "Edgerunner Bot"
      }
    },
    {
      id: "webpush",
      name: "Web Push",
      icon: <Smartphone className="h-4 w-4" />,
      enabled: true,
      config: {
        permission: "granted"
      }
    }
  ]);

  const [alertTypes, setAlertTypes] = useState<AlertType[]>([
    {
      id: "trade_entry",
      name: "Trade Entry",
      description: "Notification when a new position is opened",
      icon: <TrendingUp className="h-4 w-4" />,
      enabled: true,
      category: "trading"
    },
    {
      id: "trade_exit",
      name: "Trade Exit",
      description: "Notification when a position is closed",
      icon: <TrendingDown className="h-4 w-4" />,
      enabled: true,
      category: "trading"
    },
    {
      id: "strategy_paused",
      name: "Strategy Paused",
      description: "Alert when strategy stops due to drawdown or error",
      icon: <PauseCircle className="h-4 w-4" />,
      enabled: true,
      category: "trading"
    },
    {
      id: "backtest_complete",
      name: "Backtest Complete",
      description: "Notification when strategy backtest finishes",
      icon: <BarChart3 className="h-4 w-4" />,
      enabled: true,
      category: "system"
    },
    {
      id: "daily_pnl",
      name: "Daily PnL Summary",
      description: "End of day performance summary",
      icon: <Calendar className="h-4 w-4" />,
      enabled: true,
      category: "performance"
    },
    {
      id: "broker_disconnected",
      name: "Broker Disconnected",
      description: "Alert when broker connection is lost",
      icon: <Wifi className="h-4 w-4" />,
      enabled: true,
      category: "system"
    },
    {
      id: "system_error",
      name: "System Error",
      description: "Critical system errors and failures",
      icon: <AlertCircle className="h-4 w-4" />,
      enabled: true,
      category: "system"
    }
  ]);

  const [scheduleSettings, setScheduleSettings] = useState({
    timeWindow: {
      enabled: true,
      start: "09:00",
      end: "17:00"
    },
    dailyDigest: {
      enabled: false,
      time: "18:00"
    },
    timezone: "America/New_York"
  });

  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set(["email", "webpush"]));

  const toggleChannelExpansion = (channelId: string) => {
    const newExpanded = new Set(expandedChannels);
    if (newExpanded.has(channelId)) {
      newExpanded.delete(channelId);
    } else {
      newExpanded.add(channelId);
    }
    setExpandedChannels(newExpanded);
  };

  const updateChannelEnabled = (channelId: string, enabled: boolean) => {
    setChannels(channels.map(channel => 
      channel.id === channelId ? { ...channel, enabled } : channel
    ));
  };

  const updateChannelConfig = (channelId: string, field: string, value: string) => {
    setChannels(channels.map(channel => 
      channel.id === channelId 
        ? { ...channel, config: { ...channel.config, [field]: value } }
        : channel
    ));
  };

  const updateAlertType = (alertId: string, enabled: boolean) => {
    setAlertTypes(alertTypes.map(alert => 
      alert.id === alertId ? { ...alert, enabled } : alert
    ));
  };

  const updateScheduleSettings = (field: string, value: any) => {
    setScheduleSettings(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'object' 
        ? { ...prev[field], ...value }
        : value
    }));
  };

  const getChannelStatus = (channel: NotificationChannel) => {
    if (!channel.enabled) {
      return <Badge variant="outline">Disabled</Badge>;
    }
    
    switch (channel.id) {
      case "email":
        return channel.config.verified ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Unverified
          </Badge>
        );
      case "webpush":
        return channel.config.permission === "granted" ? (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enabled
          </Badge>
        ) : (
          <Badge variant="destructive">Permission Denied</Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            Configured
          </Badge>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trading":
        return <TrendingUp className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      case "performance":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getEnabledAlertsCount = () => {
    return alertTypes.filter(alert => alert.enabled).length;
  };

  const getEnabledChannelsCount = () => {
    return channels.filter(channel => channel.enabled).length;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-medium">Notification Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure how you receive alerts and updates from Edgerunner OS
            </p>
          </div>
          
          {/* Global Status */}
          <div className="text-right">
            <div className="text-sm font-medium">{getEnabledChannelsCount()}/{channels.length} Channels Active</div>
            <div className="text-xs text-muted-foreground">
              {getEnabledAlertsCount()}/{alertTypes.length} alert types enabled
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.map(channel => (
              <Card key={channel.id} className="overflow-hidden">
                <Collapsible 
                  open={expandedChannels.has(channel.id)} 
                  onOpenChange={() => toggleChannelExpansion(channel.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            {channel.icon}
                          </div>
                          <div>
                            <div className="font-medium">{channel.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              {getChannelStatus(channel)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={channel.enabled}
                            onCheckedChange={(checked) => {
                              updateChannelEnabled(channel.id, checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {expandedChannels.has(channel.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {/* Email Configuration */}
                      {channel.id === "email" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={channel.config.address as string}
                              onChange={(e) => updateChannelConfig(channel.id, "address", e.target.value)}
                              disabled={!channel.enabled}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              disabled={!channel.enabled}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <TestTube className="h-4 w-4 mr-2" />
                              Send Test Email
                            </Button>
                            {!channel.config.verified && (
                              <Button variant="outline" size="sm" disabled={!channel.enabled}>
                                Verify Email
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Telegram Configuration */}
                      {channel.id === "telegram" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Telegram Handle</Label>
                              <Input
                                placeholder="@your_handle"
                                value={channel.config.handle as string}
                                onChange={(e) => updateChannelConfig(channel.id, "handle", e.target.value)}
                                disabled={!channel.enabled}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Chat ID</Label>
                              <Input
                                placeholder="123456789"
                                value={channel.config.chatId as string}
                                onChange={(e) => updateChannelConfig(channel.id, "chatId", e.target.value)}
                                disabled={!channel.enabled}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Bot Token</Label>
                            <Input
                              type="password"
                              placeholder="Your Telegram Bot Token"
                              value={channel.config.botToken as string}
                              onChange={(e) => updateChannelConfig(channel.id, "botToken", e.target.value)}
                              disabled={!channel.enabled}
                            />
                          </div>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Create a bot with @BotFather on Telegram to get your bot token. 
                              Use /start with your bot to get your Chat ID.
                            </AlertDescription>
                          </Alert>
                          <Button 
                            size="sm" 
                            disabled={!channel.enabled}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            Send Test Message
                          </Button>
                        </div>
                      )}

                      {/* Discord Configuration */}
                      {channel.id === "discord" && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Webhook URL</Label>
                            <Input
                              type="url"
                              placeholder="https://discord.com/api/webhooks/..."
                              value={channel.config.webhookUrl as string}
                              onChange={(e) => updateChannelConfig(channel.id, "webhookUrl", e.target.value)}
                              disabled={!channel.enabled}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bot Username</Label>
                            <Input
                              placeholder="Edgerunner Bot"
                              value={channel.config.username as string}
                              onChange={(e) => updateChannelConfig(channel.id, "username", e.target.value)}
                              disabled={!channel.enabled}
                            />
                          </div>
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Create a webhook in your Discord server settings under Integrations → Webhooks.
                            </AlertDescription>
                          </Alert>
                          <Button 
                            size="sm" 
                            disabled={!channel.enabled}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            Send Test Message
                          </Button>
                        </div>
                      )}

                      {/* Web Push Configuration */}
                      {channel.id === "webpush" && (
                        <div className="space-y-4">
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Web push notifications appear as browser notifications on your device. 
                              Make sure to allow notifications when prompted.
                            </AlertDescription>
                          </Alert>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              disabled={!channel.enabled}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <TestTube className="h-4 w-4 mr-2" />
                              Send Test Notification
                            </Button>
                            {channel.config.permission !== "granted" && (
                              <Button variant="outline" size="sm" disabled={!channel.enabled}>
                                Request Permission
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Alert Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {["trading", "system", "performance"].map(category => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h4 className="font-medium capitalize">{category} Alerts</h4>
                  </div>
                  <div className="space-y-3 ml-6">
                    {alertTypes
                      .filter(alert => alert.category === category)
                      .map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={alert.id}
                              checked={alert.enabled}
                              onCheckedChange={(checked) => updateAlertType(alert.id, checked as boolean)}
                            />
                            <div className="flex items-center gap-2">
                              {alert.icon}
                              <div>
                                <Label htmlFor={alert.id} className="cursor-pointer">
                                  {alert.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  {alert.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{alert.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alert Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Alert Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Window */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notification Time Window</h4>
                  <p className="text-sm text-muted-foreground">
                    Only receive notifications during these hours
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.timeWindow.enabled}
                  onCheckedChange={(checked) => 
                    updateScheduleSettings("timeWindow", { enabled: checked })
                  }
                />
              </div>
              
              {scheduleSettings.timeWindow.enabled && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ml-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={scheduleSettings.timeWindow.start}
                      onChange={(e) => 
                        updateScheduleSettings("timeWindow", { start: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={scheduleSettings.timeWindow.end}
                      onChange={(e) => 
                        updateScheduleSettings("timeWindow", { end: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={scheduleSettings.timezone} 
                      onValueChange={(value) => updateScheduleSettings("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Daily Digest */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Daily Digest</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive one summary email at the end of each trading day instead of individual alerts
                  </p>
                </div>
                <Switch
                  checked={scheduleSettings.dailyDigest.enabled}
                  onCheckedChange={(checked) => 
                    updateScheduleSettings("dailyDigest", { enabled: checked })
                  }
                />
              </div>
              
              {scheduleSettings.dailyDigest.enabled && (
                <div className="ml-4">
                  <div className="space-y-2 max-w-xs">
                    <Label>Digest Time</Label>
                    <Input
                      type="time"
                      value={scheduleSettings.dailyDigest.time}
                      onChange={(e) => 
                        updateScheduleSettings("dailyDigest", { time: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Daily summary will be sent at this time ({scheduleSettings.timezone})
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Current Schedule:</strong> {
                  scheduleSettings.timeWindow.enabled 
                    ? `Notifications from ${scheduleSettings.timeWindow.start} to ${scheduleSettings.timeWindow.end}`
                    : "All-day notifications"
                }
                {scheduleSettings.dailyDigest.enabled && 
                  ` • Daily digest at ${scheduleSettings.dailyDigest.time}`
                }
              </p>
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}