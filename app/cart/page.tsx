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

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);


  // ------------------------------------------
  // LOAD CART
  // ------------------------------------------

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }

    setLoaded(true);
  }, []);


  // ------------------------------------------
  // SAVE CART
  // ------------------------------------------

  const saveCart = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );
  };


  // ------------------------------------------
  // INCREASE QUANTITY
  // ------------------------------------------

  const increaseQuantity = (id: number) => {
    const updatedCart = cart.map((item) => {

      if (item.id === id) {

        if (item.quantity >= item.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }

      return item;
    });

    saveCart(updatedCart);
  };


  // ------------------------------------------
  // DECREASE QUANTITY
  // ------------------------------------------

  const decreaseQuantity = (id: number) => {

    const updatedCart = cart
      .map((item) => {

        if (item.id === id) {

          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(updatedCart);
  };


  // ------------------------------------------
  // REMOVE ITEM
  // ------------------------------------------

  const removeItem = (id: number) => {

    const updatedCart = cart.filter(
      (item) => item.id !== id
    );

    saveCart(updatedCart);
  };


  // ------------------------------------------
  // CALCULATE SUBTOTAL
  // ------------------------------------------

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );


  const shipping = 0;

  const total = subtotal + shipping;


  // ------------------------------------------
  // CART COUNT
  // ------------------------------------------

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );


  // ------------------------------------------
  // LOADING STATE
  // ------------------------------------------

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-50">

        <div className="mx-auto max-w-6xl px-6 py-20 text-center">

          <p className="text-gray-500">
            Loading cart...
          </p>

        </div>

      </main>
    );
  }


  // ------------------------------------------
  // EMPTY CART
  // ------------------------------------------

  if (cart.length === 0) {

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
              onClick={() => router.push("/")}
              className="text-gray-600 hover:text-black"
            >
              Continue Shopping
            </button>

          </div>

        </header>


        {/* Empty Cart */}
        <div className="flex min-h-[70vh] items-center justify-center px-6">

          <div className="text-center">

            <div className="mb-6 text-7xl">
              🛒
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              Your cart is empty
            </h1>

            <p className="mt-3 text-gray-600">
              Looks like you haven't added anything yet.
            </p>

            <button
              onClick={() => router.push("/")}
              className="mt-8 rounded-lg bg-black px-7 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Start Shopping
            </button>

          </div>

        </div>

      </main>
    );
  }


  // ------------------------------------------
  // CART PAGE
  // ------------------------------------------

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ---------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------- */}

      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <button
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-gray-900"
          >
            MyStore
          </button>


          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-black"
          >
            ← Continue Shopping
          </button>

        </div>

      </header>


      {/* ---------------------------------- */}
      {/* MAIN */}
      {/* ---------------------------------- */}

      <div className="mx-auto max-w-6xl px-6 py-10">

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart
          </h1>

          <p className="mt-2 text-gray-500">
            {cartCount}{" "}
            {cartCount === 1 ? "item" : "items"} in your cart
          </p>

        </div>


        <div className="grid gap-8 lg:grid-cols-3">


          {/* ================================== */}
          {/* CART ITEMS */}
          {/* ================================== */}

          <div className="space-y-4 lg:col-span-2">

            {cart.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl bg-white p-5 shadow-sm"
              >

                <div className="flex gap-5">


                  {/* PRODUCT IMAGE */}
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                    {item.image_url ? (

                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        No Image
                      </div>

                    )}

                  </div>


                  {/* PRODUCT DETAILS */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="text-sm text-gray-500">
                          {item.category}
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-gray-900">
                          {item.name}
                        </h2>

                      </div>


                      {/* REMOVE */}
                      <button
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>

                    </div>


                    {/* PRICE */}
                    <p className="mt-3 text-lg font-bold text-gray-900">
                      ₹{item.price.toLocaleString("en-IN")}
                    </p>


                    {/* QUANTITY */}
                    <div className="mt-4 flex items-center gap-3">

                      <span className="text-sm text-gray-500">
                        Quantity:
                      </span>


                      <div className="flex items-center rounded-lg border border-gray-300">

                        <button
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          className="px-3 py-1.5 text-lg hover:bg-gray-100"
                        >
                          −
                        </button>


                        <span className="min-w-10 text-center font-medium">
                          {item.quantity}
                        </span>


                        <button
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          disabled={
                            item.quantity >= item.stock
                          }
                          className="px-3 py-1.5 text-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                        >
                          +
                        </button>

                      </div>


                      {item.quantity >= item.stock && (
                        <span className="text-xs text-orange-600">
                          Max stock reached
                        </span>
                      )}

                    </div>


                    {/* ITEM TOTAL */}
                    <p className="mt-3 text-sm text-gray-500">

                      Item total:{" "}

                      <span className="font-semibold text-gray-900">

                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toLocaleString("en-IN")}

                      </span>

                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>


          {/* ================================== */}
          {/* ORDER SUMMARY */}
          {/* ================================== */}

          <div>

            <div className="sticky top-6 rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="text-xl font-semibold text-gray-900">
                Order Summary
              </h2>


              {/* SUBTOTAL */}
              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-gray-600">

                  <span>
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>

                </div>


                {/* SHIPPING */}
                <div className="flex justify-between text-gray-600">

                  <span>
                    Shipping
                  </span>

                  <span className="font-medium text-green-600">
                    Free
                  </span>

                </div>


                {/* TOTAL */}
                <div className="border-t pt-4">

                  <div className="flex justify-between">

                    <span className="text-lg font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-bold">
                      ₹{total.toLocaleString("en-IN")}
                    </span>

                  </div>

                </div>

              </div>


              {/* CHECKOUT BUTTON */}
              <button
                onClick={() => router.push("/checkout")}
                className="mt-6 w-full rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800"
              >
                Proceed to Checkout
              </button>


              {/* CONTINUE SHOPPING */}
              <button
                onClick={() => router.push("/")}
                className="mt-3 w-full rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Continue Shopping
              </button>


              {/* SECURITY NOTE */}
              <p className="mt-5 text-center text-xs text-gray-400">
                Secure checkout • Free shipping
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}