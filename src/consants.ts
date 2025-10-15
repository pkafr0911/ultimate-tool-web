/**
 * All constants that will be used throughout the project will be here.
 */

export const GLOBAL_PREFIX = '/api';

export const codeMessage = {
  200: 'The server successfully returns the requested data.  ',
  201: 'Create or modify data successfully.  ',
  202: 'A request has been queued in the background (asynchronous task).',
  204: 'Delete data successfully.',
  400: 'There was an error in the request sent, and the server did not create or modify data.',
  401: 'User does not have permissions (wrong token, username, password).',
  403: 'The user is authorized, but access is prohibited.  ',
  404: 'A request was made for a record that does not exist, no action was taken by the server.',
  406: 'The requested format is not available.',
  410: 'The requested resource is permanently deleted and will not be available again.',
  422: 'A validation error occurred while creating an object. ',
  500: 'An error occurred on the server, please check the server.',
  502: 'Gateway error.',
  503: 'The service is unavailable, the server is temporarily overloaded or under maintenance.',
  504: 'Gateway timed out.',
};

export const pages = [
  { name: 'QR Generator', path: '/qr' },
  { name: 'Video Watch', path: '/videowatch' },
  { name: 'Epoch Converter', path: '/epoch' },
  { name: 'Regex Tester', path: '/regex' },
  { name: 'UUID Generator', path: '/uuid' },
  { name: 'Password Generator', path: '/password' },
  { name: 'Base64 Converter', path: '/base64' },
  { name: 'JWT Encrypt/Decrypt', path: '/jwt' },
  { name: 'Color Picker', path: '/colorpicker' },
  { name: '🎡 Wheel of Names', path: '/wheel-of-names' },
  { name: 'Random Generator', path: '/random' },
  { name: 'Playground', path: '/playground' },
  { name: 'Docs', path: '/docs' },
  { name: 'SVG Viewer', path: '/svg-viewer' },
];
