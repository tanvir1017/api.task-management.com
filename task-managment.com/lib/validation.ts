/**
 * Validation utilities for form inputs and data validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  feedback: string[];
} {
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Password must contain at least one number');
  }

  return {
    isValid: feedback.length === 0,
    feedback,
  };
}

/**
 * Validate task input
 */
export function validateTask(data: {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.title?.trim()) {
    errors.push({
      field: 'title',
      message: 'Task title is required',
    });
  }

  if (data.title && data.title.length > 255) {
    errors.push({
      field: 'title',
      message: 'Task title must be less than 255 characters',
    });
  }

  if (data.description && data.description.length > 1000) {
    errors.push({
      field: 'description',
      message: 'Task description must be less than 1000 characters',
    });
  }

  if (!data.assignedTo?.trim()) {
    errors.push({
      field: 'assignedTo',
      message: 'Assigned user is required',
    });
  }

  if (data.status && !['PENDING', 'PROCESSING', 'DONE'].includes(data.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid task status',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => e.message).join(', ');
}
