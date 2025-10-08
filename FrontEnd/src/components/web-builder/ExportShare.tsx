import { useState } from "react";
import {
  Download,
  Share2,
  Mail,
  Link,
  FileImage,
  FileText,
  Users,
  Lock,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { FilterConfig } from "../WebBuilder";
import { toast } from "sonner@2.0.3";
import html2canvas from "html2canvas-pro";
import {ChartConfig} from "../../services/api";
import jsPDF from "jspdf";

interface ExportShareProps {
  charts: ChartConfig[];
  filters: FilterConfig[];
}

interface SharedDashboard {
  id: string;
  name: string;
  createdAt: Date;
  sharedWith: string[];
  permissions: "view" | "edit";
  isPublic: boolean;
  views: number;
}

export function ExportShare({ charts, filters }: ExportShareProps) {
  const [exportFormat, setExportFormat] = useState<
    "pdf" | "png" | "excel" | "json"
  >("pdf");
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [isPublicDashboard, setIsPublicDashboard] = useState(false);
  const [dashboardName, setDashboardName] = useState("My Dashboard");

  const [sharedDashboards] = useState<SharedDashboard[]>([
    {
      id: "1",
      name: "Q3 Performance Review",
      createdAt: new Date("2024-03-15"),
      sharedWith: ["team@company.com", "manager@company.com"],
      permissions: "view",
      isPublic: false,
      views: 45,
    },
    {
      id: "2",
      name: "Marketing Analytics",
      createdAt: new Date("2024-03-10"),
      sharedWith: ["marketing@company.com"],
      permissions: "edit",
      isPublic: true,
      views: 128,
    },
  ]);

  // ---------------------------
  //  Main Export Function
  // ---------------------------
  const handleExport = async (format: typeof exportFormat) => {
    if (charts.length === 0) {
      toast.error("No charts to export");
      return;
    }

    if (format === "pdf") {
  try {
    toast.info("Capturing dashboard — please wait...");

    const dashboardElement = document.querySelector("#dashboard-preview") as HTMLElement;
    if (!dashboardElement) {
      toast.error("Dashboard preview not found!");
      return;
    }

    // Allow reflow if hidden
    await new Promise((res) => setTimeout(res, 800));

    const rect = dashboardElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      toast.error("Dashboard element has no visible size!");
      return;
    }

    const canvas = await html2canvas(dashboardElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 0,
      windowWidth: dashboardElement.scrollWidth,
      windowHeight: dashboardElement.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.setFontSize(12);
    pdf.text(`Dashboard: ${dashboardName}`, 20, canvas.height - 30);
    pdf.text(`Exported on: ${new Date().toLocaleString()}`, 20, canvas.height - 15);

    pdf.save(`${dashboardName}.pdf`);
    toast.success("PDF exported successfully!");
    return;
  } catch (error) {
    console.error("Full PDF export error:", error);
    toast.error("Failed to export PDF — check console for details");
    return;
  }
}


    // Fallbacks for JSON / Excel / PNG
    toast.success("Starting export...");

    setTimeout(() => {
      const filename = `dashboard_export.${format}`;
      let content: string;
      let mimeType: string;

      switch (format) {
        case "json":
          content = JSON.stringify(
            {
              charts,
              filters,
              metadata: {
                name: dashboardName,
                exportedAt: new Date(),
              },
            },
            null,
            2
          );
          mimeType = "application/json";
          break;
        case "excel":
          content =
            "Dashboard,Charts,Filters\n" +
            charts.map((c) => `${c.title},${c.type},${c.data.length} rows`).join("\n");
          mimeType = "text/csv";
          break;
        case "png":
          toast.info("Capturing dashboard as PNG...");
          html2canvas(document.querySelector("#dashboard-preview") as HTMLElement, {
            scale: 2,
          }).then((canvas) => {
            const img = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = img;
            link.download = `${dashboardName}.png`;
            link.click();
            toast.success("Dashboard exported as PNG");
          });
          return;
        default:
          content = `Dashboard Export - ${dashboardName}\nGenerated on: ${new Date().toLocaleString()}\nCharts: ${charts.length}\nFilters: ${filters.length}`;
          mimeType = "text/plain";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Dashboard exported as ${format.toUpperCase()}`);
    }, 1500);
  };

  // ---------------------------
  // 📤 Share + Link functions
  // ---------------------------
  const handleShare = () => {
    if (!shareEmail) {
      toast.error("Please enter an email address");
      return;
    }
    toast.success(`Dashboard shared with ${shareEmail}`);
    setShareEmail("");
    setShareMessage("");
  };

  const generateShareLink = () => {
    const shareUrl = `https://dataviz-pro.com/dashboard/${dashboardName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard");
  };

  const exportOptions = [
    {
      value: "pdf",
      label: "PDF Document",
      icon: FileText,
      description: "High-quality PDF with all charts and layout",
    },
    {
      value: "png",
      label: "PNG Image",
      icon: FileImage,
      description: "Full dashboard as an image",
    },
    {
      value: "excel",
      label: "Excel Workbook",
      icon: FileText,
      description: "Data tables and charts",
    },
    {
      value: "json",
      label: "JSON Data",
      icon: FileText,
      description: "Raw data and configuration",
    },
  ];

  // ---------------------------
  // 💻 Render UI
  // ---------------------------
  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Export & Share</h2>
        <p className="text-muted-foreground">
          Export your dashboards or share them with your team
        </p>
      </div>

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList>
          <TabsTrigger value="export">Export Dashboard</TabsTrigger>
          <TabsTrigger value="share">Share with Team</TabsTrigger>
          <TabsTrigger value="public">Public Sharing</TabsTrigger>
          <TabsTrigger value="manage">Manage Shared</TabsTrigger>
        </TabsList>

        {/* -------------------- EXPORT TAB -------------------- */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Dashboard
              </CardTitle>
              <CardDescription>
                Download your dashboard in various formats for offline use or
                presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dashboard-name">Dashboard Name</Label>
                <Input
                  id="dashboard-name"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="Enter dashboard name"
                />
              </div>

              <div className="space-y-4">
                <Label>Export Format</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exportOptions.map((option) => (
                    <Card
                      key={option.value}
                      className={`cursor-pointer transition-colors ${
                        exportFormat === option.value
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() =>
                        setExportFormat(option.value as typeof exportFormat)
                      }
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <option.icon className="h-5 w-5 mt-0.5" />
                          <div>
                            <h4 className="font-medium">{option.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Export Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {charts.length} charts • {filters.length} filters •{" "}
                    {exportFormat.toUpperCase()} format
                  </p>
                </div>
                <Button
                  onClick={() => handleExport(exportFormat)}
                  disabled={charts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- SHARE TAB -------------------- */}
        <TabsContent value="share" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Share with Team
              </CardTitle>
              <CardDescription>
                Invite team members to view or collaborate on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="share-email">Email Address</Label>
                <Input
                  id="share-email"
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-permissions">Permissions</Label>
                <Select defaultValue="view">
                  <SelectTrigger id="share-permissions">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">View & Edit</SelectItem>
                    <SelectItem value="admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-message">Message (Optional)</Label>
                <Textarea
                  id="share-message"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleShare} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
                <Button variant="outline" onClick={generateShareLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- PUBLIC SHARE TAB -------------------- */}
        <TabsContent value="public" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Public Sharing
              </CardTitle>
              <CardDescription>
                Make your dashboard publicly accessible with a shareable link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Public Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this dashboard
                  </p>
                </div>
                <Switch
                  checked={isPublicDashboard}
                  onCheckedChange={setIsPublicDashboard}
                />
              </div>

              {isPublicDashboard && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Security Settings</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Password Protection</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Download Restrictions</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Expiration Date</span>
                      <Switch />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Public URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`https://dataviz-pro.com/public/${dashboardName
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        readOnly
                      />
                      <Button variant="outline" onClick={generateShareLink}>
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* -------------------- MANAGE TAB -------------------- */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shared Dashboards</CardTitle>
              <CardDescription>
                Manage your shared dashboards and view collaboration activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sharedDashboards.map((dashboard) => (
                  <div key={dashboard.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{dashboard.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Shared on {dashboard.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            dashboard.isPublic ? "default" : "secondary"
                          }
                        >
                          {dashboard.isPublic ? "Public" : "Private"}
                        </Badge>
                        <Badge variant="outline">
                          {dashboard.views} views
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Shared with {dashboard.sharedWith.length} people
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {dashboard.permissions}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dashboard.sharedWith.slice(0, 3).map((email, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 bg-muted px-2 py-1 rounded"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{email}</span>
                          </div>
                        ))}
                        {dashboard.sharedWith.length > 3 && (
                          <div className="bg-muted px-2 py-1 rounded text-xs">
                            +{dashboard.sharedWith.length - 3} more
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          Manage Access
                        </Button>
                        <Button variant="outline" size="sm">
                          Copy Link
                        </Button>
                        <Button variant="outline" size="sm">
                          View Activity
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
