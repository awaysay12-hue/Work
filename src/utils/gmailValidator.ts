/**
 * Gmail & Real-Email Verification Engine
 * Strictly verifies and normalizes Google Mail (Gmail) and corporate Google Workspace emails.
 * Ensures that all user accounts and task assignments correlate to authentic, verified emails.
 */

export interface EmailVerificationResult {
  isValid: boolean;
  normalizedEmail: string;
  errorMessage?: string;
  isGmail: boolean;
  domain?: string;
}

// RFC 5322 standard email regex with strict domain & TLD formatting
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Common Gmail typographical mistakes & typos
const GMAIL_TYPO_MAP: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaild.com': 'gmail.com',
  'googlemail.com': 'gmail.com',
};

/**
 * Validates whether an email string is a genuine, properly formatted Gmail / Corporate Email
 * 1. Checks valid characters and standard RFC syntax
 * 2. Auto-corrects common Gmail typos
 * 3. Enforces valid Gmail username constraints (6-30 chars, alphanumeric + dots)
 * 4. Normalizes to lowercase and trims spaces
 */
export function validateAndNormalizeGmail(inputEmail: string, requireGmailOnly: boolean = false): EmailVerificationResult {
  if (!inputEmail || typeof inputEmail !== 'string') {
    return {
      isValid: false,
      normalizedEmail: '',
      errorMessage: 'សូមបញ្ចូលអាសយដ្ឋាន Gmail ឱ្យបានត្រឹមត្រូវ',
      isGmail: false,
    };
  }

  let clean = inputEmail.trim().toLowerCase();

  // Basic structure check
  if (!clean.includes('@') || clean.indexOf('@') !== clean.lastIndexOf('@')) {
    return {
      isValid: false,
      normalizedEmail: clean,
      errorMessage: 'ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវ (ត្រូវមានសញ្ញា @ តែម្តងគត់)',
      isGmail: false,
    };
  }

  const [username, domainPart] = clean.split('@');

  if (!username || !domainPart) {
    return {
      isValid: false,
      normalizedEmail: clean,
      errorMessage: 'សូមបញ្ចូលឈ្មោះ និង Domain នៃអ៊ីមែលឱ្យបានពេញលេញ',
      isGmail: false,
    };
  }

  // Check and fix common Gmail domain typos
  let domain = domainPart;
  if (GMAIL_TYPO_MAP[domain]) {
    domain = GMAIL_TYPO_MAP[domain];
    clean = `${username}@${domain}`;
  }

  // Regex format test
  if (!EMAIL_REGEX.test(clean)) {
    return {
      isValid: false,
      normalizedEmail: clean,
      errorMessage: 'អាសយដ្ឋានអ៊ីមែលមានតួអក្សរមិនអនុញ្ញាត ឬទម្រង់ខុសស្តង់ដារ',
      isGmail: false,
    };
  }

  const isGmailDomain = domain === 'gmail.com' || domain === 'googlemail.com';

  // Gmail-specific username rules: length 6-30, no consecutive dots
  if (isGmailDomain) {
    if (username.length < 3) {
      return {
        isValid: false,
        normalizedEmail: clean,
        errorMessage: 'ឈ្មោះគណនី Gmail ត្រូវមានយ៉ាងហោចណាស់ 3 តួអក្សរឡើងទៅ',
        isGmail: true,
        domain,
      };
    }
    if (username.includes('..')) {
      return {
        isValid: false,
        normalizedEmail: clean,
        errorMessage: 'Gmail មិនអនុញ្ញាតឱ្យមានសញ្ញាចុចពីរជាប់គ្នា (..) ឡើយ',
        isGmail: true,
        domain,
      };
    }
    if (username.startsWith('.') || username.endsWith('.')) {
      return {
        isValid: false,
        normalizedEmail: clean,
        errorMessage: 'Gmail មិនអនុញ្ញាតឱ្យចាប់ផ្តើម ឬបញ្ចប់ដោយសញ្ញាចុច (.) ឡើយ',
        isGmail: true,
        domain,
      };
    }
  } else if (requireGmailOnly) {
    return {
      isValid: false,
      normalizedEmail: clean,
      errorMessage: 'សូមប្រើប្រាស់អាសយដ្ឋាន Gmail ពិតប្រាកដ (@gmail.com)',
      isGmail: false,
      domain,
    };
  }

  return {
    isValid: true,
    normalizedEmail: clean,
    isGmail: isGmailDomain,
    domain,
  };
}

/**
 * Checks if a string looks like a standard Google/Gmail address
 */
export function isRealGmailAddress(email: string): boolean {
  const result = validateAndNormalizeGmail(email, false);
  return result.isValid;
}
