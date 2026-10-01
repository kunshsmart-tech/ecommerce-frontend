"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string | null;
  rating: number | null;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const shipping = 0;

  const total = subtotal + shipping;


  const placeOrder = async () => {
    setError("");

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!address.trim()) {
      setError("Please enter your address.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer_name: customerName,
        email: email,
        address: address,

        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };


      const response = await fetch(
        "http://127.0.0.1:8000/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "X-API-Key":
              process.env.NEXT_PUBLIC_API_KEY || "",
          },

          body: JSON.stringify(orderData),
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to place order"
        );
      }


      // Clear cart after successful order
      localStorage.removeItem("cart");

      // Send user to order confirmation
      router.push(`/order-success?id=${data.id}`);
    }

    catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }
    }

    finally {
      setLoading(false);
    }
  };


  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="text-center">

          <h1 className="text-3xl font-bold text-gray-900">
            Your cart is empty
          </h1>

          <p className="mt-3 text-gray-600">
            Add some products before checking out.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg bg-black px-6 py-3 text-white hover:bg-gray-800"
          >
            Continue Shopping
          </button>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-gray-900"
          >
            MyStore
          </button>

          <button
            onClick={() => router.push("/cart")}
            className="text-gray-600 hover:text-black"
          >
            ← Back to Cart
          </button>

        </div>

      </header>


      <div className="mx-auto max-w-6xl px-6 py-10">

        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Checkout
        </h1>


        <div className="grid gap-8 lg:grid-cols-3">


          {/* Customer Information */}
          <div className="lg:col-span-2">

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="mb-6 text-xl font-semibold">
                Customer Information
              </h2>


              <div className="space-y-5">


                {/* Name */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Email */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Address */}
                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Delivery Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    placeholder="Enter your complete delivery address"
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />

                </div>


                {/* Error */}
                {error && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}


                {/* Place Order */}
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading
                    ? "Placing Order..."
                    : "Place Order"}
                </button>

              </div>

            </div>

          </div>


          {/* Order Summary */}
          <div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="mb-6 text-xl font-semibold">
                Order Summary
              </h2>


              <div className="space-y-4">

                {cart.map((item) => (

                  <div
                    key={item.id}
                    className="flex gap-4 border-b pb-4"
                  >

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        No Image
                      </div>
                    )}


                    <div className="flex-1">

                      <h3 className="font-medium text-gray-900">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-1 font-semibold">
                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                  </div>

                ))}

              </div>


              {/* Totals */}
              <div className="mt-6 space-y-3">

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>


                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>

                  <span className="text-green-600">
                    Free
                  </span>
                </div>


                <div className="border-t pt-4">

                  <div className="flex justify-between text-lg font-bold">

                    <span>Total</span>

                    <span>
                      ₹{total.toLocaleString("en-IN")}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}