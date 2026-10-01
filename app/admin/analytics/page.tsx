
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  adminFetch,
  getAdminToken,
  logoutAdmin,
} from "@/lib/adminAuth";

type SalesDay = {
  date: string;
  revenue: number;
};

type TopProduct = {
  id: number;
  name: string;
  units_sold: number;
  revenue: number;
};

type LowStockProduct = {
  id: number;
  name: string;
  category: string;
  stock: number;
};

type Analytics = {
  total_revenue: number;
  total_orders: number;
  completed_orders: number;
  average_order_value: number;
  total_units_sold: number;
  order_statuses: Record<string, number>;
  sales_trend: SalesDay[];
  top_products: TopProduct[];
  low_stock_products: LowStockProduct[];
};

const orderStatuses = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function formatDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      if (!getAdminToken()) {
        router.replace("/admin/login");
        return;
      }

      try {
        const response = await adminFetch("/admin/me");

        if (!response.ok) {
          throw new Error("Authentication failed.");
        }

        if (active) {
          setAuthenticated(true);
        }
      } catch {
        if (active) {
          logoutAdmin();
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [router]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminFetch(
        "/admin/analytics"
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Unable to load analytics (${response.status})`
        );
      }

      const data: Analytics = await response.json();

      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadAnalytics();
    }
  }, [authenticated, loadAnalytics]);

  if (checkingAuth || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
        Checking admin session...
      </main>
    );
  }

  const maxDailyRevenue = Math.max(
    1,
    ...(analytics?.sales_trend.map(
      (day) => day.revenue
    ) ?? [])
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Sales Analytics
            </h1>

            <p className="mt-2 text-gray-500">
              Revenue, orders, popular products and stock alerts
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-gray-900 px-4 py-3 text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-lg border bg-white px-4 py-3"
            >
              Orders
            </Link>

            <Link
              href="/admin/inventory"
              className="rounded-lg border bg-white px-4 py-3"
            >
              Inventory
            </Link>

            <button
              type="button"
              onClick={logoutAdmin}
              className="rounded-lg bg-red-600 px-4 py-3 text-white"
            >
              Logout
            </button>
          </nav>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-red-100 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="rounded-lg border bg-white px-5 py-2 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        {loading && !analytics ? (
          <div className="rounded-xl bg-white p-8 shadow-sm">
            Loading sales analytics...
          </div>
        ) : analytics ? (
          <>
            {/* SUMMARY CARDS */}

            <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Completed Revenue
                </p>

                <h2 className="mt-3 text-3xl font-bold text-green-700">
                  {money(analytics.total_revenue)}
                </h2>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Orders
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  {analytics.total_orders}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {analytics.completed_orders} delivered
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Average Completed Order
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  {money(analytics.average_order_value)}
                </h2>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Units Sold
                </p>

                <h2 className="mt-3 text-3xl font-bold">
                  {analytics.total_units_sold}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  From delivered orders
                </p>
              </div>
            </section>

            {/* SALES TREND */}

            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">
                Revenue by Order Date
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Last seven days · Delivered orders only
              </p>

              <div className="mt-8 flex h-64 items-end gap-3 border-b border-gray-200 pb-2 sm:gap-6">
                {analytics.sales_trend.map((day) => {
                  const height =
                    (day.revenue / maxDailyRevenue) * 100;

                  return (
                    <div
                      key={day.date}
                      className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-center text-xs font-medium text-gray-600">
                        {day.revenue > 0
                          ? money(day.revenue)
                          : "₹0"}
                      </span>

                      <div
                        role="img"
                        aria-label={`${formatDay(day.date)}: ${money(day.revenue)}`}
                        title={`${formatDay(day.date)}: ${money(day.revenue)}`}
                        className="w-full max-w-24 rounded-t-lg bg-blue-600"
                        style={{
                          height:
                            day.revenue > 0
                              ? `${Math.max(height, 3)}%`
                              : "2px",
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-3 sm:gap-6">
                {analytics.sales_trend.map((day) => (
                  <span
                    key={day.date}
                    className="min-w-0 flex-1 text-center text-xs text-gray-500"
                  >
                    {formatDay(day.date)}
                  </span>
                ))}
              </div>
            </section>

            {/* STATUS BREAKDOWN */}

            <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold">
                Order Status Breakdown
              </h2>

              <div className="space-y-5">
                {orderStatuses.map((status) => {
                  const count =
                    analytics.order_statuses[status] ?? 0;

                  const percentage =
                    analytics.total_orders > 0
                      ? (count / analytics.total_orders) * 100
                      : 0;

                  return (
                    <div key={status}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{status}</span>
                        <span className="font-semibold">
                          {count}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TOP PRODUCTS AND LOW STOCK */}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="border-b p-6">
                  <h2 className="text-xl font-semibold">
                    Best-Selling Products
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Ranked by units in delivered orders
                  </p>
                </div>

                {analytics.top_products.length === 0 ? (
                  <p className="p-6 text-gray-500">
                    No delivered product sales yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-4">Product</th>
                          <th className="p-4">Units</th>
                          <th className="p-4">Revenue</th>
                        </tr>
                      </thead>

                      <tbody>
                        {analytics.top_products.map(
                          (product) => (
                            <tr
                              key={product.id}
                              className="border-t"
                            >
                              <td className="p-4 font-medium">
                                {product.name}
                              </td>

                              <td className="p-4">
                                {product.units_sold}
                              </td>

                              <td className="p-4">
                                {money(product.revenue)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Stock Alerts
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Products with fewer than 5 units
                    </p>
                  </div>

                  <Link
                    href="/admin/inventory"
                    className="text-sm font-semibold text-blue-600"
                  >
                    Manage Stock
                  </Link>
                </div>

                {analytics.low_stock_products.length === 0 ? (
                  <p className="p-6 text-green-700">
                    No low-stock products.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-4">Product</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {analytics.low_stock_products.map(
                          (product) => (
                            <tr
                              key={product.id}
                              className="border-t"
                            >
                              <td className="p-4">
                                <p className="font-medium">
                                  {product.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {product.category}
                                </p>
                              </td>

                              <td className="p-4 font-semibold">
                                {product.stock}
                              </td>

                              <td className="p-4">
                                <span
                                  className={
                                    product.stock === 0
                                      ? "rounded-full bg-red-100 px-2 py-1 text-xs text-red-700"
                                      : "rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700"
                                  }
                                >
                                  {product.stock === 0
                                    ? "Out of Stock"
                                    : "Low Stock"}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-white p-8 text-gray-500 shadow-sm">
            Analytics data is unavailable. Check your backend
            and try refreshing.
          </div>
        )}
      </div>
    </main>
  );
}