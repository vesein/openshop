import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "sonner";
import { Layout } from "@/components/layout";
import { DashboardPage } from "@/components/pages/dashboard";
import { ProductsPage } from "@/components/pages/products";
import { ProductDetailPage } from "@/components/pages/product-detail";
import { OrdersPage } from "@/components/pages/orders";
import { OrderDetailPage } from "@/components/pages/order-detail";
import { CustomersPage } from "@/components/pages/customers";
import { CustomerDetailPage } from "@/components/pages/customer-detail";
import { CollectionsPage } from "@/components/pages/collections";
import { PromotionsPage } from "@/components/pages/promotions";
import { MediaPage } from "@/components/pages/media";
import { PagesPage } from "@/components/pages/pages";
import { SettingsPage } from "@/components/pages/settings";
import "./index.css";

export function App() {
  return (
    <Router hook={useHashLocation}>
      <Layout>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/products/:id" component={ProductDetailPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/orders/:id" component={OrderDetailPage} />
          <Route path="/customers" component={CustomersPage} />
          <Route path="/customers/:id" component={CustomerDetailPage} />
          <Route path="/collections" component={CollectionsPage} />
          <Route path="/promotions" component={PromotionsPage} />
          <Route path="/media" component={MediaPage} />
          <Route path="/pages" component={PagesPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route>
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">页面未找到</div>
            </div>
          </Route>
        </Switch>
      </Layout>
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;
