export const commonPatterns = [
  {
    name: 'Email',
    pattern: '^[\\w.-]+@[\\w.-]+\\.[A-Za-z]{2,}$',
    examples: ['example@mail.com', 'user.name@domain.co', 'user@domain'],
  },
  {
    name: 'Phone (VN)',
    pattern: '^(\\+84|0)(\\d{9,10})$',
    examples: ['+84987654321', '0912345678', '12345'],
  },
  {
    name: 'Phone (Global)',
    pattern: '^\\+(?:[0-9] ?){6,14}[0-9]$',
    examples: ['+1 234 567 890', '+44 7911 123456', '+81 90 1234 5678', '0044 1234567'],
  },
  {
    name: 'No Special Char & No Leading Space',
    pattern: '^[A-Za-z0-9][A-Za-z0-9 _-]*$',
    examples: ['Hello World', ' MyName', 'User_Name'],
  },
  {
    name: 'Vietnamese Letters (No Special, No Leading Space)',
    pattern: '^[\\p{L}\\p{N}][\\p{L}\\p{N} _-]*$',
    examples: ['Nguyen Van A', '123LeThiB', ' Hello'],
  },
  {
    name: 'Password (8+ chars, upper, lower, number, symbol)',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$',
    examples: ['Abc123!@', 'password', 'StrongP@ss1'],
  },
  {
    name: 'URL',
    pattern: "https?:\\/\\/[\\w.-]+(?:\\.[\\w\\.-]+)+(?:[\\w\\-._~:/?#[\\]@!$&'()*+,;=]+)?",
    examples: [
      'https://google.com',
      'http://example.org/test',
      'https://www.example.co.uk/path?query=1#section',
      'https://sub.domain.io:8080/api/v2/data',
      'http://localhost:3000/',
      'ftp://file',
      'htp://invalid-url',
      'https://',
    ],
  },
  {
    name: 'Domain',
    pattern: '^(?!-)[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*(\\.[A-Za-z]{2,})$',
    examples: ['example.com', '-invalid.com', 'my.site.net'],
  },
  {
    name: 'URL Path',
    pattern: "^\\/(?:[A-Za-z0-9\\-_~!$&'()*+,;=:@]+\\/?)*$",
    examples: [
      '/home',
      '/api/v1/users',
      '/blog/posts/2025/10/17',
      '/user/profile/edit/',
      '/products/item-123?color=red',
      'home/',
      '//double/slash',
      '/ space',
    ],
  },
  {
    name: 'IPv4',
    pattern: '^((25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(\\.|$)){4}$',
    examples: [
      '192.168.0.1',
      '10.0.0.255',
      '255.255.255.255',
      '8.8.8.8',
      '172.16.254.3',
      '256.100.100.100',
      '192.168.1',
      'abc.def.ghi.jkl',
    ],
  },
  {
    name: 'IPv6',
    pattern:
      '^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$|^(?:[A-Fa-f0-9]{1,4}:){1,7}:$|^:(?::[A-Fa-f0-9]{1,4}){1,7}$',
    examples: [
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      'fe80::1ff:fe23:4567:890a',
      '::1',
      'abcd::1234',
      '2001:db8::8a2e:370:7334',
      '12345::',
      'gggg::abcd',
      '2001:::7334',
    ],
  },
  {
    name: 'Date (YYYY-MM-DD)',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    examples: ['2025-10-17', '2024-02-29', '17/10/2025', '2025-13-01'],
  },
  {
    name: 'Hex Color',
    pattern: '^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
    examples: ['#fff', '#123ABC', '#00ff00', '12345', '#abcd'],
  },
  {
    name: 'Username',
    pattern: '^[A-Za-z0-9_]{3,16}$',
    examples: ['user_123', 'ab', 'user.name', 'ValidUser01', 'ThisUsernameIsTooLong'],
  },
  {
    name: 'Postal Code',
    pattern: '^\\d{5}(-\\d{4})?$',
    examples: ['12345', '12345-6789', 'ABCDE', '12-345', '987654321'],
  },
  {
    name: 'Only Letters',
    pattern: '^[A-Za-z]+$',
    examples: ['Hello', 'abcDEF', 'abc123', 'HelloWorld'],
  },
  {
    name: 'Only Numbers',
    pattern: '^\\d+$',
    examples: ['12345', '123abc', '000', '987654321'],
  },
];
