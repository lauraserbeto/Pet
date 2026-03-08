import { createBrowserRouter } from "react-router";
import { Layout } from "../components/layout/Layout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { LandingPage } from "../pages/LandingPage";
import { StyleGuide } from "../pages/StyleGuide";
import { HotelsPage } from "../pages/HotelsPage";
import { HotelDetailsPage } from "../pages/HotelDetailsPage";
import { WalkersPage } from "../pages/WalkersPage";
import { WalkerDetailsPage } from "../pages/WalkerDetailsPage";
import { Overview } from "../pages/dashboard/Overview";
import { Schedule } from "../pages/dashboard/Schedule";
import { Customers } from "../pages/dashboard/Customers";
import { Products } from "../pages/dashboard/Products";
import { Settings } from "../pages/dashboard/Settings";
import { Approvals } from "../pages/dashboard/admin/Approvals";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { AboutPage } from "../pages/AboutPage";
import { ShoppingPage } from "../pages/ShoppingPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";
import { TermsPage } from "../pages/TermsPage";
import { PrivacyPage } from "../pages/PrivacyPage";
import { ContactPage } from "../pages/ContactPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CheckoutSuccessPage } from "../pages/CheckoutSuccessPage";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { Profile } from "../pages/dashboard/Profile";
import Finance from "@/pages/dashboard/Finance";
import Orders from "@/pages/dashboard/Orders";
import { PetSitterOnboarding } from "../pages/onboarding/PetSitterOnboarding";
import { SitterEvaluations } from "@/pages/dashboard/SitterEvaluations";
import { TutorProfile } from "../pages/tutor/TutorProfile";
import { TutorPets } from "../pages/tutor/TutorPets";
import { TutorAppointments } from "../pages/tutor/TutorAppointments";
import { TutorOrders } from "../pages/tutor/TutorOrders";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
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
                Component: HotelDetailsPage
            }
        ]
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
                Component: WalkerDetailsPage
            }
        ]
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
    element: (
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
            Component: Overview
        },
        {
            path: "schedule",
            Component: Schedule
        },
        {
            path: "perfil",
            Component: Profile
        },
        {
            path: "financeiro",
            Component: Finance
        },
        {
            path: "orders",
            Component: Orders
        },
        {
            path: "customers",
            Component: Customers
        },
        {
            path: "products",
            Component: Products
        },
        {
            path: "settings",
            Component: Settings
        },
        {
            path: "aprovacoes",
            Component: Approvals
        },
        {
            path: "avaliacoes-sitters",
            Component: SitterEvaluations
        }
    ]
  },
]);