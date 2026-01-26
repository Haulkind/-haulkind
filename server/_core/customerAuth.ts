import { Express } from 'express';
import { db } from '../db';
import { customers } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function registerCustomerAuthRoutes(app: Express) {
    app.post('/customer/auth/signup', async (req, res) => {
          try {
                  const { name, email, password } = req.body;
                  if (!name || !email || !password) {
                            return res.status(400).json({ error: 'Name, email and password are required' });
                  }
                  const existingCustomer = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
                  if (existingCustomer.length > 0) {
                            return res.status(400).json({ error: 'Email already registered' });
                  }
                  const hashedPassword = await bcrypt.hash(password, 10);
                  const [newCustomer] = await db.insert(customers).values({
                            name, email, password: hashedPassword, createdAt: new Date(), updatedAt: new Date()
                  }).returning();
                  const token = jwt.sign({ customerId: newCustomer.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
                  res.json({ token, customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email } });
          } catch (error) {
                  console.error('Signup error:', error);
                  res.status(500).json({ error: 'Failed to create account', details: String(error) });
          }
    });

  app.post('/customer/auth/login', async (req, res) => {
        try {
                const { email, password } = req.body;
                if (!email || !password) {
                          return res.status(400).json({ error: 'Email and password are required' });
                }
                const [customer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
                if (!customer) {
                          return res.status(401).json({ error: 'Invalid email or password' });
                }
                const validPassword = await bcrypt.compare(password, customer.password || '');
                if (!validPassword) {
                          return res.status(401).json({ error: 'Invalid email or password' });
                }
                const token = jwt.sign({ customerId: customer.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
                res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email } });
        } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Failed to login', details: String(error) });
        }
  });
}
