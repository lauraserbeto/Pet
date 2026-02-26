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
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { AboutPage } from "../pages/AboutPage";
import { ShoppingPage } from "../pages/ShoppingPage";

export const router = createBrowserRouter([
  // Auth routes (no layout wrapper)
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
      // Mock routes for navigation items to prevent 404s on demo
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
        Component: ShoppingPage,
      },
      {
        path: "appointments",
        Component: LandingPage,
      },
      {
        path: "about",
        Component: AboutPage,
      }
    ],
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
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
        }
    ]
  },
]);