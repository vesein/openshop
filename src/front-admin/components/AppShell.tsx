import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, FolderTree,
  Users, Percent, FileText, Menu as MenuIcon, Image, Database,
  Settings, Search, Bell, ChevronDown, ChevronRight, LogOut,
} from "lucide-react";
import { mockSettings } from "../mock/data";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Orders", icon: ShoppingCart, href: "/orders" },
  { label: "Products", icon: Package, href: "/products" },
  { label: "Inventory", icon: Warehouse, href: "/inventory" },
  { label: "Collections", icon: FolderTree, href: "/collections" },
  { label: "Customers", icon: Users, href: "/customers" },
  { label: "Promotions", icon: Percent, href: "/promotions" },
  {
    label: "Content",
    icon: FileText,
    children: [
      { label: "Pages", icon: FileText, href: "/pages" },
      { label: "Menus", icon: MenuIcon, href: "/menus" },
    ],
  },
  { label: "Media", icon: Image, href: "/media" },
  { label: "Metafields", icon: Database, href: "/metafields" },
  { label: "Settings", icon: Settings, href: "/settings" },
] as const;

function SideNav() {
  const [location] = useLocation();
  const [contentOpen, setContentOpen] = useState(
    location.startsWith("/pages") || location.startsWith("/menus"),
  );

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col h-full overflow-y-auto">
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          if ("children" in item) {
            const childActive = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => setContentOpen(!contentOpen)}
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-sidebar-accent ${
                    childActive ? "text-sidebar-primary font-medium" : ""
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                  {contentOpen ? (
                    <ChevronDown className="size-3 ml-auto" />
                  ) : (
                    <ChevronRight className="size-3 ml-auto" />
                  )}
                </button>
                {contentOpen && (
                  <div className="ml-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-sidebar-accent rounded-md ${
                          isActive(child.href)
                            ? "bg-sidebar-accent text-sidebar-primary font-medium"
                            : ""
                        }`}
                      >
                        <child.icon className="size-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-sidebar-accent ${
                isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : ""
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const [showUser, setShowUser] = useState(false);
  return (
    <header className="h-14 border-b bg-background flex items-center px-4 gap-4 shrink-0">
      <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
        <Package className="size-6 text-primary" />
        <span>{mockSettings.shopName}</span>
      </Link>
      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-9 h-8" />
      </div>
      <Button variant="ghost" size="icon">
        <Bell className="size-4" />
      </Button>
      <div className="relative">
        <Button variant="ghost" size="icon" onClick={() => setShowUser(!showUser)}>
          <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            A
          </div>
        </Button>
        {showUser && (
          <div className="absolute right-0 top-full mt-1 w-40 border rounded-md bg-popover shadow-md py-1 z-50">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setShowUser(false)}
            >
              <Settings className="size-4" /> Settings
            </Link>
            <button className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left">
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
