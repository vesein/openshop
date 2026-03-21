import { useState } from "react";
import { Layout } from "@/components/layout";
import { DashboardPage } from "@/components/pages/dashboard";
import { ProductsPage } from "@/components/pages/products";
import { OrdersPage } from "@/components/pages/orders";
import { CustomersPage } from "@/components/pages/customers";
import { PromotionsPage } from "@/components/pages/promotions";
import { PagesPage } from "@/components/pages/pages";
import { SettingsPage } from "@/components/pages/settings";
import "./index.css";

export function App() {
  const [activeItem, setActiveItem] = useState("dashboard");

  const renderPage = () => {
    switch (activeItem) {
      case "dashboard":
        return <DashboardPage />;
      case "products":
        return <ProductsPage />;
      case "orders":
        return <OrdersPage />;
      case "customers":
        return <CustomersPage />;
      case "promotions":
        return <PromotionsPage />;
      case "pages":
        return <PagesPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout activeItem={activeItem} onItemClick={setActiveItem}>
      {renderPage()}
    </Layout>
  );
}

export default App;