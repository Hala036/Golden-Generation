// Email validation
export function validateEmail(email) {
  if (!email) return 'Email is required';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return 'Invalid email format';
  return '';
}

// Username validation
export function validateUsername(username) {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
  return '';
}

// Password validation
export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
  return '';
}

// Confirm password validation
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your password';
  if (confirmPassword !== password) return 'Passwords do not match';
  return '';
}

// Israeli phone number validation
export function validatePhoneNumber(phone) {
  if (!phone) return '';
  if (!/^05\d{8}$/.test(phone.trim())) return 'Phone number must be a valid Israeli number (e.g., 05XXXXXXXX)';
  return '';
}

// House number validation
export function validateHouseNumber(houseNumber) {
  if (!houseNumber) return '';
  if (!/^\d{1,4}[A-Z]?$/.test(houseNumber.trim())) return 'House number must be numeric (e.g., 123 or 123A)';
  return '';
}

// Required field validation
export function validateRequiredField(value, fieldName = 'Field') {
  if (!value || !value.toString().trim()) return `${fieldName} is required`;
  return '';
}

// Israeli ID validation
export function validateIsraeliID(id) {
  if (!id || !/^\d{9}$/.test(id)) return 'ID number must be 9 digits';
  // Pad to 9 digits
  id = id.toString().padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = Number(id[i]);
    let multiplied = num * (i % 2 === 0 ? 1 : 2);
    if (multiplied > 9) multiplied -= 9;
    sum += multiplied;
  }
  if (sum % 10 !== 0) return 'Invalid Israeli ID number';
  return '';
} 