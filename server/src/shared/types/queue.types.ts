/**
 * Queue-related types for the server
 */

export interface QueueItem {
  id: string;
  topic: string;
  difficulty: string;
  priority: number;
  timestamp: number;
  retries: number;
  userId?: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
}

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number;
  itemsByPriority: Record<number, number>;
  itemsByStatus: Record<QueueItem["status"], number>;
}

export interface QueueConfig {
  maxRetries?: number;
  processingTimeout?: number;
  maxConcurrentJobs?: number;
}
