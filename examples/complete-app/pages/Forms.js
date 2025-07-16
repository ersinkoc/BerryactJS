import { html, createForm, Validators } from '../../../src/index.js';

export default function Forms() {
  const { t } = app.i18n;
  
  const form = createForm({
    name: {
      value: '',
      validators: [
        Validators.required(),
        Validators.minLength(2)
      ]
    },
    email: {
      value: '',
      validators: [
        Validators.required(),
        Validators.email()
      ]
    },
    password: {
      value: '',
      validators: [
        Validators.required(),
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
      ]
    },
    confirmPassword: {
      value: '',
      validators: [
        Validators.required(),
        Validators.match('password', 'Passwords do not match')
      ]
    },
    age: {
      value: '',
      validators: [
        Validators.min(18, 'Must be at least 18'),
        Validators.max(120, 'Invalid age')
      ]
    },
    bio: {
      value: '',
      validators: [
        Validators.maxLength(500)
      ]
    }
  });
  
  const handleSubmit = async (values) => {
    console.log('Form submitted:', values);
    
    app.store.dispatch('notify', {
      type: 'success',
      message: t('forms.success')
    });
    
    // Reset form after success
    setTimeout(() => form.reset(), 2000);
  };
  
  return html`
    <div class="card">
      <h1>${t('forms.title')}</h1>
      
      <form ...${form.bind()} @submit=${(e) => {
        e.preventDefault();
        form.submit(handleSubmit);
      }}>
        ${Object.entries(form.fields).map(([name, field]) => html`
          <div class="form-group">
            <label for=${name}>${t(`forms.fields.${name}`)}</label>
            ${name === 'bio' ? html`
              <textarea 
                id=${name}
                rows="4"
                ...${field.bind()}
                class=${field.invalid.value ? 'invalid' : ''}
                aria-invalid=${field.invalid.value}
                aria-describedby=${field.error.value ? `${name}-error` : undefined}
              ></textarea>
            ` : html`
              <input 
                id=${name}
                type=${name.includes('password') ? 'password' : name === 'email' ? 'email' : name === 'age' ? 'number' : 'text'}
                ...${field.bind()}
                class=${field.invalid.value ? 'invalid' : ''}
                aria-invalid=${field.invalid.value}
                aria-describedby=${field.error.value ? `${name}-error` : undefined}
              />
            `}
            ${field.error.value && html`
              <div id="${name}-error" class="error-message" role="alert">
                ${field.error.value}
              </div>
            `}
          </div>
        `)}
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary"
            disabled=${form.invalid.value || form.submitting.value}
          >
            ${form.submitting.value ? html`
              <span class="spinner" aria-hidden="true"></span>
              <span>${t('forms.submit')}...</span>
            ` : t('forms.submit')}
          </button>
          
          <button 
            type="button" 
            class="btn-secondary"
            @click=${() => form.reset()}
          >
            ${t('forms.reset')}
          </button>
        </div>
      </form>
    </div>
  `;
}