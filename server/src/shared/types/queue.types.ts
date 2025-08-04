export interface QueueItem {
  id: string;
  topic: string;
  difficulty: string;
  priority: number;
  timestamp: number;
  retries: number;
  userId?: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface QueueStats {
  totalItems: number;
  processingItems: number;
  averageWaitTime: number;
  itemsByPriority: Record<number, number>;
  itemsByStatus: Record<QueueItem["status"], number>;
}

export interface QueueConfig {
  maxRetries?: number;
  processingTimeout?: number;
}
