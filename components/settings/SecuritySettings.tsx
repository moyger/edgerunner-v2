import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { 
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  QrCode,
  Download,
  Copy,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  MapPin,
  RefreshCw,
  Zap,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface APIKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  created: string;
  lastUsed: string;
}

interface LoginHistory {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  timestamp: string;
  status: "success" | "failed";
}

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
    lastUpdated: "December 15, 2023"
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "key_1",
      name: "Primary Trading Key",
      keyPreview: "pk_live_1A2B3C4D5E...XYZ",
      permissions: ["read", "write", "trade"],
      created: "2023-11-15",
      lastUsed: "2 hours ago"
    },
    {
      id: "key_2",
      name: "Analytics Dashboard",
      keyPreview: "pk_live_9Z8Y7X6W5V...ABC",
      permissions: ["read"],
      created: "2023-10-22",
      lastUsed: "1 day ago"
    }
  ]);

  const [loginHistory] = useState<LoginHistory[]>([
    {
      id: "1",
      device: "MacBook Pro",
      browser: "Chrome 120",
      ip: "192.168.1.105",
      location: "San Francisco, CA",
      timestamp: "2024-01-15 14:32:15",
      status: "success"
    },
    {
      id: "2",
      device: "iPhone 15",
      browser: "Safari Mobile",
      ip: "192.168.1.107",
      location: "San Francisco, CA",
      timestamp: "2024-01-15 09:15:22",
      status: "success"
    },
    {
      id: "3",
      device: "Unknown Device",
      browser: "Chrome 119",
      ip: "203.0.113.15",
      location: "New York, NY",
      timestamp: "2024-01-14 22:45:33",
      status: "failed"
    }
  ]);

  const backupCodes = [
    "A1B2C3D4E5F6",
    "G7H8I9J0K1L2",
    "M3N4O5P6Q7R8",
    "S9T0U1V2W3X4",
    "Y5Z6A7B8C9D0",
    "E1F2G3H4I5J6",
    "K7L8M9N0O1P2",
    "Q3R4S5T6U7V8"
  ];

  const updatePasswordField = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    return Math.min(100, strength);
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 25) return { label: "Weak", color: "text-red-600" };
    if (strength < 50) return { label: "Fair", color: "text-yellow-600" };
    if (strength < 75) return { label: "Good", color: "text-blue-600" };
    return { label: "Strong", color: "text-green-600" };
  };

  const revokeApiKey = (keyId: string) => {
    setApiKeys(keys => keys.filter(key => key.id !== keyId));
  };

  const revokeAllKeys = () => {
    setApiKeys([]);
  };

  const getPermissionBadge = (permission: string) => {
    const colors = {
      read: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800",
      write: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800",
      trade: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800"
    };
    
    return (
      <Badge className={colors[permission as keyof typeof colors] || "bg-gray-100"}>
        {permission}
      </Badge>
    );
  };

  const passwordStrength = getPasswordStrength(passwordData.new);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-medium">Security Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account security, authentication, and access controls
          </p>
        </div>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) => updatePasswordField("current", e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) => updatePasswordField("new", e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {passwordData.new && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Password strength:</span>
                        <span className={strengthInfo.color}>{strengthInfo.label}</span>
                      </div>
                      <Progress value={passwordStrength} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) => updatePasswordField("confirm", e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Password Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`h-3 w-3 ${passwordData.new.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                      At least 8 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`h-3 w-3 ${/[a-z]/.test(passwordData.new) && /[A-Z]/.test(passwordData.new) ? 'text-green-600' : 'text-gray-400'}`} />
                      Upper and lowercase letters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`h-3 w-3 ${/[0-9]/.test(passwordData.new) ? 'text-green-600' : 'text-gray-400'}`} />
                      At least one number
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className={`h-3 w-3 ${/[^A-Za-z0-9]/.test(passwordData.new) ? 'text-green-600' : 'text-gray-400'}`} />
                      Special character
                    </li>
                  </ul>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Last updated: {passwordData.lastUpdated}</p>
                </div>
              </div>
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!passwordData.current || !passwordData.new || !passwordData.confirm || passwordData.new !== passwordData.confirm}
            >
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable 2FA Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>

            {twoFactorEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-blue-600">
                <div className="space-y-3">
                  <Label>Authentication Method</Label>
                  <Select value={twoFactorMethod} onValueChange={setTwoFactorMethod}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="authenticator">Authenticator App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {twoFactorMethod === "authenticator" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-white border rounded-lg">
                        <QrCode className="h-32 w-32" />
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">Setup Instructions</h5>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Install Google Authenticator or similar app</li>
                          <li>Scan the QR code with your app</li>
                          <li>Enter the 6-digit code below</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-2 max-w-xs">
                      <Label>Verification Code</Label>
                      <Input
                        placeholder="000000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                    </div>

                    <Button variant="outline" className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Verify & Enable
                    </Button>
                  </div>
                )}

                {twoFactorMethod === "email" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Verification codes will be sent to alex.chen@email.com
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Backup Codes</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? "Hide" : "Show"} Codes
                    </Button>
                  </div>
                  
                  {showBackupCodes && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-muted/50 rounded-lg font-mono text-sm">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="p-2 bg-background rounded text-center">
                            {code}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All
                        </Button>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Store these codes safely. Each code can only be used once.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API Keys
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
                {apiKeys.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revoke All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke All API Keys?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will immediately revoke all API keys and cannot be undone. 
                          Any applications using these keys will lose access.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={revokeAllKeys}
                        >
                          Revoke All Keys
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys.length > 0 ? (
              <div className="space-y-4">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{key.name}</h5>
                        <div className="flex gap-1">
                          {key.permissions.map(permission => (
                            <span key={permission}>
                              {getPermissionBadge(permission)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="font-mono">{key.keyPreview}</div>
                        <div className="flex items-center gap-4">
                          <span>Created: {key.created}</span>
                          <span>Last used: {key.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently revoke the "{key.name}" API key. 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => revokeApiKey(key.id)}
                            >
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No API keys created yet</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First API Key
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Login History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map(login => (
                  <TableRow key={login.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{login.device}</div>
                          <div className="text-sm text-muted-foreground">{login.browser}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {login.location}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{login.ip}</TableCell>
                    <TableCell className="text-sm">{login.timestamp}</TableCell>
                    <TableCell>
                      {login.status === "success" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}