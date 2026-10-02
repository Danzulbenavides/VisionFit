// Shared form validators for the mobile app.
// Every validator returns an error message, or "" when the value is valid.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s-]*$/;
export const PH_PHONE_REGEX = /^09\d{9}$/;

export const filterName = (value) => value.replace(/[^A-Za-z\s-]/g, "");
export const filterDigits = (value) => value.replace(/\D/g, "");

export const validateName = (value, label = "Name") => {
  const v = (value || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 50) return `${label} must be at most 50 characters.`;
  if (!NAME_REGEX.test(v)) {
    return `${label} may only contain letters, spaces and hyphens.`;
  }
  return "";
};

export const validateEmail = (value) => {
  const v = (value || "").trim();
  if (!v) return "Email is required.";
  if (!EMAIL_REGEX.test(v)) return "Enter a valid email address.";
  return "";
};

export const validatePhone = (value) => {
  const v = (value || "").trim();
  if (!v) return "Phone number is required.";
  if (!PH_PHONE_REGEX.test(v)) {
    return "Enter a valid 11-digit mobile number starting with 09.";
  }
  return "";
};

export const PASSWORD_HINT =
  "At least 8 characters with an uppercase letter, lowercase letter, number and special character.";

export const validatePassword = (value) => {
  if (!value) return "Password is required.";
  if (
    value.length < 8 ||
    !/[A-Z]/.test(value) ||
    !/[a-z]/.test(value) ||
    !/\d/.test(value) ||
    !/[^A-Za-z0-9]/.test(value)
  ) {
    return PASSWORD_HINT;
  }
  return "";
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return "";
};

export const validatePostalCode = (value) => {
  const v = (value || "").trim();
  if (!v) return "Postal code is required.";
  if (!/^\d{4}$/.test(v)) return "Postal code must be 4 digits.";
  return "";
};

export const validateRequired = (value, label, max = 100) => {
  const v = (value || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length > max) return `${label} must be at most ${max} characters.`;
  return "";
};

// Returns the first error message found in an errors object, or ""
export const firstError = (errors) =>
  Object.values(errors).find((message) => Boolean(message)) || "";

// ---------- dropdown option builders ----------

const range = (from, to, step) => {
  const out = [];
  for (let n = from; n <= to + 1e-9; n += step) out.push(Math.round(n * 100) / 100);
  return out;
};

const signed = (n) => (n > 0 ? `+${n.toFixed(2)}` : n.toFixed(2));

// Sphere: -20.00 to +20.00 in 0.25 steps (backend allows up to +/-30)
export const SPHERE_OPTIONS = range(-20, 20, 0.25).map((n) => ({
  label: signed(n),
  value: String(n),
}));

// Cylinder: -6.00 to +6.00 in 0.25 steps
export const CYLINDER_OPTIONS = range(-6, 6, 0.25).map((n) => ({
  label: signed(n),
  value: String(n),
}));

// Axis: 0 to 180 degrees
export const AXIS_OPTIONS = range(0, 180, 1).map((n) => ({
  label: `${n}°`,
  value: String(n),
}));

// Reading add: 0.00 to +4.00 in 0.25 steps
export const ADD_OPTIONS = range(0, 4, 0.25).map((n) => ({
  label: n === 0 ? "None" : signed(n),
  value: String(n),
}));

// Pupillary distance: 40 to 80 mm in 0.5 steps
export const PD_OPTIONS = range(40, 80, 0.5).map((n) => ({
  label: `${n} mm`,
  value: String(n),
}));

export const PH_PROVINCES = [
  "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao","Aurora",
  "Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol","Bukidnon","Bulacan",
  "Cagayan","Camarines Norte","Camarines Sur","Camiguin","Capiz","Catanduanes","Cavite","Cebu",
  "Cotabato","Davao de Oro","Davao del Norte","Davao del Sur","Davao Occidental","Davao Oriental",
  "Dinagat Islands","Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo",
  "Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur","Leyte","Maguindanao del Norte",
  "Maguindanao del Sur","Marinduque","Masbate","Metro Manila","Misamis Occidental","Misamis Oriental",
  "Mountain Province","Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija","Nueva Vizcaya",
  "Occidental Mindoro","Oriental Mindoro","Palawan","Pampanga","Pangasinan","Quezon","Quirino","Rizal",
  "Romblon","Samar","Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte","Sultan Kudarat",
  "Sulu","Surigao del Norte","Surigao del Sur","Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte",
  "Zamboanga del Sur","Zamboanga Sibugay",
].map((name) => ({ label: name, value: name }));
