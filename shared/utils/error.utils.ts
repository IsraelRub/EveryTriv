/**
 * Error Handling Utilities
 * 
 * @module ErrorUtils
 * @description Centralized error handling utilities for consistent error processing
 * @used_by server/src/features, client/src/services, shared/services
 */
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AxiosErrorLike, NestExceptionName } from '../types/core/error.types';
import { NEST_EXCEPTION_NAMES } from '../constants/core/error.constants';

/**
 * Enhanced error message extraction with specific error type handling
 * @param error - The error to extract message from
 * @returns The error message with enhanced context or 'Unknown error' as fallback
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error instances
  if (error instanceof Error) {
    const errorName = error.constructor.name;

    // Handle Axios errors specifically
    if (errorName === 'AxiosError') {
      const axiosError = error as AxiosErrorLike;
      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timed out. Please check your connection and try again.';
      }
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return 'Unable to connect to server. Please check your connection.';
      }
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      if (axiosError.response?.status) {
        return `Server error (${axiosError.response.status}). Please try again later.`;
      }
      return error.message || 'Network request failed.';
    }

    if (errorName === 'JsonWebTokenError' || errorName === 'TokenExpiredError' || errorName === 'NotBeforeError') {
      return 'Authentication failed. Please log in again.';
    }

    // Handle validation errors (check message content)
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return 'Invalid input data. Please check your information and try again.';
    }

    // Handle database/connection errors
    if (errorName === 'QueryFailedError' || errorName === 'ConnectionTimeoutError') {
      return 'Database operation failed. Please try again later.';
    }

    // Handle timeout errors (check message content)
    if (error.message?.includes('timeout')) {
      return 'Operation timed out. Please try again.';
    }

    // Handle rate limiting errors (check message content)
    if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Handle NestJS exceptions
    if (NEST_EXCEPTION_NAMES.includes(errorName as NestExceptionName)) {
      return error.message || 'Request failed. Please try again.';
    }

    // Default Error
    return error.message || 'An unexpected error occurred.';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle null/undefined
  if (error == null) {
    return 'No error information available.';
  }

  // Handle objects with error-like properties
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Check for message property
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    // Check for error property
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }
  }

  // Fallback for any other type
  return 'Unknown error occurred.';
}

/**
 * Get error stack trace if available
 * @param error - The error to extract stack from
 * @returns The stack trace or 'No stack trace available' as fallback
 */
export function getErrorStack(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || 'No stack trace available';
  }
  return 'No stack trace available';
}

/**
 * Get error type for logging
 * @param error - The error to process
 * @returns Error type string
 */
export function getErrorType(error: unknown): string {
  return error instanceof Error ? error.constructor.name : typeof error;
}

/**
 * Create validation error for field type validation
 * @param field - The field name
 * @param expectedType - The expected type (string, number, boolean)
 * @returns BadRequestException with validation message
 */
export function createValidationError(field: string, expectedType: 'string' | 'number' | 'boolean'): BadRequestException {
  return new BadRequestException(`${field} must be a ${expectedType}`);
}

/**
 * Create validation error for string length validation
 * @param field - The field name
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns BadRequestException with validation message
 */
export function createStringLengthValidationError(field: string, minLength?: number, maxLength?: number): BadRequestException {
  if (minLength && maxLength) {
    return new BadRequestException(`${field} must be between ${minLength} and ${maxLength} characters`);
  }
  if (minLength) {
    return new BadRequestException(`${field} must be at least ${minLength} characters long`);
  }
  if (maxLength) {
    return new BadRequestException(`${field} must be less than ${maxLength} characters`);
  }
  return new BadRequestException(`${field} must be a valid string`);
}

/**
 * Create storage operation error
 * @param operation - The storage operation that failed
 * @param originalError - The original error (optional)
 * @returns InternalServerErrorException with storage error message
 */
export function createStorageError(operation: string, originalError?: unknown): InternalServerErrorException {
  const message = originalError ? `Failed to ${operation}: ${getErrorMessage(originalError)}` : `Failed to ${operation}`;
  return new InternalServerErrorException(message);
}

/**
 * Create server operation error
 * @param operation - The server operation that failed
 * @param originalError - The original error
 * @returns InternalServerErrorException with server error message
 */
export function createServerError(operation: string, originalError: unknown): InternalServerErrorException {
  return new InternalServerErrorException(`Failed to ${operation}: ${getErrorMessage(originalError)}`);
}

/**
 * Create not found error
 * @param resource - The resource that was not found
 * @returns NotFoundException with not found message
 */
export function createNotFoundError(resource: string): NotFoundException {
  return new NotFoundException(`${resource} not found`);
}
