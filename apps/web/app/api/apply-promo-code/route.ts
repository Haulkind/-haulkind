import { NextResponse } from "next/server";
import { getDb } from "../../../../../server/db";
import { promoCodes } from "../../../../../drizzle/schema";
import { eq, and, lte, gte } from "drizzle-orm";

/**
 * POST /api/apply-promo-code
 * Validate and apply promo code to calculate discount
 * 
 * Request body:
 * {
 *   code: string,
 *   subtotal: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Promo code is required" },
        { status: 400 }
      );
    }

    if (!subtotal || typeof subtotal !== "number") {
      return NextResponse.json(
        { error: "Subtotal is required" },
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

    // Find promo code
    const now = new Date();
    const promoResult = await db
      .select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.code, code.toUpperCase()),
          eq(promoCodes.isActive, true),
          lte(promoCodes.validFrom, now),
          gte(promoCodes.validUntil, now)
        )
      )
      .limit(1);

    if (promoResult.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid or expired promo code" 
        },
        { status: 404 }
      );
    }

    const promo = promoResult[0];

    // Check if max uses exceeded
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return NextResponse.json(
        { 
          success: false,
          error: "Promo code has reached maximum usage limit" 
        },
        { status: 400 }
      );
    }

    // Check minimum order value
    if (promo.minOrderValue !== null) {
      const minValue = parseFloat(promo.minOrderValue);
      if (subtotal < minValue) {
        return NextResponse.json(
          { 
            success: false,
            error: `Minimum order value of $${minValue.toFixed(2)} required` 
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount
    let discount = 0;
    const discountValue = parseFloat(promo.discountValue);

    if (promo.discountType === "percentage") {
      discount = (subtotal * discountValue) / 100;
      
      // Apply max discount cap if exists
      if (promo.maxDiscount !== null) {
        const maxDiscount = parseFloat(promo.maxDiscount);
        discount = Math.min(discount, maxDiscount);
      }
    } else if (promo.discountType === "fixed") {
      discount = discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      success: true,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: discountValue,
        discount: parseFloat(discount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("[API] Error applying promo code:", error);
    return NextResponse.json(
      { error: "Failed to apply promo code" },
      { status: 500 }
    );
  }
}
