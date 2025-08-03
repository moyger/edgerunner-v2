import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { BrokerIntegration } from "./BrokerIntegration"; // Now fixed - infinite loop resolved
import { BrokerIntegrationFixed } from "./BrokerIntegrationFixed";
import { AccountSettings } from "./AccountSettings";
import { NotificationSettings } from "./NotificationSettings";
import { SecuritySettings } from "./SecuritySettings";
import { GeneralSettings } from "./GeneralSettings";
import { IBKRDebugTest } from "../../debug/IBKRDebugTest";
import { 
  Settings as SettingsIcon,
  Link,
  Bell,
  Shield,
  User,
  Bug
} from "lucide-react";

export function Settings() {
  const [activeTab, setActiveTab] = useState("brokers");

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Debug</span>
            </TabsTrigger>
            <TabsTrigger value="brokers-fixed" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Brokers Fixed</span>
              <span className="sm:hidden">Fixed</span>
            </TabsTrigger>
            <TabsTrigger value="brokers" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Brokers Original</span>
              <span className="sm:hidden">Original</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="debug" className="space-y-6">
            <IBKRDebugTest />
          </TabsContent>

          <TabsContent value="brokers-fixed" className="space-y-6">
            <BrokerIntegrationFixed />
          </TabsContent>

          <TabsContent value="brokers" className="space-y-6">
            <BrokerIntegration />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <GeneralSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}