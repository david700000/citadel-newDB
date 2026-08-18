const BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' && (window.location.port === '3000' || window.location.hostname.includes('citadel.local') || window.location.hostname.includes('onrender.com')) 
    ? '' 
    : (window.location.hostname.includes('netlify.app') ? 'https://citadel-newdb-516a.onrender.com' : 'http://localhost:3000'));

export const API_URLS = {
  BASE: BASE_URL,
  
  // Registration Endpoints
  REGISTER_FIRST_TIMER: `${BASE_URL}/users/register/first-timer`,
  REGISTER_MEMBER_WORKER: `${BASE_URL}/users/register/member-worker`,
  
  // CMS / Admin Endpoints
  AUTH_LOGIN: `${BASE_URL}/auth/login`,
  AUTH_LOGOUT: `${BASE_URL}/auth/logout`,
  AUTH_ME: `${BASE_URL}/auth/me`,
  AUTH_INVITE: `${BASE_URL}/auth/invite`,
  AUTH_CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  AUTH_FORGOT_PASSWORD: `${BASE_URL}/auth/forgot-password`,
  AUTH_RESET_PASSWORD_OTP: `${BASE_URL}/auth/reset-password-otp`,
  FCM_TOKEN: `${BASE_URL}/users/fcm-token`,
  SETTINGS: `${BASE_URL}/settings`,
  WEBSITE_DATA: `${BASE_URL}/api/data`,
  UPLOAD: `${BASE_URL}/api/upload`,
  
  // Feature Endpoints
  USERS: `${BASE_URL}/users`,
  MESSAGES: `${BASE_URL}/messages`,
  ATTENDANCE: `${BASE_URL}/attendance`,
  ADMINS: `${BASE_URL}/admins`,
  FORMS: `${BASE_URL}/form-fields`,
  REMINDERS: `${BASE_URL}/reminders`,

  // Financial Endpoints
  FINANCIAL: `${BASE_URL}/financial`,
  FINANCIAL_ALL_LOGS: `${BASE_URL}/financial/all-logs`,       // CMS only - includes voided
  FINANCIAL_SECTIONS: `${BASE_URL}/financial/sections`,
  FINANCIAL_SALARIES: `${BASE_URL}/financial/salaries`,
  FINANCIAL_SALARIES_ALL: `${BASE_URL}/financial/salaries/all`, // CMS only
  FINANCIAL_FUND_REQUESTS: `${BASE_URL}/financial/fund-requests`,

  // Reports Endpoints (CMS Root only)
  REPORTS_ALL: `${BASE_URL}/reports/all`,
  REPORTS_FINANCIAL: `${BASE_URL}/reports/financial`,
  REPORTS_MEMBERS: `${BASE_URL}/reports/members`,
  REPORTS_LOGIN_ACTIVITY: `${BASE_URL}/reports/login-activity`,

  // Database Management (CMS Root only)
  DATABASE_PURGE: `${BASE_URL}/database/purge`,

  // Service Reviews Endpoints
  SERVICE_REVIEWS: `${BASE_URL}/service-reviews`,
  SERVICE_REVIEWS_STATS: `${BASE_URL}/service-reviews/stats`,
  SERVICE_REVIEWS_EXPORT: `${BASE_URL}/service-reviews/export`,

  // Event Registrations
  EVENT_REGISTRATIONS: `${BASE_URL}/api/event-registrations`,
  EVENT_REGISTRATIONS_STATS: `${BASE_URL}/api/event-registrations/stats`,

  // Templates
  TEMPLATES_ADMIN: `${BASE_URL}/api/admin/templates`,
  TEMPLATES_PUBLIC: `${BASE_URL}/api/templates`,
  TEMPLATES_GRAPHIC_UPLOAD: `${BASE_URL}/api/upload-template-graphic`,
};

export default API_URLS;
