import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "@/pages/Landing";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import LearnMode from "@/pages/LearnMode";
import TestMode from "@/pages/TestMode";
import Tutorials from "@/pages/Tutorials";
import DeveloperMode from "@/pages/DeveloperMode";
import Progress from "@/pages/Progress";
import SettingsPage from "@/pages/Settings";
import SavedQueries from "@/pages/SavedQueries";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/learn" element={<LearnMode />} />
            <Route path="/test" element={<TestMode />} />
            <Route path="/developer" element={<DeveloperMode />} />
            <Route path="/tutorials" element={<Tutorials />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/saved-queries" element={<SavedQueries />} />
            <Route path="/settings" element={<SettingsPage />} />

          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
