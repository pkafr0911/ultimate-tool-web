export // 🔹 Common Regex Patterns
const commonPatterns = [
  { name: 'Email', pattern: '^[\\w.-]+@[\\w.-]+\\.[A-Za-z]{2,}$' },
  { name: 'Phone (VN)', pattern: '^(\\+84|0)(\\d{9,10})$' },
  {
    name: 'Phone (Global)',
    pattern: '^\\+(?:[0-9] ?){6,14}[0-9]$',
  },
  {
    name: 'No Special Char & No Leading Space',
    pattern: '^[A-Za-z0-9][A-Za-z0-9 _-]*$',
  },
  {
    name: 'Vietnamese Letters (No Special, No Leading Space)',
    pattern: '^[\\p{L}\\p{N}][\\p{L}\\p{N} _-]*$',
  },
  {
    name: 'Password (8+ chars, upper, lower, number, symbol)',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$',
  },
  {
    name: 'URL',
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w\\.-]+)+(?:[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+)?",
  },
  {
    name: 'Domain',
    pattern: '^(?!-)[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$',
  },
  {
    name: 'URL Path',
    pattern: "^\\/(?:[A-Za-z0-9\\-_~!$&'()*+,;=:@]+\\/?)*$",
  },
  {
    name: 'IPv4',
    pattern: '^((25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.|$)){4}$',
  },
  {
    name: 'IPv6',
    pattern:
      '^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$|^(?:[A-Fa-f0-9]{1,4}:){1,7}:$|^:(?::[A-Fa-f0-9]{1,4}){1,7}$',
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  },
  {
    name: 'Hex Color',
    pattern: '^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
  },
  { name: 'Username', pattern: '^[A-Za-z0-9_]{3,16}$' },
  { name: 'Postal Code', pattern: '^\\d{5}(-\\d{4})?$' },
  { name: 'Only Letters', pattern: '^[A-Za-z]+$' },
  { name: 'Only Numbers', pattern: '^\\d+$' },
];
