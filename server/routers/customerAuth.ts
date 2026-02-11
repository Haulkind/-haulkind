import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { createCustomer, getCustomerByUserId } from "../db";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const customerAuthRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).limit(1).then(rows => rows[0]);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const result = await db.insert(users).values({
        email: input.email,
        name: input.name,
        phone: input.phone || null,
        openId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        loginMethod: "email",
        role: "user",
        lastSignedIn: new Date(),
        // @ts-ignore - password field exists but not in type
        password: hashedPassword,
      });

      const userId = Number(result[0].insertId);

      // Create customer profile
      await createCustomer({ userId });

      // Get customer data
      const customer = await getCustomerByUserId(userId);
      if (!customer) {
        throw new Error("Failed to create customer profile");
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId, customerId: customer.id, email: input.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return {
        token,
        customer: {
          id: customer.id,
          name: input.name,
          email: input.email,
          phone: input.phone || "",
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get user by email
      const user = await db.select().from(users).where(eq(users.email, input.email)).limit(1).then(rows => rows[0]);
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      // @ts-ignore - password field exists but not in type
      const isValidPassword = await bcrypt.compare(input.password, user.password || "");
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Get customer profile
      const customer = await getCustomerByUserId(user.id);
      if (!customer) {
        throw new Error("Customer profile not found");
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, customerId: customer.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return {
        token,
        customer: {
          id: customer.id,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        },
      };
    }),
});
