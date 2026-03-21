import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  FileText,
  Menu,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "仪表盘", icon: LayoutDashboard },
  { id: "products", label: "商品管理", icon: Package },
  { id: "orders", label: "订单管理", icon: ShoppingCart },
  { id: "customers", label: "客户管理", icon: Users },
  { id: "promotions", label: "促销活动", icon: Tag },
  { id: "pages", label: "内容管理", icon: FileText },
  { id: "settings", label: "系统设置", icon: Settings },
];

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

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
          const isActive = activeItem === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start ${collapsed ? "px-2" : "px-3"}`}
              onClick={() => onItemClick(item.id)}
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
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function Layout({ children, activeItem, onItemClick }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemClick={onItemClick} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}