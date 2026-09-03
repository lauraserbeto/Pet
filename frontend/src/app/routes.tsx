import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, type RouteObject } from "react-router";

// Shell e guardas ficam EAGER (necessários já no primeiro paint).
import { Layout } from "../components/layout/Layout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { NotFound } from "../pages/NotFound";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { HamsterLoader } from "../components/ui/HamsterLoader";

// Páginas em code splitting (React.lazy) — cada rota vira um chunk sob demanda,
// tirando ~40 páginas do bundle inicial (antes um único chunk de ~2,1 MB).
const LandingPage = lazy(() => import("../pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const StyleGuide = lazy(() => import("../pages/StyleGuide").then((m) => ({ default: m.StyleGuide })));
const HotelsPage = lazy(() => import("../pages/HotelsPage").then((m) => ({ default: m.HotelsPage })));
const HotelDetailsPage = lazy(() => import("../pages/HotelDetailsPage").then((m) => ({ default: m.HotelDetailsPage })));
const WalkersPage = lazy(() => import("../pages/WalkersPage").then((m) => ({ default: m.WalkersPage })));
const WalkerDetailsPage = lazy(() => import("../pages/WalkerDetailsPage").then((m) => ({ default: m.WalkerDetailsPage })));
const StorePage = lazy(() => import("../pages/StorePage").then((m) => ({ default: m.StorePage })));
// Índice do dashboard: despacha por perfil (admin vê o painel da plataforma).
const DashboardHome = lazy(() => import("../pages/dashboard/DashboardHome").then((m) => ({ default: m.DashboardHome })));
const Schedule = lazy(() => import("../pages/dashboard/Schedule").then((m) => ({ default: m.Schedule })));
const Customers = lazy(() => import("../pages/dashboard/Customers").then((m) => ({ default: m.Customers })));
const Products = lazy(() => import("../pages/dashboard/Products").then((m) => ({ default: m.Products })));
const Settings = lazy(() => import("../pages/dashboard/Settings").then((m) => ({ default: m.Settings })));
const Approvals = lazy(() => import("../pages/dashboard/admin/Approvals").then((m) => ({ default: m.Approvals })));
const Users = lazy(() => import("../pages/dashboard/admin/Users").then((m) => ({ default: m.Users })));
const LoginPage = lazy(() => import("../pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const AboutPage = lazy(() => import("../pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const ShoppingPage = lazy(() => import("../pages/ShoppingPage").then((m) => ({ default: m.ShoppingPage })));
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
const TermsPage = lazy(() => import("../pages/TermsPage").then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("../pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const ContactPage = lazy(() => import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })));
const CartPage = lazy(() => import("../pages/CartPage").then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage").then((m) => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import("../pages/CheckoutSuccessPage").then((m) => ({ default: m.CheckoutSuccessPage })));
const Account = lazy(() => import("../pages/dashboard/Account").then((m) => ({ default: m.Account })));
const PublicProfile = lazy(() => import("../pages/dashboard/PublicProfile").then((m) => ({ default: m.PublicProfile })));
const Finance = lazy(() => import("@/pages/dashboard/Finance"));
const Orders = lazy(() => import("@/pages/dashboard/Orders"));
const PetSitterOnboarding = lazy(() => import("../pages/onboarding/PetSitterOnboarding").then((m) => ({ default: m.PetSitterOnboarding })));
const SitterEvaluations = lazy(() => import("@/pages/dashboard/SitterEvaluations").then((m) => ({ default: m.SitterEvaluations })));
const TutorProfile = lazy(() => import("../pages/tutor/TutorProfile").then((m) => ({ default: m.TutorProfile })));
const TutorPets = lazy(() => import("../pages/tutor/TutorPets").then((m) => ({ default: m.TutorPets })));
const TutorAppointments = lazy(() => import("../pages/tutor/TutorAppointments").then((m) => ({ default: m.TutorAppointments })));
const TutorOrders = lazy(() => import("../pages/tutor/TutorOrders").then((m) => ({ default: m.TutorOrders })));
const PartnersPage = lazy(() => import("../pages/PartnersPage").then((m) => ({ default: m.PartnersPage })));

// Fallback exibido enquanto o chunk da rota carrega.
function RouteFallback() {
  return <HamsterLoader />;
}

// Envolve rotas SEM layout (que teria o Suspense no <Outlet/>) numa fronteira própria.
const withSuspense = (node: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{node}</Suspense>
);

const rootRoutes: RouteObject[] = [
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/register",
    element: withSuspense(<RegisterPage />),
  },
  {
    path: "/recuperar-senha",
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: "/redefinir-senha",
    element: withSuspense(<ResetPasswordPage />),
  },
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "style-guide",
        Component: StyleGuide,
      },
      {
        path: "hotels",
        children: [
          {
            index: true,
            Component: HotelsPage,
          },
          {
            path: ":id",
            Component: HotelDetailsPage,
          },
        ],
      },
      {
        path: "walkers",
        children: [
          {
            index: true,
            Component: WalkersPage,
          },
          {
            path: ":id",
            Component: WalkerDetailsPage,
          },
        ],
      },
      {
        path: "search",
        Component: LandingPage,
      },
      {
        path: "products",
        Component: ShoppingPage,
      },
      {
        path: "shopping",
        children: [
          {
            index: true,
            Component: ShoppingPage,
          },
          {
            path: ":id",
            Component: ProductDetailPage,
          },
        ],
      },
      {
        path: "store/:id",
        Component: StorePage,
      },
      {
        path: "cart",
        Component: CartPage,
      },
      {
        path: "checkout",
        children: [
          {
            index: true,
            Component: CheckoutPage,
          },
          {
            path: "success",
            Component: CheckoutSuccessPage,
          },
        ],
      },
      {
        path: "appointments",
        Component: LandingPage,
      },
      {
        path: "about",
        Component: AboutPage,
      },
      {
        path: "partners",
        Component: PartnersPage,
      },
      {
        path: "terms",
        Component: TermsPage,
      },
      {
        path: "privacy",
        Component: PrivacyPage,
      },
      {
        path: "contact",
        Component: ContactPage,
      },
      {
        path: "tutor/perfil",
        element: (
          <ProtectedRoute>
            <TutorProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "tutor/pets",
        element: (
          <ProtectedRoute>
            <TutorPets />
          </ProtectedRoute>
        ),
      },
      {
        path: "tutor/agendamentos",
        element: (
          <ProtectedRoute>
            <TutorAppointments />
          </ProtectedRoute>
        ),
      },
      {
        path: "tutor/pedidos",
        element: (
          <ProtectedRoute>
            <TutorOrders />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/onboarding/sitter",
    element: withSuspense(
      <ProtectedRoute>
        <PetSitterOnboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        Component: DashboardHome,
      },
      {
        path: "schedule",
        Component: Schedule,
      },
      {
        path: "perfil",
        Component: PublicProfile,
      },
      {
        path: "conta",
        Component: Account,
      },
      {
        path: "financeiro",
        Component: Finance,
      },
      {
        path: "orders",
        Component: Orders,
      },
      {
        path: "customers",
        Component: Customers,
      },
      {
        path: "products",
        Component: Products,
      },
      {
        path: "settings",
        Component: Settings,
      },
      {
        path: "aprovacoes",
        Component: Approvals,
      },
      {
        path: "usuarios",
        Component: Users,
      },
      {
        path: "avaliacoes-sitters",
        Component: SitterEvaluations,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
];

// Toda rota raiz ganha a mesma fronteira de erro: sem `errorElement` o React
// Router mostra a tela padrão dele e o erro nunca chega ao Sentry.
export const router = createBrowserRouter(
  rootRoutes.map((route) => ({ errorElement: <RouteErrorBoundary />, ...route }))
);
