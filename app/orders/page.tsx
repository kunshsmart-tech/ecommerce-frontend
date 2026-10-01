"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  customer_name: string;
  email: string;
  address: string;
  total_amount: number;
  status: string;
  created_at: string | null;
};

export default function OrdersPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const searchOrders = async () => {
    setError("");
    setSearched(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/orders?email=${encodeURIComponent(
          email.trim()
        )}`,
        {
          method: "GET",
          headers: {
            "X-API-Key":
              process.env.NEXT_PUBLIC_API_KEY || "",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load orders"
        );
      }

      setOrders(data);
      setSearched(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return "Date unavailable";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-gray-900"
          >
            MyStore
          </button>

          <div className="flex items-center gap-5">

            <button
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-black"
            >
              Continue Shopping
            </button>

            <button
              onClick={() => router.push("/cart")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cart
            </button>

          </div>
        </div>
      </header>


      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* TITLE */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-900">
            My Orders
          </h1>

          <p className="mt-2 text-gray-500">
            Enter your email to view your previous orders.
          </p>

        </div>


        {/* SEARCH BOX */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Email Address
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchOrders();
                }
              }}
              placeholder="Enter the email used during checkout"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />

            <button
              onClick={searchOrders}
              disabled={loading}
              className="rounded-lg bg-black px-7 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? "Searching..." : "Find Orders"}
            </button>

          </div>


          {/* ERROR */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

        </div>


        {/* RESULTS */}
        {searched && (
          <div className="mt-8">

            {orders.length === 0 ? (

              /* NO ORDERS */
              <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

                <div className="mb-5 text-6xl">
                  📦
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                  No orders found
                </h2>

                <p className="mt-3 text-gray-500">
                  We couldn't find any orders for this email address.
                </p>

                <button
                  onClick={() => router.push("/")}
                  className="mt-7 rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
                >
                  Start Shopping
                </button>

              </div>

            ) : (

              /* ORDER LIST */
              <div className="space-y-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Your Orders
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {orders.length}{" "}
                      {orders.length === 1
                        ? "order"
                        : "orders"}{" "}
                      found
                    </p>
                  </div>

                </div>


                {orders.map((order) => (

                  <div
                    key={order.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >

                    {/* ORDER HEADER */}
                    <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-center">

                      <div>

                        <p className="text-sm text-gray-500">
                          Order ID
                        </p>

                        <h3 className="mt-1 text-lg font-bold text-gray-900">
                          #{order.id}
                        </h3>

                      </div>


                      <div className="sm:text-right">

                        <p className="text-sm text-gray-500">
                          Order Date
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(order.created_at)}
                        </p>

                      </div>

                    </div>


                    {/* ORDER DETAILS */}
                    <div className="grid gap-6 py-5 sm:grid-cols-3">

                      {/* STATUS */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Status
                        </p>

                        <span className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                          {order.status}
                        </span>

                      </div>


                      {/* TOTAL */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Total Amount
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          ₹
                          {order.total_amount.toLocaleString(
                            "en-IN"
                          )}
                        </p>

                      </div>


                      {/* CUSTOMER */}
                      <div>

                        <p className="text-sm text-gray-500">
                          Customer
                        </p>

                        <p className="mt-1 font-medium text-gray-900">
                          {order.customer_name}
                        </p>

                      </div>

                    </div>


                    {/* ADDRESS */}
                    <div className="border-t pt-5">

                      <p className="text-sm font-medium text-gray-500">
                        Delivery Address
                      </p>

                      <p className="mt-2 text-gray-700">
                        {order.address}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>
        )}

      </div>

    </main>
  );
}