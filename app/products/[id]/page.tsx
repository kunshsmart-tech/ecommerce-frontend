"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

type CartItem = Product & {
  quantity: number;
};

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;

    fetch(`http://127.0.0.1:8000/products/${params.id}`, {
      headers: {
        "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Product not found");
        }

        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Could not load product");
        setLoading(false);
      });
  }, [params.id]);

  const addToCart = () => {
    if (!product || product.stock === 0) {
      return;
    }

    const savedCart = localStorage.getItem("cart");

    let cart: CartItem[] = [];

    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (error) {
        console.error("Could not read cart:", error);
      }
    }

    const existingItem = cart.find(
      (item) => item.id === product.id
    );

    let updatedCart: CartItem[];

    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                product.stock
              ),
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    router.push("/cart");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 text-lg">
          Loading product...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">
          {error || "Product not found"}
        </p>

        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Back to Store
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold tracking-tight"
          >
            MyStore
          </button>

          <div className="flex items-center gap-3">

            <button
              onClick={() => router.push("/cart")}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-100"
            >
              🛒 Cart
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-100"
            >
              ← Back to Store
            </button>

          </div>

        </div>
      </header>

      {/* Product Details */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <div className="grid gap-12 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-10">

          {/* Product Image */}
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-gray-100">

            {product.image_url ? (

              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-[450px] w-full rounded-2xl object-contain"
              />

            ) : (

              <div className="text-gray-400">
                No image available
              </div>

            )}

          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-center">

            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
              {product.category}
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {product.name}
            </h1>

            {/* Rating */}
            {product.rating !== null && (
              <div className="mt-4 flex items-center gap-2">

                <span className="text-yellow-500 text-xl">
                  ★
                </span>

                <span className="font-semibold">
                  {product.rating}
                </span>

                <span className="text-gray-500">
                  / 5
                </span>

              </div>
            )}

            {/* Price */}
            <p className="mt-6 text-3xl font-bold text-gray-900">
              ₹{product.price.toLocaleString("en-IN")}
            </p>

            {/* Description */}
            <div className="mt-6">

              <h2 className="text-lg font-semibold">
                Description
              </h2>

              <p className="mt-2 leading-7 text-gray-600">
                {product.description}
              </p>

            </div>

            {/* Stock */}
            <div className="mt-6">

              {product.stock > 0 ? (

                <p className="font-medium text-green-600">
                  ✓ In stock ({product.stock} available)
                </p>

              ) : (

                <p className="font-medium text-red-600">
                  ✕ Out of stock
                </p>

              )}

            </div>

            {/* Add to Cart */}
            <button
              onClick={addToCart}
              disabled={product.stock === 0}
              className="mt-8 w-full rounded-xl bg-black px-6 py-4 text-lg font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {product.stock > 0
                ? "Add to Cart"
                : "Out of Stock"}
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}