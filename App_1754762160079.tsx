import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import HomePage from "@/pages/HomePage";
import SlotsPage from "@/pages/SlotsPage";
import BlackjackPage from "@/pages/BlackjackPage";
import RoulettePage from "@/pages/RoulettePage";
import WalletPage from "@/pages/WalletPage";
import HistoryPage from "@/pages/HistoryPage";
import Header from "@/components/Header";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="casino-theme">
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Router>
              <Route path="/" component={HomePage} />
              <Route path="/slots" component={SlotsPage} />
              <Route path="/blackjack" component={BlackjackPage} />
              <Route path="/roulette" component={RoulettePage} />
              <Route path="/wallet" component={WalletPage} />
              <Route path="/history" component={HistoryPage} />
            </Router>
          </main>
          <Toaster />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;