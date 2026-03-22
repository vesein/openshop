import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Store,
  Globe,
  CreditCard,
  Truck,
  Save,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";

interface ShopSettings {
  id: number;
  shopName: string;
  shopDescription: string;
  currencyCode: string;
  locale: string;
  timezone: string;
  supportEmail: string;
  orderPrefix: string;
  weightUnit: string;
  createdAt?: string;
  updatedAt?: string;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    id: 1,
    shopName: "",
    shopDescription: "",
    currencyCode: "USD",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    supportEmail: "",
    orderPrefix: "ORD",
    weightUnit: "kg",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(adminApi.settings);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const response = await fetch(adminApi.settings, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: settings.shopName,
          shopDescription: settings.shopDescription,
          currencyCode: settings.currencyCode,
          locale: settings.locale,
          timezone: settings.timezone,
          supportEmail: settings.supportEmail,
          orderPrefix: settings.orderPrefix,
          weightUnit: settings.weightUnit,
        }),
      });
      if (response.ok) {
        const updated = (await response.json()) as ShopSettings;
        setSettings((prev) => ({ ...prev, ...updated }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ShopSettings, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">系统设置</h2>
          <p className="text-muted-foreground">
            管理您的商店基本设置
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              已保存
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "保存中..." : "保存设置"}
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              <CardTitle>商店信息</CardTitle>
            </div>
            <CardDescription>
              设置您的商店名称和基本描述
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="shopName">商店名称</Label>
              <Input
                id="shopName"
                placeholder="我的商店"
                value={settings.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shopDescription">商店描述</Label>
              <Textarea
                id="shopDescription"
                placeholder="输入商店描述..."
                rows={3}
                value={settings.shopDescription}
                onChange={(e) => handleChange("shopDescription", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supportEmail">客服邮箱</Label>
              <Input
                id="supportEmail"
                type="email"
                placeholder="support@example.com"
                value={settings.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>地区和语言</CardTitle>
            </div>
            <CardDescription>
              设置商店的时区、语言和地区
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">货币</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.currencyCode}
                  onChange={(e) => handleChange("currencyCode", e.target.value)}
                >
                  <option value="CNY">人民币 (CNY)</option>
                  <option value="USD">美元 (USD)</option>
                  <option value="EUR">欧元 (EUR)</option>
                  <option value="GBP">英镑 (GBP)</option>
                  <option value="JPY">日元 (JPY)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">时区</Label>
                <select
                  id="timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                >
                  <option value="Asia/Shanghai">中国标准时间 (UTC+8)</option>
                  <option value="America/New_York">美国东部时间 (UTC-5)</option>
                  <option value="Europe/London">英国时间 (UTC+0)</option>
                  <option value="Asia/Tokyo">日本时间 (UTC+9)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="locale">语言</Label>
                <select
                  id="locale"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.locale}
                  onChange={(e) => handleChange("locale", e.target.value)}
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weightUnit">重量单位</Label>
                <select
                  id="weightUnit"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.weightUnit}
                  onChange={(e) => handleChange("weightUnit", e.target.value)}
                >
                  <option value="kg">千克 (kg)</option>
                  <option value="g">克 (g)</option>
                  <option value="lb">磅 (lb)</option>
                  <option value="oz">盎司 (oz)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>支付设置</CardTitle>
            </div>
            <CardDescription>
              配置支付方式和支付网关
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="orderPrefix">订单前缀</Label>
              <Input
                id="orderPrefix"
                placeholder="ORD"
                value={settings.orderPrefix}
                onChange={(e) => handleChange("orderPrefix", e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                订单号将以此前缀开头，例如 {settings.orderPrefix}-00001
              </p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">支付宝</p>
                <p className="text-sm text-muted-foreground">
                  支持支付宝扫码支付
                </p>
              </div>
              <Button variant="outline">配置</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">微信支付</p>
                <p className="text-sm text-muted-foreground">
                  支持微信扫码支付
                </p>
              </div>
              <Button variant="outline">配置</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <CardTitle>配送设置</CardTitle>
            </div>
            <CardDescription>
              配置配送方式和运费规则
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">标准配送</p>
                <p className="text-sm text-muted-foreground">
                  3-5 个工作日送达
                </p>
              </div>
              <Button variant="outline">配置</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">快速配送</p>
                <p className="text-sm text-muted-foreground">
                  1-2 个工作日送达
                </p>
              </div>
              <Button variant="outline">配置</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}