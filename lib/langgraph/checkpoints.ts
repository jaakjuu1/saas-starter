/**
 * PostgreSQL Checkpoint Implementation for LangGraph
 * 
 * This file implements LangGraph checkpointing using PostgreSQL for production persistence.
 * It replaces MemorySaver and provides state recovery mechanisms and time-travel debugging support.
 */

import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { pgTable, text, jsonb, timestamp, varchar, serial } from 'drizzle-orm/pg-core';

// Define checkpoint storage table
export const langGraphCheckpoints = pgTable('langgraph_checkpoints', {
  id: serial('id').primaryKey(),
  threadId: varchar('thread_id', { length: 255 }).notNull(),
  checkpointId: varchar('checkpoint_id', { length: 255 }).notNull(),
  parentCheckpointId: varchar('parent_checkpoint_id', { length: 255 }),
  checkpointData: jsonb('checkpoint_data').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * PostgreSQL-based checkpoint saver for LangGraph state persistence
 */
export class PostgreSQLCheckpointSaver extends BaseCheckpointSaver {
  constructor() {
    super();
  }

  /**
   * Serialize checkpoint data to JSON
   */
  private serializeCheckpoint(checkpoint: Checkpoint): any {
    return {
      v: checkpoint.v,
      id: checkpoint.id,
      ts: checkpoint.ts,
      pending_sends: checkpoint.pending_sends || [],
      channel_versions: checkpoint.channel_versions || {},
      versions_seen: checkpoint.versions_seen || {},
      // Convert the channel_values Map to a plain object for JSON storage
      channel_values: Object.fromEntries(checkpoint.channel_values || new Map())
    };
  }

  /**
   * Deserialize checkpoint data from JSON
   */
  private deserializeCheckpoint(data: any): Checkpoint {
    return {
      v: data.v,
      id: data.id,
      ts: data.ts,
      pending_sends: data.pending_sends || [],
      channel_versions: data.channel_versions || {},
      versions_seen: data.versions_seen || {},
      // Convert the plain object back to a Map
      channel_values: new Map(Object.entries(data.channel_values || {}))
    };
  }

  /**
   * Get a checkpoint by thread ID and checkpoint ID
   */
  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) {
      return undefined;
    }

    try {
      let query = db
        .select()
        .from(langGraphCheckpoints)
        .where(sql`thread_id = ${threadId}`);

      if (checkpointId) {
        query = query.where(sql`checkpoint_id = ${checkpointId}`);
      } else {
        // Get the latest checkpoint if no specific ID provided
        query = query.orderBy(sql`created_at DESC`).limit(1);
      }

      const results = await query;
      
      if (results.length === 0) {
        return undefined;
      }

      const row = results[0];
      const checkpoint = this.deserializeCheckpoint(row.checkpointData);
      const metadata: CheckpointMetadata = row.metadata as CheckpointMetadata || {};

      const parentConfig = row.parentCheckpointId ? {
        configurable: {
          thread_id: threadId,
          checkpoint_id: row.parentCheckpointId
        }
      } : undefined;

      return {
        config: {
          configurable: {
            thread_id: threadId,
            checkpoint_id: row.checkpointId
          }
        },
        checkpoint,
        metadata,
        parentConfig
      };

    } catch (error) {
      console.error('[PostgreSQLCheckpointSaver] Error getting checkpoint:', error);
      return undefined;
    }
  }

  /**
   * List checkpoints for a thread with optional filtering
   */
  async *list(
    config: RunnableConfig,
    options?: {
      filter?: Record<string, any>;
      before?: RunnableConfig;
      limit?: number;
    }
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    
    if (!threadId) {
      return;
    }

    try {
      let query = db
        .select()
        .from(langGraphCheckpoints)
        .where(sql`thread_id = ${threadId}`)
        .orderBy(sql`created_at DESC`);

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.before?.configurable?.checkpoint_id) {
        const beforeResult = await db
          .select({ createdAt: langGraphCheckpoints.createdAt })
          .from(langGraphCheckpoints)
          .where(sql`thread_id = ${threadId} AND checkpoint_id = ${options.before.configurable.checkpoint_id}`)
          .limit(1);

        if (beforeResult.length > 0) {
          query = query.where(sql`created_at < ${beforeResult[0].createdAt}`);
        }
      }

      const results = await query;

      for (const row of results) {
        // Apply filter if provided
        if (options?.filter) {
          const metadata = row.metadata as any || {};
          let matches = true;
          
          for (const [key, value] of Object.entries(options.filter)) {
            if (metadata[key] !== value) {
              matches = false;
              break;
            }
          }
          
          if (!matches) {
            continue;
          }
        }

        const checkpoint = this.deserializeCheckpoint(row.checkpointData);
        const metadata: CheckpointMetadata = row.metadata as CheckpointMetadata || {};

        const parentConfig = row.parentCheckpointId ? {
          configurable: {
            thread_id: threadId,
            checkpoint_id: row.parentCheckpointId
          }
        } : undefined;

        yield {
          config: {
            configurable: {
              thread_id: threadId,
              checkpoint_id: row.checkpointId
            }
          },
          checkpoint,
          metadata,
          parentConfig
        };
      }

    } catch (error) {
      console.error('[PostgreSQLCheckpointSaver] Error listing checkpoints:', error);
      return;
    }
  }

  /**
   * Save a checkpoint to PostgreSQL
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: Record<string, string | number> = {}
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    const checkpointId = checkpoint.id;

    if (!threadId || !checkpointId) {
      throw new Error('thread_id and checkpoint_id are required for saving checkpoints');
    }

    try {
      const serializedCheckpoint = this.serializeCheckpoint(checkpoint);
      
      // Determine parent checkpoint ID from config
      const parentCheckpointId = config.configurable?.checkpoint_id !== checkpointId 
        ? config.configurable?.checkpoint_id 
        : undefined;

      // Insert or update checkpoint
      await db.execute(sql`
        INSERT INTO ${langGraphCheckpoints} 
        (thread_id, checkpoint_id, parent_checkpoint_id, checkpoint_data, metadata)
        VALUES (${threadId}, ${checkpointId}, ${parentCheckpointId || null}, ${JSON.stringify(serializedCheckpoint)}, ${JSON.stringify(metadata)})
        ON CONFLICT (thread_id, checkpoint_id) 
        DO UPDATE SET 
          checkpoint_data = EXCLUDED.checkpoint_data,
          metadata = EXCLUDED.metadata,
          created_at = NOW()
      `);

      console.log(`[PostgreSQLCheckpointSaver] Saved checkpoint ${checkpointId} for thread ${threadId}`);

      return {
        configurable: {
          thread_id: threadId,
          checkpoint_id: checkpointId
        }
      };

    } catch (error) {
      console.error(`[PostgreSQLCheckpointSaver] Error saving checkpoint ${checkpointId}:`, error);
      throw new Error(`Failed to save checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete checkpoints for a thread (cleanup)
   */
  async delete(config: RunnableConfig): Promise<void> {
    const threadId = config.configurable?.thread_id;
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) {
      throw new Error('thread_id is required for deleting checkpoints');
    }

    try {
      if (checkpointId) {
        // Delete specific checkpoint
        await db.execute(sql`
          DELETE FROM ${langGraphCheckpoints} 
          WHERE thread_id = ${threadId} AND checkpoint_id = ${checkpointId}
        `);
        console.log(`[PostgreSQLCheckpointSaver] Deleted checkpoint ${checkpointId} for thread ${threadId}`);
      } else {
        // Delete all checkpoints for thread
        await db.execute(sql`
          DELETE FROM ${langGraphCheckpoints} 
          WHERE thread_id = ${threadId}
        `);
        console.log(`[PostgreSQLCheckpointSaver] Deleted all checkpoints for thread ${threadId}`);
      }

    } catch (error) {
      console.error(`[PostgreSQLCheckpointSaver] Error deleting checkpoints:`, error);
      throw new Error(`Failed to delete checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Cleanup old checkpoints (should be run periodically)
 */
export async function cleanupOldCheckpoints(olderThanDays: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await db.execute(sql`
      DELETE FROM ${langGraphCheckpoints} 
      WHERE created_at < ${cutoffDate.toISOString()}
    `);

    const deletedCount = result.rowCount || 0;
    console.log(`[PostgreSQLCheckpointSaver] Cleaned up ${deletedCount} old checkpoints`);
    return deletedCount;

  } catch (error) {
    console.error('[PostgreSQLCheckpointSaver] Error during cleanup:', error);
    throw error;
  }
}

/**
 * Get checkpoint statistics for monitoring
 */
export async function getCheckpointStats(): Promise<{
  totalCheckpoints: number;
  uniqueThreads: number;
  averageCheckpointsPerThread: number;
  oldestCheckpoint: string | null;
  newestCheckpoint: string | null;
}> {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_checkpoints,
        COUNT(DISTINCT thread_id) as unique_threads,
        AVG(checkpoints_per_thread) as avg_checkpoints_per_thread,
        MIN(created_at) as oldest_checkpoint,
        MAX(created_at) as newest_checkpoint
      FROM (
        SELECT 
          thread_id,
          COUNT(*) as checkpoints_per_thread,
          MIN(created_at) as created_at
        FROM ${langGraphCheckpoints}
        GROUP BY thread_id
      ) thread_stats
    `);

    const stats = result.rows[0] as any;

    return {
      totalCheckpoints: parseInt(stats.total_checkpoints) || 0,
      uniqueThreads: parseInt(stats.unique_threads) || 0,
      averageCheckpointsPerThread: parseFloat(stats.avg_checkpoints_per_thread) || 0,
      oldestCheckpoint: stats.oldest_checkpoint,
      newestCheckpoint: stats.newest_checkpoint
    };

  } catch (error) {
    console.error('[PostgreSQLCheckpointSaver] Error getting stats:', error);
    return {
      totalCheckpoints: 0,
      uniqueThreads: 0,
      averageCheckpointsPerThread: 0,
      oldestCheckpoint: null,
      newestCheckpoint: null
    };
  }
}

/**
 * Create a checkpoint saver instance with proper configuration
 */
export function createPostgreSQLCheckpointSaver(): PostgreSQLCheckpointSaver {
  return new PostgreSQLCheckpointSaver();
}

/**
 * Time-travel debugging: Get state at specific checkpoint
 */
export async function getStateAtCheckpoint(
  threadId: string,
  checkpointId: string
): Promise<any> {
  const saver = new PostgreSQLCheckpointSaver();
  
  const tuple = await saver.getTuple({
    configurable: {
      thread_id: threadId,
      checkpoint_id: checkpointId
    }
  });

  if (!tuple) {
    throw new Error(`Checkpoint ${checkpointId} not found for thread ${threadId}`);
  }

  return {
    checkpoint: tuple.checkpoint,
    metadata: tuple.metadata,
    state: Object.fromEntries(tuple.checkpoint.channel_values || new Map()),
    timestamp: tuple.metadata?.timestamp || 'unknown'
  };
}

/**
 * Get checkpoint history for a thread (useful for debugging)
 */
export async function getCheckpointHistory(
  threadId: string,
  limit: number = 50
): Promise<Array<{
  checkpointId: string;
  parentCheckpointId?: string;
  createdAt: string;
  metadata: any;
  statePreview: any;
}>> {
  try {
    const results = await db
      .select({
        checkpointId: langGraphCheckpoints.checkpointId,
        parentCheckpointId: langGraphCheckpoints.parentCheckpointId,
        checkpointData: langGraphCheckpoints.checkpointData,
        metadata: langGraphCheckpoints.metadata,
        createdAt: langGraphCheckpoints.createdAt,
      })
      .from(langGraphCheckpoints)
      .where(sql`thread_id = ${threadId}`)
      .orderBy(sql`created_at DESC`)
      .limit(limit);

    return results.map(row => {
      const checkpoint = row.checkpointData as any;
      const channelValues = checkpoint?.channel_values || {};
      
      // Create a preview of the state (first few keys)
      const stateKeys = Object.keys(channelValues).slice(0, 5);
      const statePreview = stateKeys.reduce((preview, key) => {
        preview[key] = channelValues[key];
        return preview;
      }, {} as any);

      return {
        checkpointId: row.checkpointId,
        parentCheckpointId: row.parentCheckpointId || undefined,
        createdAt: row.createdAt.toISOString(),
        metadata: row.metadata || {},
        statePreview
      };
    });

  } catch (error) {
    console.error('[PostgreSQLCheckpointSaver] Error getting history:', error);
    return [];
  }
}