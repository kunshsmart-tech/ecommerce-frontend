"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const categories = [
  "All",
  "Electronics",
  "Beauty",
  "Fashion",
  "Home & Kitchen",
  "Grocery",
  "Sports",
  "Books",
  "Toys",
];

export default function Home() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD CART
  // ============================================================

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");

      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Could not load cart:", error);
    }
  }, []);

  // ============================================================
  // LOAD PRODUCTS FROM FASTAPI
  // ============================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://127.0.0.1:8000/products",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",

              // ==================================================
              // PUT YOUR CURRENT API KEY HERE
              // ==================================================
              "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
            },
          }
        );

        console.log(
          "FastAPI response status:",
          response.status
        );

        const responseText = await response.text();

        console.log(
          "FastAPI response:",
          responseText
        );

        if (!response.ok) {
          throw new Error(
            `FastAPI returned ${response.status}: ${responseText}`
          );
        }

        const data = JSON.parse(responseText);

        if (!Array.isArray(data)) {
          throw new Error(
            "FastAPI returned an unexpected product format."
          );
        }

        setProducts(data);
      } catch (error) {
        console.error(
          "PRODUCT FETCH ERROR:",
          error
        );

        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Could not load products");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ============================================================
  // SAVE CART
  // ============================================================

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };

  // ============================================================
  // ADD TO CART
  // ============================================================

  const addToCart = (product: Product) => {
    const existingItem = cart.find(
      (item) => item.id === product.id
    );

    if (existingItem) {
      const updatedCart = cart.map((item) => {
        if (item.id === product.id) {
          return {
            ...item,
            quantity: Math.min(
              item.quantity + 1,
              product.stock
            ),
          };
        }

        return item;
      });

      saveCart(updatedCart);
    } else {
      const updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ];

      saveCart(updatedCart);
    }
  };

  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filteredProducts = products.filter(
    (product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category.toLowerCase() ===
          selectedCategory.toLowerCase();

      const searchText =
        searchQuery.toLowerCase().trim();

      const matchesSearch =
        searchText === "" ||
        product.name
          .toLowerCase()
          .includes(searchText) ||
        product.description
          .toLowerCase()
          .includes(searchText) ||
        product.category
          .toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  // ============================================================
  // CART COUNT
  // ============================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">

          <div className="text-5xl mb-4">
            🛍️
          </div>

          <h1 className="text-2xl font-semibold">
            Loading products...
          </h1>

          <p className="text-gray-500 mt-2">
            Connecting to your store
          </p>

        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">

        <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-2xl w-full text-center shadow-sm">

          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-red-600">
            Could not load products
          </h1>

          <p className="text-gray-600 mt-4">
            {error}
          </p>

          <div className="mt-6 bg-gray-100 rounded-xl p-4 text-left">

            <p className="text-sm font-semibold mb-2">
              Check these things:
            </p>

            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • FastAPI is running on port 8000
              </li>

              <li>
                • Your API key matches the backend
              </li>

              <li>
                • GET /products works in Swagger
              </li>

              <li>
                • The browser is using http://localhost:3001
              </li>
            </ul>

          </div>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800"
          >
            Try Again
          </button>

        </div>

      </main>
    );
  }

  // ============================================================
  // MAIN STORE
  // ============================================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="bg-white border-b sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-6 py-4">

          <div className="flex items-center justify-between gap-6">

            {/* LOGO */}

            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 shrink-0"
            >

              <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center text-xl">
                🛍️
              </div>

              <div className="text-left">

                <h1 className="text-xl font-bold">
                  MyStore
                </h1>

                <p className="text-xs text-gray-500">
                  Shop everything
                </p>

              </div>

            </button>

            {/* DESKTOP SEARCH */}

            <div className="hidden md:flex flex-1 max-w-2xl">

              <div className="relative w-full">

                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-full py-3 pl-5 pr-12 outline-none focus:ring-2 focus:ring-black"
                />

                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white rounded-full"
                >
                  🔍
                </button>

              </div>

            </div>

            {/* CART BUTTON */}

            <button
              type="button"
              onClick={() =>
                router.push("/cart")
              }
              className="relative flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-100 transition"
            >

              <span className="text-lg">
                🛒
              </span>

              <span className="hidden sm:block font-medium">
                Cart
              </span>

              <span className="absolute -top-2 -right-2 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>

            </button>

          </div>

          {/* MOBILE SEARCH */}

          <div className="md:hidden mt-4">

            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 rounded-full py-3 px-5 outline-none focus:ring-2 focus:ring-black"
            />

          </div>

        </div>

        {/* ======================================================
            CATEGORIES
        ====================================================== */}

        <div className="border-t">

          <div className="max-w-7xl mx-auto px-6">

            <div className="flex gap-2 overflow-x-auto py-3">

              {categories.map(
                (category) => {

                  const isSelected =
                    selectedCategory ===
                    category;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(
                          category
                        )
                      }
                      className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition ${
                        isSelected
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </header>

      {/* ========================================================
          HERO
      ======================================================== */}

      <section className="max-w-7xl mx-auto px-6 pt-10 pb-8">

        <div className="bg-black text-white rounded-3xl px-8 py-12 md:px-14">

          <div className="max-w-2xl">

            <p className="text-sm uppercase tracking-widest text-gray-300 mb-4">
              Welcome to MyStore
            </p>

            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Discover products you'll love.
            </h2>

            <p className="mt-5 text-gray-300 text-lg">
              Explore electronics, beauty,
              fashion and more — all in one
              place.
            </p>

          </div>

        </div>

      </section>

      {/* ========================================================
          PRODUCTS
      ======================================================== */}

      <section className="max-w-7xl mx-auto px-6 pb-16">

        <div className="flex items-end justify-between mb-8">

          <div>

            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Our collection
            </p>

            <h2 className="text-3xl font-bold mt-1">
              {selectedCategory ===
              "All"
                ? "Featured Products"
                : selectedCategory}
            </h2>

          </div>

          <p className="text-sm text-gray-500">
            {filteredProducts.length}{" "}
            products
          </p>

        </div>

        {/* NO PRODUCTS */}

        {filteredProducts.length ===
        0 ? (

          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">

            <div className="text-5xl mb-4">
              🛍️
            </div>

            <h3 className="text-xl font-bold">
              No products found
            </h3>

            <p className="text-gray-500 mt-2">
              Try another search or
              category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  "All"
                );
                setSearchQuery("");
              }}
              className="mt-5 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
            >
              View All Products
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {filteredProducts.map(
              (product) => (

                <div
                  key={product.id}
                  onClick={() =>
                    router.push(
                      `/products/${product.id}`
                    )
                  }
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer"
                >

                  {/* IMAGE */}

                  <div className="relative h-64 bg-gray-100">

                    {product.image_url ? (

                      <img
                        src={
                          product.image_url
                        }
                        alt={
                          product.name
                        }
                        className="w-full h-full object-cover"
                      />

                    ) : (

                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>

                    )}

                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold">
                      {product.category}
                    </span>

                  </div>

                  {/* PRODUCT INFO */}

                  <div className="p-5">

                    <h3 className="text-lg font-bold line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-10">
                      {product.description}
                    </p>

                    {/* RATING */}

                    <div className="flex items-center gap-2 mt-4">

                      {product.rating !==
                        null && (

                        <span className="text-sm font-medium">
                          ⭐{" "}
                          {
                            product.rating
                          }
                        </span>

                      )}

                    </div>

                    {/* PRICE */}

                    <div className="flex items-center justify-between mt-4">

                      <span className="text-2xl font-bold">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                      {product.stock >
                      0 ? (

                        <span className="text-xs text-gray-500">
                          {
                            product.stock
                          }{" "}
                          left
                        </span>

                      ) : (

                        <span className="text-xs text-red-500 font-medium">
                          Out of stock
                        </span>

                      )}

                    </div>

                    {/* ADD TO CART */}

                    <button
                      type="button"
                      disabled={
                        product.stock ===
                        0
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(
                          product
                        );
                      }}
                      className="w-full mt-5 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      {product.stock >
                      0
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer className="bg-white border-t">

        <div className="max-w-7xl mx-auto px-6 py-8">

          <div className="flex flex-col md:flex-row justify-between gap-4">

            <div>

              <h3 className="font-bold text-lg">
                MyStore
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Your simple online shopping
                destination.
              </p>

            </div>

            <p className="text-sm text-gray-500">
              © 2026 MyStore. All rights
              reserved.
            </p>

          </div>

        </div>

      </footer>

    </main>
  );
}