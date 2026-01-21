import { NextResponse } from "next/server";
import { getDb } from "../../../../../server/db";
import { items } from "../../../../../drizzle/schema";
import { inArray } from "drizzle-orm";

/**
 * POST /api/calculate-price
 * Calculate total price based on selected items
 * 
 * Request body:
 * {
 *   items: Array<{ id: number, quantity: number }>,
 *   promoCode?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items: selectedItems, promoCode } = body;

    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Get item details from database
    const itemIds = selectedItems.map((item) => item.id);
    const itemsData = await db
      .select()
      .from(items)
      .where(inArray(items.id, itemIds));

    if (itemsData.length === 0) {
      return NextResponse.json(
        { error: "No valid items found" },
        { status: 404 }
      );
    }

    // Calculate subtotal
    let subtotal = 0;
    const lineItems = selectedItems.map((selectedItem) => {
      const itemData = itemsData.find((i) => i.id === selectedItem.id);
      if (!itemData) {
        return null;
      }

      const price = parseFloat(itemData.basePrice);
      const quantity = selectedItem.quantity || 1;
      const lineTotal = price * quantity;
      subtotal += lineTotal;

      return {
        id: itemData.id,
        name: itemData.name,
        price: price,
        quantity: quantity,
        total: lineTotal,
      };
    }).filter(Boolean);

    // Calculate tax (example: 7% sales tax)
    const taxRate = 0.07;
    const tax = subtotal * taxRate;

    // Calculate discount (if promo code provided)
    let discount = 0;
    let promoCodeApplied = null;

    if (promoCode) {
      // TODO: Implement promo code validation
      // For now, just return 0 discount
      discount = 0;
    }

    // Calculate total
    const total = subtotal + tax - discount;

    return NextResponse.json({
      success: true,
      pricing: {
        lineItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        promoCodeApplied,
      },
    });
  } catch (error) {
    console.error("[API] Error calculating price:", error);
    return NextResponse.json(
      { error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
