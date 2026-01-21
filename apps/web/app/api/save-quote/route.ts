import { NextResponse } from "next/server";
import { getDb } from "../../../../../server/db";
import { savedQuotes } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

// Generate unique quote ID: HK-2026-XXXXX
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);

function generateQuoteId(): string {
  const year = new Date().getFullYear();
  const id = nanoid();
  return `HK-${year}-${id}`;
}

/**
 * POST /api/save-quote
 * Save a quote for later retrieval
 * 
 * Request body:
 * {
 *   customerEmail: string,
 *   customerName?: string,
 *   customerPhone?: string,
 *   serviceType: "HAUL_AWAY" | "LABOR_ONLY",
 *   items: Array<{ id: number, name: string, quantity: number, price: number }>,
 *   location: { address: string, city: string, state: string, zip: string },
 *   subtotal: number,
 *   discount: number,
 *   totalPrice: number,
 *   promoCodeUsed?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      customerPhone,
      serviceType,
      items,
      location,
      subtotal,
      discount,
      totalPrice,
      promoCodeUsed,
    } = body;

    // Validate required fields
    if (!customerEmail || !serviceType || !items || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Generate unique quote ID
    const quoteId = generateQuoteId();

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Insert quote
    await db.insert(savedQuotes).values({
      quoteId,
      customerEmail,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      serviceType,
      itemsJson: JSON.stringify(items),
      locationJson: JSON.stringify(location),
      subtotal: subtotal.toString(),
      discount: discount.toString(),
      totalPrice: totalPrice.toString(),
      promoCodeUsed: promoCodeUsed || null,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      quote: {
        quoteId,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[API] Error saving quote:", error);
    return NextResponse.json(
      { error: "Failed to save quote" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/save-quote?id=HK-2026-XXXXX
 * Retrieve a saved quote by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get("id");

    if (!quoteId) {
      return NextResponse.json(
        { error: "Quote ID is required" },
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

    // Find quote
    const result = await db
      .select()
      .from(savedQuotes)
      .where(eq(savedQuotes.quoteId, quoteId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const quote = result[0];

    // Check if expired
    if (new Date() > new Date(quote.expiresAt)) {
      return NextResponse.json(
        { error: "Quote has expired" },
        { status: 410 }
      );
    }

    // Parse JSON fields
    const items = JSON.parse(quote.itemsJson as string);
    const location = JSON.parse(quote.locationJson as string);

    return NextResponse.json({
      success: true,
      quote: {
        quoteId: quote.quoteId,
        customerEmail: quote.customerEmail,
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        serviceType: quote.serviceType,
        items,
        location,
        subtotal: parseFloat(quote.subtotal),
        discount: parseFloat(quote.discount),
        totalPrice: parseFloat(quote.totalPrice),
        promoCodeUsed: quote.promoCodeUsed,
        expiresAt: quote.expiresAt,
        createdAt: quote.createdAt,
      },
    });
  } catch (error) {
    console.error("[API] Error retrieving quote:", error);
    return NextResponse.json(
      { error: "Failed to retrieve quote" },
      { status: 500 }
    );
  }
}
