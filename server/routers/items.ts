import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { items, promoCodes, savedQuotes } from "../../drizzle/schema";
import { eq, and, isNull, lte, gte, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// Zod Schemas for explicit output typing
// ============================================================================

const ItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().nullable(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  parentId: z.number().nullable(),
  basePrice: z.string(),
  isPopular: z.boolean().nullable(),
  displayOrder: z.number().nullable(),
  sortOrder: z.number().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ItemsListOutputSchema = z.object({
  items: z.array(ItemSchema),
});

// ============================================================================
// Items Router
// ============================================================================

export const itemsRouter = router({
  // Get items catalog with optional filtering
  list: publicProcedure
    .input(
      z.object({
        parentId: z.union([z.string(), z.number()]).nullable().optional(),
        popular: z.boolean().optional(),
        category: z.string().optional(),
      }).optional()
    )
    .output(ItemsListOutputSchema)
    .query(async ({ input }): Promise<z.infer<typeof ItemsListOutputSchema>> => {
      const db = await getDb();
      if (!db) return { items: [] };
      
      let conditions = [];
      
      if (input?.parentId !== undefined) {
        conditions.push(
          input.parentId === null 
            ? isNull(items.parentId)
            : eq(items.parentId, typeof input.parentId === 'string' ? parseInt(input.parentId) : input.parentId)
        );
      }
      
      if (input?.popular) {
        conditions.push(eq(items.isPopular, true));
      }
      
      if (input?.category) {
        conditions.push(eq(items.category, input.category));
      }
      
      const result = await db
        .select()
        .from(items)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(items.displayOrder);
      
      return { items: result };
    }),

  // Calculate price for selected items
  calculatePrice: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            quantity: z.number().min(1),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Fetch item details
      const itemIds = input.items.map(i => i.id);
      const itemDetails = await db
        .select()
        .from(items)
        .where(
          or(...itemIds.map(id => eq(items.id, parseInt(id))))
        );
      
      // Calculate subtotal
      let subtotal = 0;
      const breakdown = input.items.map(selectedItem => {
        const item = itemDetails.find(i => String(i.id) === selectedItem.id);
        if (!item) {
          throw new Error(`Item ${selectedItem.id} not found`);
        }
        
        const itemTotal = parseFloat(item.basePrice) * selectedItem.quantity;
        subtotal += itemTotal;
        
        return {
          id: item.id,
          name: item.name,
          quantity: selectedItem.quantity,
          pricePerUnit: parseFloat(item.basePrice),
          total: itemTotal,
        };
      });
      
      // Calculate tax (8% for example)
      const taxRate = 0.08;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      
      return {
        subtotal,
        tax,
        taxRate,
        total,
        breakdown,
      };
    }),

  // Apply promo code
  applyPromoCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        subtotal: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Find promo code
      const [promoCode] = await db
        .select()
        .from(promoCodes)
        .where(eq(promoCodes.code, input.code.toUpperCase()))
        .limit(1);
      
      if (!promoCode) {
        throw new Error("Invalid promo code");
      }
      
      // Check if active
      if (!promoCode.isActive) {
        throw new Error("Promo code is no longer active");
      }
      
      // Check dates
      const now = new Date();
      if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
        throw new Error("Promo code is not yet valid");
      }
      if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
        throw new Error("Promo code has expired");
      }
      
      // Check max uses
      if (promoCode.maxUses && promoCode.currentUses !== null && promoCode.currentUses >= promoCode.maxUses) {
        throw new Error("Promo code has reached maximum uses");
      }
      
      // Check minimum order
      if (promoCode.minOrderAmount && input.subtotal < parseFloat(promoCode.minOrderAmount)) {
        throw new Error(`Minimum order amount is $${promoCode.minOrderAmount}`);
      }
      
      // Calculate discount
      let discountAmount = 0;
      if (promoCode.discountType === "percentage") {
        discountAmount = input.subtotal * (parseFloat(promoCode.discountValue) / 100);
      } else {
        discountAmount = parseFloat(promoCode.discountValue);
      }
      
      // Apply max discount cap if exists
      if (promoCode.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, parseFloat(promoCode.maxDiscountAmount));
      }
      
      return {
        valid: true,
        code: promoCode.code,
        discountAmount,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        description: promoCode.description,
      };
    }),

  // Save quote
  saveQuote: publicProcedure
    .input(
      z.object({
        customerInfo: z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string(),
        }),
        serviceAddress: z.object({
          street: z.string(),
          city: z.string(),
          state: z.string(),
          zip: z.string(),
        }),
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            quantity: z.number(),
            pricePerUnit: z.number(),
          })
        ),
        pricing: z.object({
          subtotal: z.number(),
          tax: z.number(),
          discount: z.number().optional(),
          total: z.number(),
        }),
        promoCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Generate quote ID
      const quoteId = `HK-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
      
      // Calculate expiration (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Save quote
      await db.insert(savedQuotes).values({
        id: nanoid(),
        quoteId,
        customerName: input.customerInfo.name,
        customerEmail: input.customerInfo.email,
        customerPhone: input.customerInfo.phone,
        serviceStreet: input.serviceAddress.street,
        serviceCity: input.serviceAddress.city,
        serviceState: input.serviceAddress.state,
        serviceZip: input.serviceAddress.zip,
        items: JSON.stringify(input.items),
        subtotal: input.pricing.subtotal.toString(),
        tax: input.pricing.tax.toString(),
        discount: input.pricing.discount?.toString() || "0",
        total: input.pricing.total.toString(),
        promoCode: input.promoCode || null,
        expiresAt,
        createdAt: new Date(),
      });
      
      return {
        success: true,
        quoteId,
        expiresAt,
      };
    }),

  // Get saved quote
  getQuote: publicProcedure
    .input(
      z.object({
        quoteId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [quote] = await db
        .select()
        .from(savedQuotes)
        .where(eq(savedQuotes.quoteId, input.quoteId))
        .limit(1);
      
      if (!quote) {
        throw new Error("Quote not found");
      }
      
      // Check if expired
      if (new Date(quote.expiresAt) < new Date()) {
        throw new Error("Quote has expired");
      }
      
      return {
        ...quote,
        items: JSON.parse(quote.items as string),
      };
    }),
});
