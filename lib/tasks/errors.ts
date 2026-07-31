import { logApiError } from "@/lib/api/log-error";
import {
  isMissingTasksSchemaError,
  isSupabaseNetworkError,
} from "@/lib/supabase/server";

export type TaskErrorCode =
  | "NOT_CONFIGURED"
  | "SCHEMA_MISSING"
  | "NETWORK"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION"
  | "UNKNOWN";

export type TaskServiceError = {
  code: TaskErrorCode;
  message: string;
  status: number;
  details?: string;
};

export function mapTaskDbError(
  scope: string,
  error: { message: string },
  context?: Record<string, unknown>
): TaskServiceError {
  logApiError(scope, error, context);

  if (isMissingTasksSchemaError(error.message)) {
    return {
      code: "SCHEMA_MISSING",
      message:
        "Tasks are temporarily unavailable while we finish a database update. Please try again in a few minutes.",
      status: 503,
      details: error.message,
    };
  }

  if (isSupabaseNetworkError(error.message)) {
    return {
      code: "NETWORK",
      message: "Could not reach the database. Please try again.",
      status: 503,
      details: error.message,
    };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong while saving your task. Please try again.",
    status: 500,
    details: error.message,
  };
}

export function taskNotConfiguredError(scope: string): TaskServiceError {
  logApiError(scope, new Error("Supabase admin client unavailable"));
  return {
    code: "NOT_CONFIGURED",
    message: "Tasks are not available right now. Please try again later.",
    status: 503,
  };
}

export function taskValidationError(
  code: string,
  message: string
): TaskServiceError {
  return {
    code: "VALIDATION",
    message,
    status: 400,
    details: code,
  };
}

export function taskNotFoundError(): TaskServiceError {
  return {
    code: "NOT_FOUND",
    message: "Task not found.",
    status: 404,
  };
}
