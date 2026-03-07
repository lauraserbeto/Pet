import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { CartProvider } from "../components/cart/CartContext";

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster 
        position="bottom-right"
        richColors 
        closeButton
        toastOptions={{
          style: {
            borderRadius: '12px',
            padding: '16px',
          },
        }}
      />
    </CartProvider>
  );
}

export default App;
