"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface SelectedItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface OrderSummaryProps {
  selectedItems: SelectedItem[];
  onPromoCodeApplied?: (discount: number, code: string) => void;
  onSaveQuote?: () => void;
}

export default function OrderSummary({
  selectedItems,
  onPromoCodeApplied,
  onSaveQuote,
}: OrderSummaryProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const applyPromoMutation = trpc.items.applyPromoCode.useMutation();

  // Calculate subtotal
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate tax (7%)
  const taxRate = 0.07;
  const tax = subtotal * taxRate;

  // Calculate discount
  const discount = appliedPromo?.discount || 0;

  // Calculate total
  const total = subtotal + tax - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setPromoError("");
    setPromoSuccess("");

    try {
      const result = await applyPromoMutation.mutateAsync({
        code: promoCode.toUpperCase(),
        subtotal,
      });

      // Apply promo
      setAppliedPromo({
        code: result.code,
        discount: result.discountAmount,
      });
      setPromoSuccess(`Promo code applied! You saved $${result.discountAmount.toFixed(2)}`);
      
      if (onPromoCodeApplied) {
        onPromoCodeApplied(result.discountAmount, result.code);
      }
    } catch (error: any) {
      setPromoError(error.message || "Invalid promo code");
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoSuccess("");
    setPromoError("");
    
    if (onPromoCodeApplied) {
      onPromoCodeApplied(0, "");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-4">Order Summary</h3>

      {/* Selected Items */}
      {selectedItems.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">No items selected yet</p>
      ) : (
        <div className="space-y-2 mb-4">
          {selectedItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name} {item.quantity > 1 && `(x${item.quantity})`}
              </span>
              <span className="font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 mb-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700">Tax (7%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm mb-2 text-green-600">
            <span>Discount ({appliedPromo?.code})</span>
            <span className="font-medium">-${discount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Promo Code Section */}
      <div className="mb-4">
        {!appliedPromo ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={applyPromoMutation.isPending}
              />
              <button
                onClick={handleApplyPromo}
                disabled={applyPromoMutation.isPending || !promoCode.trim()}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {applyPromoMutation.isPending ? "..." : "APPLY"}
              </button>
            </div>
            {promoError && (
              <p className="text-red-600 text-xs mt-1">{promoError}</p>
            )}
            {promoSuccess && (
              <p className="text-green-600 text-xs mt-1">{promoSuccess}</p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm font-medium text-green-800">
                {appliedPromo.code} applied
              </span>
            </div>
            <button
              onClick={handleRemovePromo}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total</span>
          <span className="text-2xl font-bold text-orange-600">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Guaranteed Price Badge */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <svg
          className="w-5 h-5 text-blue-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-xs text-blue-800 font-medium">
          Guaranteed Price - No Hidden Fees
        </span>
      </div>

      {/* Save Quote Button */}
      {onSaveQuote && (
        <button
          onClick={onSaveQuote}
          className="w-full py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 mb-2"
        >
          Save This Quote
        </button>
      )}

      {/* Continue Button */}
      <button
        disabled={selectedItems.length === 0}
        className="w-full py-3 px-4 bg-orange-500 text-white font-bold rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Continue to Checkout
      </button>

      {/* Sustainability Message */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-medium text-green-800">
              Eco-Friendly Disposal
            </p>
            <p className="text-xs text-green-700 mt-1">
              We donate and recycle whenever possible
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
