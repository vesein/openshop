import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const menuItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/products", label: "商品管理", icon: Package },
  { href: "/collections", label: "商品集合", icon: FolderOpen },
  { href: "/orders", label: "订单管理", icon: ShoppingCart },
  { href: "/customers", label: "客户管理", icon: Users },
  { href: "/promotions", label: "促销活动", icon: Tag },
  { href: "/media", label: "媒体库", icon: ImageIcon },
  { href: "/pages", label: "内容管理", icon: FileText },
  { href: "/settings", label: "系统设置", icon: Settings },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location, navigate] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  return (
    <div
      className={`flex flex-col h-screen bg-card border-r transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">OpenShop</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Button
              key={item.href}
              variant={active ? "secondary" : "ghost"}
              className={`w-full justify-start ${collapsed ? "px-2" : "px-3"}`}
              onClick={() => navigate(item.href)}
            >
              <Icon size={20} className={collapsed ? "" : "mr-2"} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        {!collapsed && (
          <div className="text-sm text-muted-foreground">
            OpenShop Admin v0.1.0
          </div>
        )}
      </div>
    </div>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
