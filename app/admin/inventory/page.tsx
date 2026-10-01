
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  adminFetch,
  getAdminToken,
  logoutAdmin,
} from "@/lib/adminAuth";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
  rating: number | null;
};

const LOW_STOCK_THRESHOLD = 5;

export default function AdminInventoryPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [quantities, setQuantities] = useState<
    Record<number, string>
  >({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "low" | "out"
  >("all");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Check that the user has a valid admin JWT.
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

  // Load inventory using JWT authentication.
  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminFetch(
        "/admin/inventory"
      );

      if (!response.ok) {
        throw new Error(
          `Unable to load inventory (${response.status})`
        );
      }

      const data: Product[] = await response.json();

      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load inventory"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadInventory();
    }
  }, [authenticated, loadInventory]);

  // Add stock to a product.
  async function restockProduct(productId: number) {
    const quantity = Number(quantities[productId]);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Enter a positive whole number to restock."
      );
      setMessage("");
      return;
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    const confirmed = window.confirm(
      `Add ${quantity} units to ${product.name}?`
    );

    if (!confirmed) {
      return;
    }

    setSavingId(productId);
    setError("");
    setMessage("");

    try {
      const response = await adminFetch(
        `/admin/inventory/${productId}/restock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity,
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
            : `Restock failed (${response.status})`
        );
      }

      const updated: Product = await response.json();

      setProducts((previous) =>
        previous
          .map((item) =>
            item.id === productId
              ? updated
              : item
          )
          .sort((a, b) => a.stock - b.stock)
      );

      setQuantities((previous) => ({
        ...previous,
        [productId]: "",
      }));

      setMessage(
        `${product.name} restocked successfully. ` +
          `New stock: ${updated.stock}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to restock product"
      );
    } finally {
      setSavingId(null);
    }
  }

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + product.stock,
    0
  );

  const lowStock = products.filter(
    (product) =>
      product.stock > 0 &&
      product.stock < LOW_STOCK_THRESHOLD
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch =
        product.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        product.category
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(product.id).includes(search);

      const matchesFilter =
        filter === "all" ||
        (filter === "low" &&
          product.stock > 0 &&
          product.stock < LOW_STOCK_THRESHOLD) ||
        (filter === "out" &&
          product.stock === 0);

      return matchesSearch && matchesFilter;
    }
  );

  function stockLabel(stock: number) {
    if (stock === 0) {
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Out of Stock
        </span>
      );
    }

    if (stock < LOW_STOCK_THRESHOLD) {
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Low Stock
        </span>
      );
    }

    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        In Stock
      </span>
    );
  }

  if (checkingAuth || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
        Checking admin session...
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
              Inventory Management
            </h1>

            <p className="mt-2 text-gray-500">
              Monitor stock and restock products
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-gray-900 px-5 py-3 text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-lg border bg-white px-5 py-3"
            >
              Orders
            </Link>

            <button
              type="button"
              onClick={logoutAdmin}
              className="rounded-lg bg-red-600 px-5 py-3 text-white"
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

        {/* INVENTORY STATISTICS */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Total Products
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {totalProducts}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Total Stock Units
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {totalStock}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Low Stock
            </p>

            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {lowStock}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-gray-500">
              Out of Stock
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {outOfStock}
            </h2>
          </div>
        </section>

        {/* SEARCH AND FILTER */}

        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              placeholder="Search by product, category or ID"
              aria-label="Search inventory"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="min-w-0 flex-1 rounded-lg border p-3"
            />

            <select
              aria-label="Filter inventory"
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as
                    | "all"
                    | "low"
                    | "out"
                )
              }
              className="rounded-lg border bg-white p-3"
            >
              <option value="all">
                All Products
              </option>

              <option value="low">
                Low Stock
              </option>

              <option value="out">
                Out of Stock
              </option>
            </select>

            <button
              type="button"
              onClick={loadInventory}
              disabled={loading}
              className="rounded-lg border px-5 py-3 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* INVENTORY TABLE */}

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">
              Products ({filteredProducts.length})
            </h2>
          </div>

          {loading ? (
            <p className="p-6">
              Loading inventory...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="p-6 text-gray-500">
              No matching products found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Restock</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => (
                      <tr
                        key={product.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4">
                          #{product.id}
                        </td>

                        <td className="p-4 font-medium">
                          {product.name}
                        </td>

                        <td className="p-4">
                          {product.category}
                        </td>

                        <td className="p-4 font-semibold">
                          {product.stock}
                        </td>

                        <td className="p-4">
                          {stockLabel(product.stock)}
                        </td>

                        <td className="p-4">
                          <div className="flex min-w-48 items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="Qty"
                              aria-label={`Restock quantity for ${product.name}`}
                              value={
                                quantities[product.id] ?? ""
                              }
                              disabled={savingId !== null}
                              onChange={(event) =>
                                setQuantities(
                                  (previous) => ({
                                    ...previous,
                                    [product.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              className="w-20 rounded-lg border p-2"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                restockProduct(
                                  product.id
                                )
                              }
                              disabled={
                                savingId !== null
                              }
                              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                            >
                              {savingId === product.id
                                ? "Saving..."
                                : "Add Stock"}
                            </button>
                          </div>
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
    </main>
  );
}