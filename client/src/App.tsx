import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "@/pages/Home";
import Quote from "@/pages/Quote";
import QuoteHaulAway from "@/pages/QuoteHaulAway";
import QuoteLabor from "@/pages/QuoteLabor";
import QuoteReview from "@/pages/QuoteReview";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
        <Route path="/" component={Home} />
      <Route path="/quote" component={Quote} />
      <Route path="/quote/haul-away" component={QuoteHaulAway} />
      <Route path="/quote/labor" component={QuoteLabor} />
      <Route path="/quote/review" component={QuoteReview} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
