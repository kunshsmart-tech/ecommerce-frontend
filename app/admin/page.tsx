
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

type ProductForm = Omit<Product, "id">;

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: 0,
  category: "Electronics",
  stock: 0,
  image_url: null,
  rating: null,
};

const categories = [
  "Electronics",
  "Beauty",
  "Fashion",
  "Home & Kitchen",
  "Grocery",
  "Sports",
  "Books",
  "Toys",
];

export default function AdminPage() {
  const router = useRouter();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });

  // Check whether the admin token is valid.
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

  // Load the products using the admin JWT.
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await adminFetch("/products");

      if (!response.ok) {
        throw new Error(
          `Failed to load products (${response.status})`
        );
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load products"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadProducts();
    }
  }, [authenticated, loadProducts]);

  function startAdd() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function startEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      image_url: product.image_url,
      rating: product.rating,
    });

    setError("");
    setMessage("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function saveProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.name.trim() || !form.description.trim()) {
      setError("Name and description are required.");
      return;
    }

    if (
      !Number.isFinite(form.price) ||
      form.price <= 0 ||
      !Number.isInteger(form.stock) ||
      form.stock < 0
    ) {
      setError(
        "Price must be positive and stock must be a non-negative integer."
      );
      return;
    }

    if (
      form.rating !== null &&
      (form.rating < 0 || form.rating > 5)
    ) {
      setError("Rating must be between 0 and 5.");
      return;
    }

    setSaving(true);

    const isEditing = editingId !== null;

    const path = isEditing
      ? `/products/${editingId}`
      : "/products";

    try {
      const response = await adminFetch(path, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.image_url?.trim() || null,
        }),
      });

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Save failed (${response.status})`
        );
      }

      cancelForm();

      await loadProducts();

      setMessage(
        isEditing
          ? "Product updated successfully."
          : "Product added successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setError("");
    setMessage("");

    try {
      const response = await adminFetch(
        `/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          typeof result.detail === "string"
            ? result.detail
            : `Delete failed (${response.status})`
        );
      }

      await loadProducts();

      setMessage(
        `${product.name} deleted successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete product"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  const lowStock = products.filter(
    (product) => product.stock < 5
  ).length;

  const outOfStock = products.filter(
    (product) => product.stock === 0
  ).length;

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
              Admin Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your products and inventory
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg border bg-white px-5 py-3"
            >
              View Store
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-lg border bg-white px-5 py-3"
            >
              Orders
            </Link>

            <Link
              href="/admin/inventory"
              className="rounded-lg border bg-white px-5 py-3"
            >
              Inventory
            </Link>

            <button
              type="button"
              onClick={startAdd}
              className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
            >
              + Add Product
            </button>

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
          <p
            role="alert"
            className="mb-5 rounded-lg bg-red-100 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mb-5 rounded-lg bg-green-100 p-4 text-green-700"
          >
            {message}
          </p>
        )}

        {/* DASHBOARD STATISTICS */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Products",
              value: products.length,
              color: "text-gray-900",
            },
            {
              label: "Total Stock",
              value: totalStock,
              color: "text-blue-600",
            },
            {
              label: "Low Stock Products",
              value: lowStock,
              color: "text-orange-600",
            },
            {
              label: "Out of Stock",
              value: outOfStock,
              color: "text-red-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <p className="text-gray-500">
                {stat.label}
              </p>

              <h2
                className={`mt-2 text-3xl font-bold ${stat.color}`}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </section>

        {/* ADD / EDIT PRODUCT FORM */}

        {showForm && (
          <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold">
              {editingId !== null
                ? "Edit Product"
                : "Add Product"}
            </h2>

            <form
              onSubmit={saveProduct}
              className="grid gap-5 md:grid-cols-2"
            >
              <label className="block">
                <span className="mb-2 block">
                  Product Name
                </span>

                <input
                  required
                  maxLength={200}
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block">
                  Category
                </span>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border p-3"
                >
                  {!categories.includes(form.category) && (
                    <option value={form.category}>
                      {form.category}
                    </option>
                  )}

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block">
                  Description
                </span>

                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block">
                  Price (₹)
                </span>

                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block">
                  Stock
                </span>

                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      stock: Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block">
                  Image URL (optional)
                </span>

                <input
                  type="url"
                  value={form.image_url || ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      image_url: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block">
                  Rating (optional)
                </span>

                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      rating:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                  className="w-full rounded-lg border p-3"
                />
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Product"}
                </button>

                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={saving}
                  className="rounded-lg border px-6 py-3 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* PRODUCT TABLE */}

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-6">
            <h2 className="text-xl font-semibold">
              Product Management
            </h2>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="p-6">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <p className="p-6 text-center text-gray-500">
              No products found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "ID",
                      "Product",
                      "Category",
                      "Price",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="p-4"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {product.id}
                      </td>

                      <td className="p-4 font-medium">
                        {product.name}
                      </td>

                      <td className="p-4">
                        {product.category}
                      </td>

                      <td className="p-4">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="p-4">
                        {product.stock}
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            product.stock === 0
                              ? "font-medium text-red-600"
                              : product.stock < 5
                                ? "font-medium text-orange-600"
                                : "font-medium text-green-600"
                          }
                        >
                          {product.stock === 0
                            ? "Out of stock"
                            : product.stock < 5
                              ? "Low stock"
                              : "Available"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit(product)
                            }
                            className="font-medium text-blue-600"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={
                              deletingId === product.id
                            }
                            onClick={() =>
                              deleteProduct(product)
                            }
                            className="font-medium text-red-600 disabled:opacity-50"
                          >
                            {deletingId === product.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
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