import { 
  FormField, 
  Form, 
  Validators, 
  createForm, 
  FormBuilder,
  EmailField,
  PasswordField,
  NumberField 
} from '../../src/forms/index.js';

describe('Forms System', () => {
  describe('FormField', () => {
    test('creates field with initial value', () => {
      const field = new FormField('initial');
      expect(field.value.value).toBe('initial');
      expect(field.touched.value).toBe(false);
      expect(field.dirty.value).toBe(false);
    });

    test('setValue updates value and dirty state', () => {
      const field = new FormField('initial');
      field.setValue('updated');
      
      expect(field.value.value).toBe('updated');
      expect(field.dirty.value).toBe(true);
    });

    test('setTouched updates touched state', () => {
      const field = new FormField('test');
      field.setTouched(true);
      
      expect(field.touched.value).toBe(true);
    });

    test('reset restores initial state', () => {
      const field = new FormField('initial');
      
      field.setValue('changed');
      field.setTouched(true);
      field.errors.value = ['error'];
      
      field.reset();
      
      expect(field.value.value).toBe('initial');
      expect(field.touched.value).toBe(false);
      expect(field.dirty.value).toBe(false);
      expect(field.errors.value).toEqual([]);
    });

    test('validation runs on value change', async () => {
      const validator = jest.fn().mockResolvedValue(true);
      const field = new FormField('', [validator]);
      
      field.setValue('test');
      
      // Wait for debounced validation
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(validator).toHaveBeenCalledWith('test', field);
    });

    test('validation errors are stored', async () => {
      const validator = () => 'Error message';
      const field = new FormField('', [validator]);
      
      await field.validate();
      
      expect(field.errors.value).toEqual(['Error message']);
      expect(field.isValid.value).toBe(false);
    });

    test('multiple validators run in sequence', async () => {
      const validator1 = jest.fn().mockResolvedValue(true);
      const validator2 = jest.fn().mockResolvedValue('Error 2');
      const field = new FormField('test', [validator1, validator2]);
      
      await field.validate();
      
      expect(validator1).toHaveBeenCalled();
      expect(validator2).toHaveBeenCalled();
      expect(field.errors.value).toEqual(['Error 2']);
    });

    test('isInvalid computed property', async () => {
      const field = new FormField('', [() => 'Error']);
      
      expect(field.isInvalid.value).toBe(false); // Not touched yet
      
      await field.setTouched(true);
      expect(field.isInvalid.value).toBe(true); // Touched and has errors
    });
  });

  describe('Form', () => {
    let form;

    beforeEach(() => {
      form = new Form({
        name: new FormField('', [Validators.required()]),
        email: new FormField('', [Validators.required(), Validators.email()]),
        age: new FormField('', [Validators.numeric(), Validators.min(18)])
      });
    });

    test('creates form with fields', () => {
      expect(form.getField('name')).toBeDefined();
      expect(form.getField('email')).toBeDefined();
      expect(form.getField('age')).toBeDefined();
    });

    test('getValue and setValue work correctly', () => {
      form.setValue('name', 'John');
      expect(form.getValue('name')).toBe('John');
    });

    test('getValues returns all field values', () => {
      form.setValue('name', 'John');
      form.setValue('email', 'john@example.com');
      form.setValue('age', '25');
      
      const values = form.getValues();
      expect(values).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: '25'
      });
    });

    test('setValues updates multiple fields', () => {
      form.setValues({
        name: 'Jane',
        email: 'jane@example.com'
      });
      
      expect(form.getValue('name')).toBe('Jane');
      expect(form.getValue('email')).toBe('jane@example.com');
    });

    test('isValid computed property', async () => {
      expect(form.isValid.value).toBe(false); // Empty required fields
      
      form.setValues({
        name: 'John',
        email: 'john@example.com',
        age: '25'
      });
      
      await form.validate();
      expect(form.isValid.value).toBe(true);
    });

    test('isDirty computed property', () => {
      expect(form.isDirty.value).toBe(false);
      
      form.setValue('name', 'John');
      expect(form.isDirty.value).toBe(true);
    });

    test('isTouched computed property', () => {
      expect(form.isTouched.value).toBe(false);
      
      form.getField('name').setTouched(true);
      expect(form.isTouched.value).toBe(true);
    });

    test('errors computed property', async () => {
      form.getField('name').setTouched(true);
      form.getField('email').setTouched(true);
      
      await form.validate();
      
      const errors = form.errors.value;
      expect(errors.name).toBeDefined();
      expect(errors.email).toBeDefined();
    });

    test('submit calls onSubmit with values', async () => {
      const onSubmit = jest.fn().mockResolvedValue('success');
      
      form.setValues({
        name: 'John',
        email: 'john@example.com',
        age: '25'
      });
      
      const result = await form.submit(onSubmit);
      
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
        age: '25'
      }, form);
      expect(result).toBe('success');
    });

    test('submit validates before calling onSubmit', async () => {
      const onSubmit = jest.fn();
      
      // Form with invalid data
      form.setValue('email', 'invalid-email');
      
      await expect(form.submit(onSubmit)).rejects.toThrow('Form validation failed');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('submit sets submitting state', async () => {
      const onSubmit = () => new Promise(resolve => setTimeout(resolve, 100));
      
      form.setValues({
        name: 'John',
        email: 'john@example.com',
        age: '25'
      });
      
      const submitPromise = form.submit(onSubmit);
      expect(form.submitting.value).toBe(true);
      
      await submitPromise;
      expect(form.submitting.value).toBe(false);
    });

    test('reset restores all fields to initial state', () => {
      form.setValues({
        name: 'John',
        email: 'john@example.com'
      });
      
      Object.values(form.fields).forEach(field => field.setTouched(true));
      
      form.reset();
      
      expect(form.getValue('name')).toBe('');
      expect(form.getValue('email')).toBe('');
      expect(form.isTouched.value).toBe(false);
      expect(form.isDirty.value).toBe(false);
    });

    test('setFieldErrors sets errors on specific fields', () => {
      form.setFieldErrors({
        name: ['Name is required'],
        email: ['Invalid email format']
      });
      
      expect(form.getField('name').errors.value).toEqual(['Name is required']);
      expect(form.getField('email').errors.value).toEqual(['Invalid email format']);
    });

    test('addField and removeField work correctly', () => {
      const newField = new FormField('test');
      form.addField('test', newField);
      
      expect(form.getField('test')).toBe(newField);
      
      form.removeField('test');
      expect(form.getField('test')).toBeUndefined();
    });
  });

  describe('Validators', () => {
    test('required validator', () => {
      const validator = Validators.required();
      
      expect(validator('')).toBe('This field is required');
      expect(validator('   ')).toBe('This field is required');
      expect(validator(null)).toBe('This field is required');
      expect(validator(undefined)).toBe('This field is required');
      expect(validator([])).toBe('This field is required');
      expect(validator('test')).toBe(true);
    });

    test('minLength validator', () => {
      const validator = Validators.minLength(3);
      
      expect(validator('ab')).toBe('Must be at least 3 characters');
      expect(validator('abc')).toBe(true);
      expect(validator('abcd')).toBe(true);
    });

    test('maxLength validator', () => {
      const validator = Validators.maxLength(5);
      
      expect(validator('123456')).toBe('Must be no more than 5 characters');
      expect(validator('12345')).toBe(true);
      expect(validator('1234')).toBe(true);
    });

    test('email validator', () => {
      const validator = Validators.email();
      
      expect(validator('invalid')).toBe('Invalid email address');
      expect(validator('test@')).toBe('Invalid email address');
      expect(validator('test@example')).toBe('Invalid email address');
      expect(validator('test@example.com')).toBe(true);
    });

    test('pattern validator', () => {
      const validator = Validators.pattern(/^\d+$/, 'Must be numeric');
      
      expect(validator('abc')).toBe('Must be numeric');
      expect(validator('123abc')).toBe('Must be numeric');
      expect(validator('123')).toBe(true);
    });

    test('min validator', () => {
      const validator = Validators.min(10);
      
      expect(validator('5')).toBe('Must be at least 10');
      expect(validator('10')).toBe(true);
      expect(validator('15')).toBe(true);
    });

    test('max validator', () => {
      const validator = Validators.max(100);
      
      expect(validator('150')).toBe('Must be no more than 100');
      expect(validator('100')).toBe(true);
      expect(validator('50')).toBe(true);
    });

    test('numeric validator', () => {
      const validator = Validators.numeric();
      
      expect(validator('abc')).toBe('Must be a number');
      expect(validator('123abc')).toBe('Must be a number');
      expect(validator('123')).toBe(true);
      expect(validator('123.45')).toBe(true);
    });

    test('integer validator', () => {
      const validator = Validators.integer();
      
      expect(validator('123.45')).toBe('Must be an integer');
      expect(validator('abc')).toBe('Must be an integer');
      expect(validator('123')).toBe(true);
    });

    test('oneOf validator', () => {
      const validator = Validators.oneOf(['red', 'green', 'blue']);
      
      expect(validator('yellow')).toBe('Must be one of: red, green, blue');
      expect(validator('red')).toBe(true);
      expect(validator('green')).toBe(true);
    });

    test('custom validator', async () => {
      const customValidator = Validators.custom(
        (value) => value === 'valid' ? true : 'Custom error'
      );
      
      expect(await customValidator('invalid')).toBe('Custom error');
      expect(await customValidator('valid')).toBe(true);
    });
  });

  describe('Specialized Fields', () => {
    test('EmailField includes email validation', async () => {
      const field = new EmailField('');
      
      field.setValue('invalid-email');
      await field.validate();
      
      expect(field.isValid.value).toBe(false);
      
      field.setValue('test@example.com');
      await field.validate();
      
      expect(field.isValid.value).toBe(true);
    });

    test('PasswordField includes password validation', async () => {
      const field = new PasswordField('', {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true
      });
      
      field.setValue('weak');
      await field.validate();
      expect(field.isValid.value).toBe(false);
      
      field.setValue('StrongPass123');
      await field.validate();
      expect(field.isValid.value).toBe(true);
    });

    test('NumberField includes numeric validation', async () => {
      const field = new NumberField('', {
        min: 0,
        max: 100,
        integer: true
      });
      
      field.setValue('abc');
      await field.validate();
      expect(field.isValid.value).toBe(false);
      
      field.setValue('150');
      await field.validate();
      expect(field.isValid.value).toBe(false);
      
      field.setValue('50');
      await field.validate();
      expect(field.isValid.value).toBe(true);
    });
  });

  describe('FormBuilder', () => {
    test('builds form from configuration', () => {
      const form = new FormBuilder()
        .field('name', 'text', { value: 'John', validators: [Validators.required()] })
        .email('email')
        .password('password')
        .number('age', { min: 18 })
        .options({ validateOnSubmit: true })
        .build();
      
      expect(form.getField('name')).toBeDefined();
      expect(form.getField('email')).toBeInstanceOf(EmailField);
      expect(form.getField('password')).toBeInstanceOf(PasswordField);
      expect(form.getField('age')).toBeInstanceOf(NumberField);
      expect(form.options.validateOnSubmit).toBe(true);
    });
  });

  describe('createForm helper', () => {
    test('creates form from object definition', () => {
      const form = createForm({
        name: { value: '', validators: [Validators.required()] },
        email: { value: '', validators: [Validators.email()] }
      });
      
      expect(form).toBeInstanceOf(Form);
      expect(form.getField('name')).toBeDefined();
      expect(form.getField('email')).toBeDefined();
    });

    test('creates form from builder function', () => {
      const form = createForm(builder => {
        builder
          .field('name', 'text')
          .email('email')
          .options({ validateOnSubmit: false });
      });
      
      expect(form).toBeInstanceOf(Form);
      expect(form.options.validateOnSubmit).toBe(false);
    });
  });
});