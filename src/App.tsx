import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/create" element={<CreateQuiz />} />
          <Route path="/dashboard/quizzes" element={<Dashboard />} />
          <Route path="/dashboard/analytics" element={<Dashboard />} />
          <Route path="/dashboard/participants" element={<Dashboard />} />
          <Route path="/dashboard/notifications" element={<Dashboard />} />
          <Route path="/dashboard/settings" element={<Dashboard />} />
          <Route path="/quiz" element={<TakeQuiz />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
