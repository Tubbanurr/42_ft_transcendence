export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Validators {
  public static validate(value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];

    if (rules.required && this.isEmpty(value)) {
      errors.push('This field is required');
    }

    if (this.isEmpty(value) && !rules.required) {
      return { isValid: true, errors: [] };
    }

    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Must be at least ${rules.minLength} characters long`);
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Must be no more than ${rules.maxLength} characters long`);
      }
    }

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`Must be at least ${rules.min}`);
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push(`Must be no more than ${rules.max}`);
      }
    }

    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push('Invalid format');
    }

    if (rules.email && !this.isValidEmail(value)) {
      errors.push('Invalid email address');
    }

    if (rules.url && !this.isValidUrl(value)) {
      errors.push('Invalid URL');
    }

    if (rules.custom) {
      const customResult = rules.custom(value);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (!customResult) {
        errors.push('Invalid value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public static validateObject(
    obj: Record<string, any>,
    schema: Record<string, ValidationRule>
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    Object.entries(schema).forEach(([key, rules]) => {
      results[key] = this.validate(obj[key], rules);
    });

    return results;
  }

  public static isObjectValid(results: Record<string, ValidationResult>): boolean {
    return Object.values(results).every(result => result.isValid);
  }

  public static getObjectErrors(results: Record<string, ValidationResult>): string[] {
    return Object.values(results).flatMap(result => result.errors);
  }

  public static isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  public static isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }

  public static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  public static isValidDate(date: string): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }

  public static isValidAge(age: number, minAge: number = 13, maxAge: number = 120): boolean {
    return age >= minAge && age <= maxAge;
  }

  public static passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  public static isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.startsWith(type);
    });
  }

  public static isValidFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  public static isValidGameRoomCode(code: string): boolean {
    const roomCodeRegex = /^[A-Z0-9]{6}$/;
    return roomCodeRegex.test(code);
  }

  public static isValidTournamentName(name: string): boolean {
    return name.length >= 3 && name.length <= 50;
  }

  public static isValidChatMessage(message: string): boolean {
    return message.trim().length >= 1 && message.trim().length <= 500;
  }

  public static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000);
  }

  public static sanitizeUsername(username: string): string {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20);
  }

  public static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  public static createRealTimeValidator(
    element: HTMLInputElement,
    rules: ValidationRule,
    onValidation?: (result: ValidationResult) => void
  ): () => void {
    const validate = () => {
      const result = this.validate(element.value, rules);
      
      element.classList.toggle('invalid', !result.isValid);
      element.classList.toggle('valid', result.isValid && !this.isEmpty(element.value));
      
      if (onValidation) {
        onValidation(result);
      }
    };

    element.addEventListener('input', validate);
    element.addEventListener('blur', validate);

    return () => {
      element.removeEventListener('input', validate);
      element.removeEventListener('blur', validate);
    };
  }

  public static validateForm(
    form: HTMLFormElement,
    schema: Record<string, ValidationRule>
  ): { isValid: boolean; data: Record<string, any>; errors: Record<string, string[]> } {
    const formData = new FormData(form);
    const data: Record<string, any> = {};
    const errors: Record<string, string[]> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    Object.entries(schema).forEach(([key, rules]) => {
      const result = this.validate(data[key], rules);
      if (!result.isValid) {
        errors[key] = result.errors;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      data,
      errors,
    };
  }
}
