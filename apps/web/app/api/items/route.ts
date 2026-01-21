import { NextResponse } from "next/server";
import { getDb } from "../../../../../server/db";
import { items } from "../../../../../drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";

/**
 * GET /api/items
 * Fetch items catalog with optional filters
 * 
 * Query params:
 * - parentId: Filter by parent category (null for main categories)
 * - popular: Filter popular items only (true/false)
 * - category: Filter by category slug
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentIdParam = searchParams.get("parentId");
    const popularParam = searchParams.get("popular");
    const categorySlug = searchParams.get("category");

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Build query conditions
    const conditions = [eq(items.isActive, true)];

    // Filter by parentId
    if (parentIdParam === "null" || parentIdParam === "") {
      conditions.push(isNull(items.parentId));
    } else if (parentIdParam) {
      conditions.push(eq(items.parentId, parseInt(parentIdParam)));
    }

    // Filter by popular
    if (popularParam === "true") {
      conditions.push(eq(items.isPopular, true));
    }

    // Filter by category slug (find parent first, then get children)
    if (categorySlug) {
      const categoryResult = await db
        .select()
        .from(items)
        .where(and(eq(items.slug, categorySlug), isNull(items.parentId)))
        .limit(1);

      if (categoryResult.length > 0) {
        conditions.push(eq(items.parentId, categoryResult[0].id));
      }
    }

    // Execute query
    const result = await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(items.sortOrder, items.name);

    return NextResponse.json({
      success: true,
      items: result,
      count: result.length,
    });
  } catch (error) {
    console.error("[API] Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
