// Email validation
export function validateEmail(email) {
  if (!email) return 'auth.credentials.email.required';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) return 'auth.credentials.email.invalid';
  return '';
}

// Username validation
export function validateUsername(username) {
  if (!username) return 'auth.credentials.username.required';
  if (username.length < 3) return 'auth.credentials.username.minLength';
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'auth.credentials.username.invalid';
  return '';
}

// Password validation
export function validatePassword(password) {
  if (!password) return 'auth.credentials.password.required';
  if (password.length < 8) return 'auth.credentials.password.minLength';
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return 'auth.credentials.password.requirements';
  return '';
}

// Confirm password validation
export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return 'auth.credentials.confirmPassword.required';
  if (confirmPassword !== password) return 'auth.credentials.confirmPassword.mismatch';
  return '';
}

// Israeli phone number validation
export function validatePhoneNumber(phone) {
  if (!phone) return '';
  if (!/^05\d{8}$/.test(phone.trim())) return 'auth.signup.personalDetails.errors.phoneNumberFormat';
  return '';
}

// House number validation
export function validateHouseNumber(houseNumber) {
  if (!houseNumber) return '';
  if (!/^\d{1,4}[A-Z]?$/.test(houseNumber.trim())) return 'auth.signup.personalDetails.errors.houseNumberFormat';
  return '';
}

// Required field validation
export function validateRequiredField(value, fieldName = 'Field') {
  if (!value || !value.toString().trim()) return 'auth.signup.personalDetails.errors.required';
  return '';
}

// Israeli ID validation
export function validateIsraeliID(id) {
  if (!id || !/^\d{9}$/.test(id)) return 'auth.dashboard.errors.idFormat';
  // Pad to 9 digits
  id = id.toString().padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let num = Number(id[i]);
    let multiplied = num * (i % 2 === 0 ? 1 : 2);
    if (multiplied > 9) multiplied -= 9;
    sum += multiplied;
  }
  if (sum % 10 !== 0) return 'auth.dashboard.errors.invalidIdNumber';
  return '';
}

// Gender required validation
export function validateGender(gender) {
  if (!gender) return 'auth.dashboard.errors.genderRequired';
  return '';
} 