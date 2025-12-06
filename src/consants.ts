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
  // Playground
  {
    name: 'Playground',
    path: '/playground',
    icon: '🧩',
    desc: 'Test small scripts or ideas instantly.',
  },

  // Utility Tools
  {
    name: 'QR Generator',
    path: '/utility/qr',
    icon: '🔳',
    desc: 'Create QR codes easily from text or links.',
  },
  {
    name: 'Video Analyzer',
    path: '/utility/video-analyzer',
    icon: '📺',
    desc: 'Watch and stream videos in a simple player.',
  },
  {
    name: 'Epoch Converter',
    path: '/utility/epoch',
    icon: '⏱️',
    desc: 'Convert timestamps to human-readable dates.',
  },
  {
    name: 'Regex Tester',
    path: '/utility/regex',
    icon: '🔍',
    desc: 'Test and debug regular expressions quickly.',
  },
  {
    name: 'UUID Generator',
    path: '/utility/uuid',
    icon: '🆔',
    desc: 'Generate unique identifiers for your projects.',
  },
  {
    name: 'Password Generator',
    path: '/utility/password',
    icon: '🔑',
    desc: 'Create secure and random passwords.',
  },
  {
    name: 'JWT Encrypt/Decrypt',
    path: '/utility/jwt',
    icon: '🔐',
    desc: 'Encode or decode JSON Web Tokens easily.',
  },
  {
    name: 'Color Picker',
    path: '/utility/colorpicker',
    icon: '🎨',
    desc: 'Pick colors and see HEX/RGB values instantly.',
  },

  // Image Converter
  {
    name: 'Image To Text',
    path: '/image-converter/image-to-text',
    icon: '📄',
    desc: 'Extract text from images easily.',
  },
  {
    name: 'Text Art Generator',
    path: '/image-converter/text-art',
    icon: '🖋️',
    desc: 'Turn images into ASCII / text art.',
  },
  {
    name: 'SVG Viewer',
    path: '/image-converter/svg-viewer',
    icon: '🖼️',
    desc: 'View and inspect SVG files in the browser.',
  },
  {
    name: 'Pics Editor',
    path: '/image-converter/pics-editor',
    icon: '🖌️',
    desc: 'Just photoshop but faster.',
  },
  {
    name: 'Image Base64 Converter',
    path: '/image-converter/base64',
    icon: '💾',
    desc: 'Encode images to Base64 and decode back.',
  },

  // Editor
  {
    name: 'Readme Editor',
    path: '/editor/readme-editor',
    icon: '📄',
    desc: 'Edit and preview README.md files.',
  },
  {
    name: 'Json Formatter',
    path: '/editor/json-formatter',
    icon: '🔧',
    desc: 'Format and validate JSON data quickly.',
  },
  {
    name: 'HTML Editor',
    path: '/editor/html-editor',
    icon: '🌐',
    desc: 'Edit HTML with live preview support.',
  },

  // Randomizer
  {
    name: '🎡 Wheel of Names',
    path: '/randomizer/wheel-of-names',
    icon: '🎡',
    desc: 'Pick random names using a spinning wheel.',
  },
  {
    name: 'Random Generator',
    path: '/randomizer/random',
    icon: '🎲',
    desc: 'Generate random numbers, items, or selections.',
  },

  // Game
  {
    name: 'Tic-Tac-Toe',
    path: '/game/tic-tac-toe',
    icon: '❌⭕',
    desc: 'Play the classic Tic-Tac-Toe game.',
  },
  {
    name: 'Snake xenzia',
    path: '/game/snake-xenzia',
    icon: '🐍',
    desc: 'Classic Snake game for fun and practice.',
  },
  {
    name: 'Minesweeper',
    path: '/game/minesweeper',
    icon: '💣',
    desc: 'Clear all tiles without triggering hidden mines.',
  },
  {
    name: 'Sudoku',
    path: '/game/sudoku',
    icon: '9️⃣',
    desc: 'Enjoy the Classic Sudoku Puzzle Game.',
  },
  {
    name: 'Chess',
    path: '/game/chess',
    icon: '♟️',
    desc: 'All about the game of chess.',
  },

  // Docs / Commands
  {
    name: 'Commands',
    path: '/docs/commands',
    icon: '📚',
    desc: 'View all available commands and usage.',
  },
  {
    name: 'Emojis /  Kaomojis ',
    path: '/docs/emojis',
    icon: '😄',
    desc: 'Find and copy emojis and kaomojis.',
  },
];
