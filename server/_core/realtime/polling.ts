import { Router, Request, Response } from 'express';
import { getDb } from '../../db';
import { sql } from 'drizzle-orm';

export const pollingRouter = Router();

// Short polling endpoint - returns immediately with current events
pollingRouter.get('/updates', async (req: Request, res: Response) => {
  try {
    const { channel, since } = req.query;
    
    if (!channel) {
      return res.status(400).json({ error: 'Channel parameter is required' });
    }
    
    const sinceTimestamp = since ? parseInt(since as string) : 0;
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Get events from the database
    const result = await db.execute(sql`
      SELECT id, channel, event_type, data, created_at
      FROM events
      WHERE channel = ${channel as string}
      AND EXTRACT(EPOCH FROM created_at) * 1000 > ${sinceTimestamp}
      ORDER BY created_at ASC
      LIMIT 100
    `);
    
    const events = (result as any)[0] || [];
    
    // Return events with current timestamp
    res.json({
      events: events.map((e: any) => ({
        id: e.id,
        channel: e.channel,
        type: e.event_type,
        data: typeof e.data === 'string' ? JSON.parse(e.data) : e.data,
        timestamp: new Date(e.created_at).getTime()
      })),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Polling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Long polling endpoint - waits up to 25s for new events
pollingRouter.get('/updates/long', async (req: Request, res: Response) => {
  try {
    const { channel, since } = req.query;
    
    if (!channel) {
      return res.status(400).json({ error: 'Channel parameter is required' });
    }
    
    const sinceTimestamp = since ? parseInt(since as string) : 0;
    const timeout = 25000; // 25 seconds
    const pollInterval = 1000; // Check every 1 second
    const startTime = Date.now();
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Function to check for new events
    const checkForEvents = async (): Promise<any[]> => {
      const result = await db.execute(sql`
        SELECT id, channel, event_type, data, created_at
        FROM events
        WHERE channel = ${channel as string}
        AND EXTRACT(EPOCH FROM created_at) * 1000 > ${sinceTimestamp}
        ORDER BY created_at ASC
        LIMIT 100
      `);
      
      return (result as any)[0] || [];
    };
    
    // Poll for events
    const poll = async () => {
      while (Date.now() - startTime < timeout) {
        const events = await checkForEvents();
        
        if (events.length > 0) {
          // Found events, return immediately
          return res.json({
            events: events.map((e: any) => ({
              id: e.id,
              channel: e.channel,
              type: e.event_type,
              data: typeof e.data === 'string' ? JSON.parse(e.data) : e.data,
              timestamp: new Date(e.created_at).getTime()
            })),
            timestamp: Date.now()
          });
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
      // Timeout reached, return empty array
      res.json({
        events: [],
        timestamp: Date.now()
      });
    };
    
    await poll();
  } catch (error) {
    console.error('Long polling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
