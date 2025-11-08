// Comprehensive form handling and validation for Berryact framework

import { signal, computed, effect } from '../core/signal.js';
import { isObject, isArray, isFunction } from '../utils/is.js';

export class FormField {
  constructor(initialValue = '', validators = [], options = {}) {
    this.value = signal(initialValue);
    this.validators = validators;
    this.touched = signal(false);
    this.focused = signal(false);
    this.dirty = signal(false);
    this.validating = signal(false);

    this.options = {
      validateOnChange: true,
      validateOnBlur: true,
      debounceMs: 300,
      ...options,
    };

    this.errors = signal([]);
    this.isValid = computed(() => this.errors.value.length === 0);
    this.isInvalid = computed(() => !this.isValid.value && this.touched.value);

    this.initialValue = initialValue;
    this.debounceTimer = null;

    this.setupValidation();

    // Run initial validation if there are validators
    if (this.validators.length > 0) {
      this.validate();
    }
  }

  setupValidation() {
    if (this.options.validateOnChange) {
      effect(() => {
        const value = this.value.value;
        if (this.dirty.value) {
          this.debouncedValidate();
        }
      });
    }
  }

  async validate() {
    if (this.validators.length === 0) {
      this.errors.value = [];
      return true;
    }

    this.validating.value = true;
    const errors = [];

    for (const validator of this.validators) {
      try {
        const result = await validator(this.value.value, this);
        if (result !== true && result !== undefined) {
          errors.push(result);
        }
      } catch (error) {
        errors.push(error.message || 'Validation failed');
      }
    }

    this.errors.value = errors;
    this.validating.value = false;

    return errors.length === 0;
  }

  debouncedValidate() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.validate();
    }, this.options.debounceMs);
  }

  setValue(newValue) {
    this.value.value = newValue;
    this.dirty.value = newValue !== this.initialValue;
  }

  async setTouched(touched = true) {
    this.touched.value = touched;
    if (touched && this.options.validateOnBlur) {
      await this.validate();
    }
  }

  async setFocused(focused = true) {
    this.focused.value = focused;
    if (!focused) {
      await this.setTouched(true);
    }
  }

  reset() {
    // Clear debounce timer to prevent memory leak
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.value.value = this.initialValue;
    this.touched.value = false;
    this.focused.value = false;
    this.dirty.value = false;
    this.errors.value = [];
    this.validating.value = false;
  }

  /**
   * Dispose the form field and clean up resources
   * @description Call this when the field is no longer needed to prevent memory leaks
   */
  dispose() {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Dispose signals if they have dispose methods
    if (this.value && typeof this.value.dispose === 'function') {
      this.value.dispose();
    }
    if (this.errors && typeof this.errors.dispose === 'function') {
      this.errors.dispose();
    }
    if (this.touched && typeof this.touched.dispose === 'function') {
      this.touched.dispose();
    }
    if (this.focused && typeof this.focused.dispose === 'function') {
      this.focused.dispose();
    }
    if (this.dirty && typeof this.dirty.dispose === 'function') {
      this.dirty.dispose();
    }
    if (this.validating && typeof this.validating.dispose === 'function') {
      this.validating.dispose();
    }
    if (this.isValid && typeof this.isValid.dispose === 'function') {
      this.isValid.dispose();
    }
    if (this.isInvalid && typeof this.isInvalid.dispose === 'function') {
      this.isInvalid.dispose();
    }
  }

  addValidator(validator) {
    this.validators.push(validator);
  }

  removeValidator(validator) {
    const index = this.validators.indexOf(validator);
    if (index > -1) {
      this.validators.splice(index, 1);
    }
  }
}

export class Form {
  constructor(fields = {}, options = {}) {
    this.fields = {};
    this.options = {
      validateOnSubmit: true,
      preventSubmitOnError: true,
      resetOnSubmit: false,
      ...options,
    };

    this.submitting = signal(false);
    this.submitAttempted = signal(false);

    this.setupFields(fields);

    this.isValid = computed(() => {
      return Object.values(this.fields).every((field) => field.isValid.value);
    });

    this.isDirty = computed(() => {
      return Object.values(this.fields).some((field) => field.dirty.value);
    });

    this.isTouched = computed(() => {
      return Object.values(this.fields).some((field) => field.touched.value);
    });

    this.errors = computed(() => {
      const allErrors = {};
      Object.entries(this.fields).forEach(([name, field]) => {
        if (field.errors.value.length > 0) {
          allErrors[name] = field.errors.value;
        }
      });
      return allErrors;
    });
  }

  setupFields(fieldDefinitions) {
    Object.entries(fieldDefinitions).forEach(([name, definition]) => {
      if (definition instanceof FormField) {
        this.fields[name] = definition;
      } else {
        const { value, validators, ...options } = definition;
        this.fields[name] = new FormField(value, validators || [], options);
      }
    });
  }

  addField(name, field) {
    if (field instanceof FormField) {
      this.fields[name] = field;
    } else {
      const { value, validators, ...options } = field;
      this.fields[name] = new FormField(value, validators || [], options);
    }
  }

  removeField(name) {
    delete this.fields[name];
  }

  getField(name) {
    return this.fields[name];
  }

  getValue(name) {
    return this.fields[name]?.value.value;
  }

  setValue(name, value) {
    if (this.fields[name]) {
      this.fields[name].setValue(value);
    }
  }

  getValues() {
    const values = {};
    Object.entries(this.fields).forEach(([name, field]) => {
      values[name] = field.value.value;
    });
    return values;
  }

  setValues(values) {
    Object.entries(values).forEach(([name, value]) => {
      this.setValue(name, value);
    });
  }

  async validate() {
    const validationPromises = Object.values(this.fields).map((field) => field.validate());

    const results = await Promise.all(validationPromises);
    return results.every((result) => result);
  }

  async submit(onSubmit) {
    this.submitAttempted.value = true;
    this.submitting.value = true;

    try {
      // Touch all fields to show validation errors
      Object.values(this.fields).forEach((field) => {
        field.setTouched(true);
      });

      // Validate if required
      if (this.options.validateOnSubmit) {
        const isValid = await this.validate();
        if (!isValid && this.options.preventSubmitOnError) {
          throw new Error('Form validation failed');
        }
      }

      // Submit the form
      const values = this.getValues();
      const result = await onSubmit(values, this);

      // Reset if configured
      if (this.options.resetOnSubmit) {
        this.reset();
      }

      return result;
    } catch (error) {
      throw error;
    } finally {
      this.submitting.value = false;
    }
  }

  reset() {
    Object.values(this.fields).forEach((field) => field.reset());
    this.submitAttempted.value = false;
  }

  setFieldErrors(fieldErrors) {
    Object.entries(fieldErrors).forEach(([name, errors]) => {
      if (this.fields[name]) {
        this.fields[name].errors.value = Array.isArray(errors) ? errors : [errors];
        this.fields[name].touched.value = true;
      }
    });
  }

  clearErrors() {
    Object.values(this.fields).forEach((field) => {
      field.errors.value = [];
    });
  }

  /**
   * Dispose the form and clean up all resources
   * @description Call this when the form is no longer needed to prevent memory leaks
   */
  dispose() {
    // Dispose all fields
    Object.values(this.fields).forEach((field) => {
      if (field && typeof field.dispose === 'function') {
        field.dispose();
      }
    });

    // Dispose computed values
    if (this.isValid && typeof this.isValid.dispose === 'function') {
      this.isValid.dispose();
    }
    if (this.isDirty && typeof this.isDirty.dispose === 'function') {
      this.isDirty.dispose();
    }
    if (this.isTouched && typeof this.isTouched.dispose === 'function') {
      this.isTouched.dispose();
    }
    if (this.errors && typeof this.errors.dispose === 'function') {
      this.errors.dispose();
    }

    // Dispose state signals
    if (this.submitting && typeof this.submitting.dispose === 'function') {
      this.submitting.dispose();
    }
    if (this.submitAttempted && typeof this.submitAttempted.dispose === 'function') {
      this.submitAttempted.dispose();
    }

    // Clear references
    this.fields = {};
    this.plugins = [];
  }
}

// Built-in validators
export const Validators = {
  required(message = 'This field is required') {
    return (value) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return true;
    };
  },

  minLength(min, message) {
    return (value) => {
      if (value && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return true;
    };
  },

  maxLength(max, message) {
    return (value) => {
      if (value && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return true;
    };
  },

  pattern(regex, message = 'Invalid format') {
    return (value) => {
      if (value && !regex.test(value)) {
        return message;
      }
      return true;
    };
  },

  email(message = 'Invalid email address') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.pattern(emailRegex, message);
  },

  url(message = 'Invalid URL') {
    return (value) => {
      if (value) {
        try {
          new URL(value);
        } catch {
          return message;
        }
      }
      return true;
    };
  },

  min(min, message) {
    return (value) => {
      const num = Number(value);
      if (!isNaN(num) && num < min) {
        return message || `Must be at least ${min}`;
      }
      return true;
    };
  },

  max(max, message) {
    return (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > max) {
        return message || `Must be no more than ${max}`;
      }
      return true;
    };
  },

  integer(message = 'Must be an integer') {
    return (value) => {
      const num = Number(value);
      if (value && (!Number.isInteger(num) || isNaN(num))) {
        return message;
      }
      return true;
    };
  },

  numeric(message = 'Must be a number') {
    return (value) => {
      if (value && isNaN(Number(value))) {
        return message;
      }
      return true;
    };
  },

  oneOf(options, message) {
    return (value) => {
      if (value && !options.includes(value)) {
        return message || `Must be one of: ${options.join(', ')}`;
      }
      return true;
    };
  },

  custom(fn, message = 'Invalid value') {
    return async (value, field) => {
      try {
        const result = await fn(value, field);
        return result === true ? true : result || message;
      } catch (error) {
        return error.message || message;
      }
    };
  },

  asyncUnique(checkFn, message = 'Value must be unique') {
    return async (value) => {
      if (!value) return true;

      try {
        const isUnique = await checkFn(value);
        return isUnique ? true : message;
      } catch (error) {
        return error.message || message;
      }
    };
  },

  matchField(otherFieldName, message = 'Fields must match') {
    return (value, field) => {
      // This would need access to the parent form
      // Implementation depends on how fields access each other
      return true; // Placeholder
    };
  },
};

// Form validation utilities
export class ValidationRules {
  static combine(...validators) {
    return async (value, field) => {
      for (const validator of validators) {
        const result = await validator(value, field);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  }

  static conditional(condition, validator) {
    return async (value, field) => {
      const shouldValidate = typeof condition === 'function' ? condition(value, field) : condition;

      if (shouldValidate) {
        return validator(value, field);
      }
      return true;
    };
  }

  static when(fieldName, expectedValue, validator) {
    return async (value, field) => {
      // This would need access to other fields in the form
      // Implementation depends on form context
      return validator(value, field);
    };
  }

  static debounced(validator, delay = 300) {
    let timeoutId = null;

    return (value, field) => {
      return new Promise((resolve) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          const result = await validator(value, field);
          resolve(result);
        }, delay);
      });
    };
  }
}

// Form field types with built-in validation
export class EmailField extends FormField {
  constructor(initialValue = '', additionalValidators = [], options = {}) {
    const validators = [Validators.email(), ...additionalValidators];
    super(initialValue, validators, options);
  }
}

export class PasswordField extends FormField {
  constructor(initialValue = '', options = {}) {
    const validators = [
      Validators.required(),
      Validators.minLength(options.minLength || 8),
      ...(options.requireUppercase
        ? [Validators.pattern(/[A-Z]/, 'Must contain uppercase letter')]
        : []),
      ...(options.requireLowercase
        ? [Validators.pattern(/[a-z]/, 'Must contain lowercase letter')]
        : []),
      ...(options.requireNumbers ? [Validators.pattern(/\d/, 'Must contain number')] : []),
      ...(options.requireSpecial
        ? [Validators.pattern(/[!@#$%^&*]/, 'Must contain special character')]
        : []),
      ...(options.additionalValidators || []),
    ];
    super(initialValue, validators, options);
  }
}

export class NumberField extends FormField {
  constructor(initialValue = '', options = {}) {
    const validators = [
      Validators.numeric(),
      ...(options.min !== undefined ? [Validators.min(options.min)] : []),
      ...(options.max !== undefined ? [Validators.max(options.max)] : []),
      ...(options.integer ? [Validators.integer()] : []),
      ...(options.additionalValidators || []),
    ];
    super(initialValue, validators, options);
  }
}

export class SelectField extends FormField {
  constructor(initialValue = '', options = [], fieldOptions = {}) {
    const validators = [
      ...(fieldOptions.required ? [Validators.required()] : []),
      Validators.oneOf(options.map((opt) => opt.value || opt)),
      ...(fieldOptions.additionalValidators || []),
    ];
    super(initialValue, validators, fieldOptions);
    this.options = options;
  }
}

// Form builder utility
export class FormBuilder {
  constructor() {
    this.fieldDefinitions = {};
    this.formOptions = {};
  }

  field(name, type = 'text', options = {}) {
    this.fieldDefinitions[name] = { type, ...options };
    return this;
  }

  email(name, options = {}) {
    return this.field(name, 'email', options);
  }

  password(name, options = {}) {
    return this.field(name, 'password', options);
  }

  number(name, options = {}) {
    return this.field(name, 'number', options);
  }

  select(name, optionsList, options = {}) {
    return this.field(name, 'select', { ...options, options: optionsList });
  }

  options(formOptions) {
    this.formOptions = { ...this.formOptions, ...formOptions };
    return this;
  }

  build() {
    const fields = {};

    Object.entries(this.fieldDefinitions).forEach(([name, definition]) => {
      const { type, value = '', validators = [], ...options } = definition;

      switch (type) {
        case 'email':
          fields[name] = new EmailField(value, validators, options);
          break;
        case 'password':
          fields[name] = new PasswordField(value, options);
          break;
        case 'number':
          fields[name] = new NumberField(value, options);
          break;
        case 'select':
          fields[name] = new SelectField(value, options.options, options);
          break;
        default:
          fields[name] = new FormField(value, validators, options);
      }
    });

    return new Form(fields, this.formOptions);
  }
}

export function createForm(definition) {
  if (definition instanceof FormBuilder) {
    return definition.build();
  }

  if (typeof definition === 'function') {
    const builder = new FormBuilder();
    definition(builder);
    return builder.build();
  }

  return new Form(definition);
}
