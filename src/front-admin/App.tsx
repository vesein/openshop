import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "sonner";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { OrderList } from "./pages/OrderList";
import { OrderDetail } from "./pages/OrderDetail";
import { ProductList } from "./pages/ProductList";
import { ProductDetail } from "./pages/ProductDetail";
import { InventoryList } from "./pages/InventoryList";
import { CollectionList } from "./pages/CollectionList";
import { CollectionDetail } from "./pages/CollectionDetail";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetail } from "./pages/CustomerDetail";
import { PromotionList } from "./pages/PromotionList";
import { PromotionDetail } from "./pages/PromotionDetail";
import { PageList } from "./pages/PageList";
import { PageDetail } from "./pages/PageDetail";
import { MenuList } from "./pages/MenuList";
import { MenuDetail } from "./pages/MenuDetail";
import { MediaLibrary } from "./pages/MediaLibrary";
import { MetafieldDefinitions } from "./pages/MetafieldDefinitions";
import { Settings } from "./pages/Settings";
import "./App.css";

export function App() {
  return (
    <Router hook={useHashLocation}>
      <AppShell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/orders" component={OrderList} />
          <Route path="/orders/:id" component={OrderDetail} />
          <Route path="/products" component={ProductList} />
          <Route path="/products/:id" component={ProductDetail} />
          <Route path="/inventory" component={InventoryList} />
          <Route path="/collections" component={CollectionList} />
          <Route path="/collections/:id" component={CollectionDetail} />
          <Route path="/customers" component={CustomerList} />
          <Route path="/customers/:id" component={CustomerDetail} />
          <Route path="/promotions" component={PromotionList} />
          <Route path="/promotions/:id" component={PromotionDetail} />
          <Route path="/pages" component={PageList} />
          <Route path="/pages/:id" component={PageDetail} />
          <Route path="/menus" component={MenuList} />
          <Route path="/menus/:id" component={MenuDetail} />
          <Route path="/media" component={MediaLibrary} />
          <Route path="/metafields" component={MetafieldDefinitions} />
          <Route path="/settings" component={Settings} />
          <Route>
            <div className="text-center py-20 text-muted-foreground">Page not found.</div>
          </Route>
        </Switch>
      </AppShell>
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;
