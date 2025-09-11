/**
 * AI Models types for EveryTriv
 *
 * @module AIModelsTypes
 * @description Type definitions for AI models and their configurations
 */

// AIModel is already exported from ai.types.ts

/**
 * AI model configuration interface
 * @interface AIModelConfig
 * @description Configuration for AI models
 */
export interface AIModelConfig {
	/** Model name */
	name: string;
	/** Model provider */
	provider: string;
	/** Model version */
	version: string;
	/** Model description */
	description: string;
	/** Model capabilities */
	capabilities: string[];
	/** Model limitations */
	limitations: string[];
	/** Model parameters */
	parameters: {
		/** Maximum tokens */
		maxTokens: number;
		/** Context length */
		contextLength: number;
		/** Temperature range */
		temperatureRange: {
			min: number;
			max: number;
		};
		/** Top P range */
		topPRange: {
			min: number;
			max: number;
		};
		/** Frequency penalty range */
		frequencyPenaltyRange: {
			min: number;
			max: number;
		};
		/** Presence penalty range */
		presencePenaltyRange: {
			min: number;
			max: number;
		};
	};
	/** Model pricing */
	pricing: {
		/** Input tokens cost per 1K */
		inputTokensCostPer1K: number;
		/** Output tokens cost per 1K */
		outputTokensCostPer1K: number;
		/** Currency */
		currency: string;
	};
	/** Model performance */
	performance: {
		/** Average response time */
		averageResponseTime: number;
		/** Throughput */
		throughput: number;
		/** Accuracy score */
		accuracyScore: number;
		/** Quality score */
		qualityScore: number;
	};
	/** Model availability */
	availability: {
		/** Is available */
		isAvailable: boolean;
		/** Availability regions */
		regions: string[];
		/** Maintenance schedule */
		maintenanceSchedule?: {
			start: Date;
			end: Date;
		};
	};
}

/**
 * AI model selection interface
 * @interface AIModelSelection
 * @description Model selection criteria
 */
export interface AIModelSelection {
	/** Task type */
	taskType: string;
	/** Quality requirements */
	qualityRequirements: {
		/** Minimum accuracy */
		minimumAccuracy: number;
		/** Maximum response time */
		maximumResponseTime: number;
		/** Required capabilities */
		requiredCapabilities: string[];
	};
	/** Cost constraints */
	costConstraints: {
		/** Maximum cost per request */
		maximumCostPerRequest: number;
		/** Budget limit */
		budgetLimit: number;
	};
	/** Performance requirements */
	performanceRequirements: {
		/** Minimum throughput */
		minimumThroughput: number;
		/** Maximum latency */
		maximumLatency: number;
		/** Availability requirements */
		availabilityRequirements: number;
	};
}

/**
 * AI model comparison interface
 * @interface AIModelComparison
 * @description Model comparison data
 */
export interface AIModelComparison {
	/** Models compared */
	models: string[];
	/** Comparison criteria */
	criteria: {
		/** Accuracy */
		accuracy: Record<string, number>;
		/** Speed */
		speed: Record<string, number>;
		/** Cost */
		cost: Record<string, number>;
		/** Quality */
		quality: Record<string, number>;
		/** Availability */
		availability: Record<string, number>;
	};
	/** Recommendations */
	recommendations: {
		/** Best overall */
		bestOverall: string;
		/** Best for accuracy */
		bestForAccuracy: string;
		/** Best for speed */
		bestForSpeed: string;
		/** Best for cost */
		bestForCost: string;
		/** Best for quality */
		bestForQuality: string;
	};
	/** Comparison summary */
	summary: {
		/** Winner */
		winner: string;
		/** Reasoning */
		reasoning: string;
		/** Trade-offs */
		tradeOffs: string[];
	};
}
