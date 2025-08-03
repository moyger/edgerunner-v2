import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { Separator } from "../../../../components/ui/separator";
import { Progress } from "../../../../components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../components/ui/alert-dialog";
import { 
  User,
  Mail,
  KeyRound,
  CreditCard,
  Calendar,
  Building,
  BarChart3,
  Trash2,
  ExternalLink,
  Upload,
  Crown,
  Shield,
  Monitor,
  MapPin,
  AlertTriangle,
  FileText,
  HelpCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../components/ui/tooltip";

export function AccountSettings() {
  const [profileData, setProfileData] = useState({
    fullName: "Alex Chen",
    username: "alexchen_trader",
    email: "alex.chen@email.com",
    avatar: ""
  });

  const [subscriptionData] = useState({
    plan: "Pro",
    nextBilling: "March 15, 2024",
    paymentMethod: "•••• •••• •••• 4242",
    cardType: "Visa",
    amount: "$49/month"
  });

  const [workspaceData] = useState({
    accountType: "Individual",
    workspaceName: "Alex's Trading Workspace",
    apiUsage: {
      backtests: 127,
      trades: 1543,
      limit: 5000
    },
    lastLogin: {
      time: "2 hours ago",
      device: "MacBook Pro - Chrome",
      location: "San Francisco, CA"
    }
  });

  const updateProfile = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const getUsagePercentage = () => {
    return ((workspaceData.apiUsage.backtests + workspaceData.apiUsage.trades) / workspaceData.apiUsage.limit) * 100;
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "Free":
        return <Badge variant="outline">Free</Badge>;
      case "Pro":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        );
      case "Institutional":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800">
            <Building className="h-3 w-3 mr-1" />
            Institutional
          </Badge>
        );
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-medium">Account Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your profile, subscription, and workspace preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-lg bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                    {profileData.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => updateProfile("fullName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      value={profileData.username}
                      readOnly
                      className="bg-muted/50"
                    />
                    <Tooltip>
                      <TooltipTrigger className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Username cannot be changed</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                  />
                </div>

                <Button variant="outline" className="w-full">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              <Separator />

              {/* Last Login Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Security Information</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    <span>Last login: {workspaceData.lastLogin.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{workspaceData.lastLogin.location}</span>
                  </div>
                  <div className="text-xs">
                    Device: {workspaceData.lastLogin.device}
                  </div>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Save Profile Changes
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Current Plan</span>
                    {getPlanBadge(subscriptionData.plan)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.amount}
                  </p>
                </div>
                <Button variant="outline">
                  Manage Plan
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next billing date</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{subscriptionData.nextBilling}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment method</span>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span>{subscriptionData.cardType} {subscriptionData.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoices & Receipts
                </Button>
                
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>

                <Button variant="outline" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Billing Help
                </Button>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your subscription is active and up to date. Next charge: {subscriptionData.amount} on {subscriptionData.nextBilling}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workspace Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Workspace Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      {workspaceData.accountType}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Contact support to upgrade to Team</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspaceName">Workspace Name</Label>
                  <Input
                    id="workspaceName"
                    value={workspaceData.workspaceName}
                    readOnly
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    API Usage This Month
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Total API Calls</span>
                      <span>{(workspaceData.apiUsage.backtests + workspaceData.apiUsage.trades).toLocaleString()}</span>
                    </div>
                    
                    <Progress value={getUsagePercentage()} className="h-2" />
                    
                    <div className="text-xs text-muted-foreground">
                      {(workspaceData.apiUsage.backtests + workspaceData.apiUsage.trades).toLocaleString()} of {workspaceData.apiUsage.limit.toLocaleString()} calls used
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">Backtests</div>
                        <div className="text-muted-foreground">{workspaceData.apiUsage.backtests}</div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <div className="font-medium">Trades</div>
                        <div className="text-muted-foreground">{workspaceData.apiUsage.trades}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h4>
              
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Delete Account</h5>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>This action cannot be undone. This will permanently delete your account and remove your data from our servers.</p>
                          <p className="font-medium">This will delete:</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            <li>All your trading strategies and configurations</li>
                            <li>Complete trading history and analytics</li>
                            <li>Backtest results and performance data</li>
                            <li>Account settings and preferences</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}