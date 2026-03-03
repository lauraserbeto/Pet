import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./components/ThemeProvider";

function AppContent() {
  const { theme } = useTheme();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton theme={theme} />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;