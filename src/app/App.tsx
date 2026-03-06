import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { CartProvider } from "../components/cart/CartContext";

function App() {
  return (
    <CartProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </CartProvider>
  );
}

export default App;
