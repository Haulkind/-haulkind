import { getDb } from '../../db';
import { sql } from 'drizzle-orm';

/**
 * Emit an event to a channel (replaces socket.emit)
 * Events are stored in the database and retrieved via polling endpoints
 */
export async function emitEvent(channel: string, eventType: string, data: any) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[emitEvent] Database not available');
      return false;
    }
    
    // Store event in database
    await db.execute(sql`
      INSERT INTO events (channel, event_type, data, created_at)
      VALUES (${channel}, ${eventType}, ${JSON.stringify(data)}, NOW())
    `);
    
    console.log(`[emitEvent] Event emitted: ${channel} / ${eventType}`);
    return true;
  } catch (error) {
    console.error('[emitEvent] Error:', error);
    return false;
  }
}
