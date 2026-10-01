"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("id");

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
          ✓
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          Order Placed!
        </h1>

        <p className="mt-3 text-gray-600">
          Thank you for your purchase.
        </p>

        {orderId && (
          <p className="mt-4 text-sm text-gray-500">
            Order ID:{" "}
            <span className="font-semibold text-gray-900">
              #{orderId}
            </span>
          </p>
        )}

        <button
          onClick={() => router.push("/")}
          className="mt-8 w-full rounded-lg bg-black px-6 py-4 font-semibold text-white hover:bg-gray-800"
        >
          Continue Shopping
        </button>

      </div>

    </main>
  );
}