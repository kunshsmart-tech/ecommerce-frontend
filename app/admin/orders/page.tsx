
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  adminFetch,
  getAdminToken,
  logoutAdmin,
} from "@/lib/adminAuth";

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type Order = {
  id: number;
  customer_name: string;
  email: string;
  address: string;
  total_amount: number;
  status: string;
  created_at: string | null;
};

const statuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] =
    useState(false);
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Check the JWT before displaying admin information.
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
          throw new Error("Authentication failed");
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

  // Fetch orders using the admin JWT.
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminFetch(
        "/admin/orders"
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Failed to load orders (${response.status})`
        );
      }

      const data: Order[] = await response.json();

      setOrders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load orders"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadOrders();
    }
  }, [authenticated, loadOrders]);

  // Update an order's delivery status.
  async function updateStatus(
    orderId: number,
    newStatus: OrderStatus
  ) {
    const currentOrder = orders.find(
      (order) => order.id === orderId
    );

    if (
      !currentOrder ||
      currentOrder.status === newStatus
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Change order #${orderId} from ` +
        `${currentOrder.status} to ${newStatus}?`
    );

    if (!confirmed) {
      return;
    }

    setSavingId(orderId);
    setError("");
    setMessage("");

    try {
      const response = await adminFetch(
        `/admin/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Failed to update order (${response.status})`
        );
      }

      const updated: Order = await response.json();

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? updated
            : order
        )
      );

      setMessage(
        `Order #${orderId} updated successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order"
      );
    } finally {
      setSavingId(null);
    }
  }

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const orderValue = orders
    .filter(
      (order) => order.status !== "Cancelled"
    )
    .reduce(
      (total, order) =>
        total + order.total_amount,
      0
    );

  // Never render order information until
  // authentication has succeeded.
  if (checkingAuth || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
        <p>Checking admin session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Order Management
            </h1>

            <p className="mt-2 text-gray-500">
              Manage customer orders and delivery status
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-gray-900 px-5 py-3 text-white"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/admin/inventory"
              className="rounded-lg border bg-white px-5 py-3"
            >
              Inventory
            </Link>

            <button
              type="button"
              onClick={logoutAdmin}
              className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* MESSAGES */}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-100 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-green-100 p-4 text-green-700"
          >
            {message}
          </div>
        )}

        {/* ORDER STATISTICS */}

        <section className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Total Orders
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {orders.length}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Pending Orders
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {pendingOrders}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Order Value (excluding cancellations)
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              ₹
              {orderValue.toLocaleString("en-IN")}
            </h2>
          </div>
        </section>

        {/* ORDER TABLE */}

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
            <h2 className="text-xl font-semibold">
              Customer Orders
            </h2>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="p-6">
              Loading orders...
            </p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-gray-500">
              No orders found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">
                      Order ID
                    </th>
                    <th className="p-4">
                      Customer
                    </th>
                    <th className="p-4">
                      Address
                    </th>
                    <th className="p-4">
                      Date
                    </th>
                    <th className="p-4">
                      Amount
                    </th>
                    <th className="p-4">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4 font-semibold">
                        #{order.id}
                      </td>

                      <td className="p-4">
                        <p className="font-medium">
                          {order.customer_name}
                        </p>

                        <p className="text-gray-500">
                          {order.email}
                        </p>
                      </td>

                      <td className="max-w-xs p-4">
                        {order.address}
                      </td>

                      <td className="p-4">
                        {order.created_at
                          ? new Date(
                              order.created_at
                            ).toLocaleString(
                              "en-IN"
                            )
                          : "—"}
                      </td>

                      <td className="p-4 font-medium">
                        ₹
                        {order.total_amount.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="p-4">
                        <select
                          aria-label={`Status for order ${order.id}`}
                          value={order.status}
                          disabled={
                            savingId !== null
                          }
                          onChange={(event) =>
                            updateStatus(
                              order.id,
                              event.target
                                .value as OrderStatus
                            )
                          }
                          className="rounded-lg border bg-white p-2 disabled:opacity-50"
                        >
                          {!statuses.includes(
                            order.status as OrderStatus
                          ) && (
                            <option
                              value={order.status}
                            >
                              {order.status}
                            </option>
                          )}

                          {statuses.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>

                        {savingId ===
                          order.id && (
                          <p className="mt-2 text-xs text-gray-500">
                            Saving...
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}