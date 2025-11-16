export const idFormatRules: Record<string, { regex: RegExp; hint: string }> = {
    student: {
      regex: /^S\d{8}$/, // Example: S12345678
      hint: 'S followed by 8 digits (e.g., S12345678)',
    },
    faculty: {
      regex: /^F\d{5}$/, // Example: F12345
      hint: 'F followed by 5 digits (e.g., F12345)',
    },
    admin: {
      regex: /^A\d{4}$/, // Example: A1234
      hint: 'A followed by 4 digits (e.g., A1234)',
    },
  };
  