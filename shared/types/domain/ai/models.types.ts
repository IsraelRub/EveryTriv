/**
 * AI Models types for EveryTriv
 *
 * @module AIModelsTypes
 * @description Type definitions for AI models and their configurations
 */

/**
 * AI model configuration interface
 * @interface AIModelConfig
 * @description Configuration for AI models
 */
export interface AIModelConfig {
	name: string;
	provider: string;
	version: string;
	description: string;
	capabilities: string[];
	limitations: string[];
	parameters: {
		maxTokens: number;
		contextLength: number;
		temperatureRange: {
			min: number;
			max: number;
		};
		topPRange: {
			min: number;
			max: number;
		};
		frequencyPenaltyRange: {
			min: number;
			max: number;
		};
		presencePenaltyRange: {
			min: number;
			max: number;
		};
	};
	pricing: {
		inputTokensCostPer1K: number;
		outputTokensCostPer1K: number;
		currency: string;
	};
	performance: {
		averageResponseTime: number;
		throughput: number;
		accuracyScore: number;
		qualityScore: number;
	};
	availability: {
		isAvailable: boolean;
		regions: string[];
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
	taskType: string;
	qualityRequirements: {
		minimumAccuracy: number;
		maximumResponseTime: number;
		requiredCapabilities: string[];
	};
	costConstraints: {
		maximumCostPerRequest: number;
		budgetLimit: number;
	};
	performanceRequirements: {
		minimumThroughput: number;
		maximumLatency: number;
		availabilityRequirements: number;
	};
}

/**
 * AI model comparison interface
 * @interface AIModelComparison
 * @description Model comparison data
 */
export interface AIModelComparison {
	models: string[];
	criteria: {
		accuracy: Record<string, number>;
		speed: Record<string, number>;
		cost: Record<string, number>;
		quality: Record<string, number>;
		availability: Record<string, number>;
	};
	recommendations: {
		bestOverall: string;
		bestForAccuracy: string;
		bestForSpeed: string;
		bestForCost: string;
		bestForQuality: string;
	};
	summary: {
		winner: string;
		reasoning: string;
		tradeOffs: string[];
	};
}
