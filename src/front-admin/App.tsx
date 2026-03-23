import { Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "sonner";
import "./App.css";

export function App() {
  return (
    <Router hook={useHashLocation}>
      hello
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;
