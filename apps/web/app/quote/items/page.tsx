"use client";

import { useState } from "react";
import ItemPicker from "../../../components/ItemPicker";
import OrderSummary from "../../../components/OrderSummary";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

interface SelectedItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export default function ItemsPage() {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const handleItemsChange = (items: SelectedItem[]) => {
    setSelectedItems(items);
  };

  const handlePromoCodeApplied = (discount: number, code: string) => {
    if (discount > 0) {
      setAppliedPromoCode({ code, discount });
    } else {
      setAppliedPromoCode(null);
    }
  };

  const handleSaveQuote = async () => {
    if (selectedItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    // TODO: Implement save quote functionality
    // For now, just show alert
    alert("Save quote functionality coming soon!");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Select Your Items</h1>
            <p className="text-gray-600">
              Choose the items you need removed and we'll calculate your price instantly
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Item Picker - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <ItemPicker onItemsChange={handleItemsChange} />
            </div>

            {/* Order Summary - Takes 1 column, sticky on large screens */}
            <div className="lg:col-span-1">
              <OrderSummary
                selectedItems={selectedItems}
                onPromoCodeApplied={handlePromoCodeApplied}
                onSaveQuote={handleSaveQuote}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Guaranteed Price</h3>
                  <p className="text-sm text-gray-600">
                    The price you see is the price you pay. No hidden fees or surprises.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold mb-1">Same-Day Service</h3>
                  <p className="text-sm text-gray-600">
                    Book today and we'll haul your junk away as soon as tomorrow.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                </div>
                <div>
                  <h3 className="font-bold mb-1">Eco-Friendly</h3>
                  <p className="text-sm text-gray-600">
                    We donate and recycle up to 70% of items we haul away.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
