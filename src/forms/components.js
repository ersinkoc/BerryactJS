// Form components and directives for Berryact framework

import { html } from '../template/parser.js';
import { registerDirective } from '../template/directives.js';

// Form input component
export function FormInput(props) {
  const {
    field,
    type = 'text',
    placeholder = '',
    disabled = false,
    className = '',
    label,
    help,
    showErrors = true,
    ...rest
  } = props;

  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = field.isInvalid.value;
  const inputClass = `form-input ${className} ${hasError ? 'error' : ''}`.trim();

  const handleInput = (event) => {
    field.setValue(event.target.value);
  };

  const handleBlur = () => {
    field.setTouched(true);
  };

  const handleFocus = () => {
    field.setFocused(true);
  };

  return html`
    <div class="form-field">
      ${label ? html`<label for=${inputId} class="form-label">${label}</label>` : ''}

      <input
        id=${inputId}
        type=${type}
        class=${inputClass}
        value=${field.value}
        placeholder=${placeholder}
        disabled=${disabled}
        @input=${handleInput}
        @blur=${handleBlur}
        @focus=${handleFocus}
        ${rest}
      />

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
      ${field.validating.value ? html` <div class="form-validating">Validating...</div> ` : ''}
    </div>
  `;
}

// Form textarea component
export function FormTextarea(props) {
  const {
    field,
    placeholder = '',
    rows = 4,
    disabled = false,
    className = '',
    label,
    help,
    showErrors = true,
    ...rest
  } = props;

  const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = field.isInvalid.value;
  const textareaClass = `form-textarea ${className} ${hasError ? 'error' : ''}`.trim();

  const handleInput = (event) => {
    field.setValue(event.target.value);
  };

  const handleBlur = () => {
    field.setTouched(true);
  };

  const handleFocus = () => {
    field.setFocused(true);
  };

  return html`
    <div class="form-field">
      ${label ? html`<label for=${textareaId} class="form-label">${label}</label>` : ''}

      <textarea
        id=${textareaId}
        class=${textareaClass}
        placeholder=${placeholder}
        rows=${rows}
        disabled=${disabled}
        @input=${handleInput}
        @blur=${handleBlur}
        @focus=${handleFocus}
        ${rest}
      >
${field.value}</textarea
      >

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
    </div>
  `;
}

// Form select component
export function FormSelect(props) {
  const {
    field,
    options = [],
    placeholder = 'Select an option',
    disabled = false,
    className = '',
    label,
    help,
    showErrors = true,
    multiple = false,
    ...rest
  } = props;

  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = field.isInvalid.value;
  const selectClass = `form-select ${className} ${hasError ? 'error' : ''}`.trim();

  const handleChange = (event) => {
    if (multiple) {
      const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
      field.setValue(selectedOptions);
    } else {
      field.setValue(event.target.value);
    }
  };

  const handleBlur = () => {
    field.setTouched(true);
  };

  const handleFocus = () => {
    field.setFocused(true);
  };

  return html`
    <div class="form-field">
      ${label ? html`<label for=${selectId} class="form-label">${label}</label>` : ''}

      <select
        id=${selectId}
        class=${selectClass}
        disabled=${disabled}
        multiple=${multiple}
        @change=${handleChange}
        @blur=${handleBlur}
        @focus=${handleFocus}
        ${rest}
      >
        ${!multiple && placeholder
          ? html` <option value="" disabled selected=${!field.value.value}>${placeholder}</option> `
          : ''}
        ${options.map((option) => {
          const value = option.value ?? option;
          const label = option.label ?? option.text ?? option;
          const isSelected = multiple
            ? field.value.value.includes(value)
            : field.value.value === value;

          return html` <option value=${value} selected=${isSelected}>${label}</option> `;
        })}
      </select>

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
    </div>
  `;
}

// Form checkbox component
export function FormCheckbox(props) {
  const {
    field,
    disabled = false,
    className = '',
    label,
    help,
    showErrors = true,
    ...rest
  } = props;

  const checkboxId = `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = field.isInvalid.value;
  const checkboxClass = `form-checkbox ${className} ${hasError ? 'error' : ''}`.trim();

  const handleChange = (event) => {
    field.setValue(event.target.checked);
  };

  const handleBlur = () => {
    field.setTouched(true);
  };

  return html`
    <div class="form-field form-field-checkbox">
      <div class="checkbox-wrapper">
        <input
          type="checkbox"
          id=${checkboxId}
          class=${checkboxClass}
          checked=${field.value}
          disabled=${disabled}
          @change=${handleChange}
          @blur=${handleBlur}
          ${rest}
        />
        ${label ? html`<label for=${checkboxId} class="form-label">${label}</label>` : ''}
      </div>

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
    </div>
  `;
}

// Form radio group component
export function FormRadioGroup(props) {
  const {
    field,
    options = [],
    disabled = false,
    className = '',
    label,
    help,
    showErrors = true,
    inline = false,
    ...rest
  } = props;

  const groupName = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = field.isInvalid.value;
  const groupClass =
    `form-radio-group ${className} ${hasError ? 'error' : ''} ${inline ? 'inline' : ''}`.trim();

  const handleChange = (event) => {
    field.setValue(event.target.value);
  };

  const handleBlur = () => {
    field.setTouched(true);
  };

  return html`
    <div class="form-field">
      ${label ? html`<div class="form-label">${label}</div>` : ''}

      <div class=${groupClass}>
        ${options.map((option, index) => {
          const value = option.value ?? option;
          const optionLabel = option.label ?? option.text ?? option;
          const radioId = `${groupName}-${index}`;
          const isChecked = field.value.value === value;

          return html`
            <div class="radio-option">
              <input
                type="radio"
                id=${radioId}
                name=${groupName}
                value=${value}
                checked=${isChecked}
                disabled=${disabled}
                @change=${handleChange}
                @blur=${handleBlur}
                ${rest}
              />
              <label for=${radioId} class="radio-label">${optionLabel}</label>
            </div>
          `;
        })}
      </div>

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
    </div>
  `;
}

// Form submit button
export function FormSubmitButton(props) {
  const {
    form,
    children = 'Submit',
    disabled = false,
    className = '',
    loadingText = 'Submitting...',
    ...rest
  } = props;

  const isDisabled = disabled || form.submitting.value || !form.isValid.value;
  const buttonClass = `form-submit ${className}`.trim();
  const displayText = form.submitting.value ? loadingText : children;

  return html`
    <button type="submit" class=${buttonClass} disabled=${isDisabled} ${rest}>
      ${displayText}
    </button>
  `;
}

// Complete form component
export function FormComponent(props) {
  const { form, onSubmit, children, className = '', noValidate = true, ...rest } = props;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (onSubmit) {
      try {
        await form.submit(onSubmit);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
  };

  const formClass = `berryact-form ${className} ${form.isValid.value ? 'valid' : 'invalid'}`.trim();

  return html`
    <form class=${formClass} novalidate=${noValidate} @submit=${handleSubmit} ${rest}>
      ${children}
    </form>
  `;
}

// Form field wrapper for custom components
export function FormFieldWrapper(props) {
  const {
    field,
    label,
    help,
    showErrors = true,
    required = false,
    className = '',
    children,
  } = props;

  const hasError = field.isInvalid.value;
  const wrapperClass = `form-field-wrapper ${className} ${hasError ? 'error' : ''}`.trim();

  return html`
    <div class=${wrapperClass}>
      ${label
        ? html`
            <div class="form-label">
              ${label} ${required ? html`<span class="required">*</span>` : ''}
            </div>
          `
        : ''}

      <div class="form-control">${children}</div>

      ${help ? html`<div class="form-help">${help}</div>` : ''}
      ${showErrors && hasError
        ? html`
            <div class="form-errors">
              ${field.errors.value.map((error) => html` <div class="form-error">${error}</div> `)}
            </div>
          `
        : ''}
      ${field.validating.value
        ? html`
            <div class="form-validating">
              <span class="spinner"></span>
              Validating...
            </div>
          `
        : ''}
    </div>
  `;
}

// Auto-growing textarea
export function AutoGrowTextarea(props) {
  const { field, minRows = 2, maxRows = 10, ...rest } = props;

  const handleInput = (event) => {
    field.setValue(event.target.value);

    // Auto-grow functionality
    const textarea = event.target;
    textarea.style.height = 'auto';

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;

    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
  };

  return FormTextarea({
    ...rest,
    field,
    handleInput,
  });
}

// Multi-step form component
export function MultiStepForm(props) {
  const {
    steps,
    currentStep = 0,
    onStepChange,
    onComplete,
    className = '',
    showProgress = true,
  } = props;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStepData.form) {
      const isValid = await currentStepData.form.validate();
      if (!isValid) return;
    }

    if (isLastStep) {
      if (onComplete) {
        onComplete();
      }
    } else {
      if (onStepChange) {
        onStepChange(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0 && onStepChange) {
      onStepChange(currentStep - 1);
    }
  };

  return html`
    <div class="multi-step-form ${className}">
      ${showProgress
        ? html`
            <div class="form-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="step-indicators">
                ${steps.map(
                  (step, index) => html`
                    <div class="step-indicator ${index <= currentStep ? 'completed' : ''}">
                      ${index + 1}
                    </div>
                  `
                )}
              </div>
            </div>
          `
        : ''}

      <div class="step-content">
        <h2 class="step-title">${currentStepData.title}</h2>
        ${currentStepData.description
          ? html` <p class="step-description">${currentStepData.description}</p> `
          : ''}

        <div class="step-form">${currentStepData.component}</div>
      </div>

      <div class="step-actions">
        ${currentStep > 0
          ? html`
              <button type="button" class="btn btn-secondary" @click=${handlePrevious}>
                Previous
              </button>
            `
          : ''}

        <button type="button" class="btn btn-primary" @click=${handleNext}>
          ${isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  `;
}

// Register form directives
registerDirective('field', (element, field) => {
  if (!field || typeof field !== 'object') return;

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'input') {
    const type = element.type;

    if (type === 'checkbox') {
      element.checked = field.value.value;
      element.addEventListener('change', () => {
        field.setValue(element.checked);
      });
    } else {
      element.value = field.value.value;
      element.addEventListener('input', () => {
        field.setValue(element.value);
      });
    }

    element.addEventListener('blur', () => {
      field.setTouched(true);
    });

    element.addEventListener('focus', () => {
      field.setFocused(true);
    });
  }

  if (tagName === 'select' || tagName === 'textarea') {
    element.value = field.value.value;

    element.addEventListener('change', () => {
      field.setValue(element.value);
    });

    element.addEventListener('blur', () => {
      field.setTouched(true);
    });

    element.addEventListener('focus', () => {
      field.setFocused(true);
    });
  }

  // Add error class when field is invalid
  effect(() => {
    if (field.isInvalid.value) {
      element.classList.add('error');
    } else {
      element.classList.remove('error');
    }
  });
});

export {
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadioGroup,
  FormSubmitButton,
  FormComponent,
  FormFieldWrapper,
  AutoGrowTextarea,
  MultiStepForm,
};
