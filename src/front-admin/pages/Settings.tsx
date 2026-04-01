import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { mockSettings } from "../mock/data";
import { toast } from "sonner";

export function Settings() {
  const [shopName, setShopName] = useState(mockSettings.shopName);
  const [description, setDescription] = useState(mockSettings.shopDescription);
  const [email, setEmail] = useState(mockSettings.supportEmail);
  const [currency, setCurrency] = useState(mockSettings.currencyCode);
  const [locale, setLocale] = useState(mockSettings.locale);
  const [timezone, setTimezone] = useState(mockSettings.timezone);
  const [weightUnit, setWeightUnit] = useState(mockSettings.weightUnit);
  const [orderPrefix, setOrderPrefix] = useState(mockSettings.orderPrefix);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={() => toast.success("Settings saved")}>Save</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Shop Name</Label><Input value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
          <div><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>Contact Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Locale & Units</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Default Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Locale</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh-CN">zh-CN</SelectItem>
                  <SelectItem value="en-US">en-US</SelectItem>
                  <SelectItem value="ja-JP">ja-JP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order Settings</CardTitle></CardHeader>
        <CardContent>
          <div><Label>Order Number Prefix</Label><Input value={orderPrefix} onChange={(e) => setOrderPrefix(e.target.value)} placeholder="ORD-" /></div>
        </CardContent>
      </Card>
    </div>
  );
}
