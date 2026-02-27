import React from 'react';
import {
  Base64Icon,
  ChessIcon,
  ColorPickerIcon,
  CommandIcon,
  EmojiIcon,
  EpochIcon,
  GoogleDriveIcon,
  HtmlIcon,
  ImageToTextIcon,
  JsonIcon,
  JWTIcon,
  MermaidIcon,
  MinesweeperIcon,
  PasswordIcon,
  PicsEditorIcon,
  PlaygroundIcon,
  QRIcon,
  RandomIcon,
  ReadmeIcon,
  RegexIcon,
  SnakeIcon,
  StressTestIcon,
  SudokuIcon,
  SVGIcon,
  TextArtIcon,
  TicTacToeIcon,
  UUIDIcon,
  VectorIcon,
  VideoIcon,
  WheelIcon,
} from './components/CustomIcons';

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
    icon: <PlaygroundIcon />,
    desc: 'Test small scripts or ideas instantly.',
  },

  // Utility Tools
  {
    name: 'QR Generator',
    path: '/utility/qr',
    icon: <QRIcon />,
    desc: 'Create QR codes easily from text or links.',
  },
  {
    name: 'Video Analyzer',
    path: '/utility/video-analyzer',
    icon: <VideoIcon />,
    desc: 'Watch and stream videos in a simple player.',
  },
  {
    name: 'Epoch Converter',
    path: '/utility/epoch',
    icon: <EpochIcon />,
    desc: 'Convert timestamps to human-readable dates.',
  },
  {
    name: 'Regex Tester',
    path: '/utility/regex',
    icon: <RegexIcon />,
    desc: 'Test and debug regular expressions quickly.',
  },
  {
    name: 'UUID Generator',
    path: '/utility/uuid',
    icon: <UUIDIcon />,
    desc: 'Generate unique identifiers for your projects.',
  },
  {
    name: 'Password Generator',
    path: '/utility/password',
    icon: <PasswordIcon />,
    desc: 'Create secure and random passwords.',
  },
  {
    name: 'JWT Encrypt/Decrypt',
    path: '/utility/jwt',
    icon: <JWTIcon />,
    desc: 'Encode or decode JSON Web Tokens easily.',
  },
  {
    name: 'Color Picker',
    path: '/utility/colorpicker',
    icon: <ColorPickerIcon />,
    desc: 'Pick colors and see HEX/RGB values instantly.',
  },

  {
    name: 'Stress Test',
    path: '/utility/stress-test',
    icon: <StressTestIcon />,
    desc: 'Run stress tests to evaluate performance.',
  },
  {
    name: 'System Info',
    path: '/utility/system-info',
    icon: <EpochIcon />,
    desc: 'See what browser APIs expose about your system.',
  },

  // Image Converter
  {
    name: 'Image To Text',
    path: '/image-converter/image-to-text',
    icon: <ImageToTextIcon />,
    desc: 'Extract text from images easily.',
  },
  {
    name: 'Text Art Generator',
    path: '/image-converter/text-art',
    icon: <TextArtIcon />,
    desc: 'Turn images into ASCII / text art.',
  },
  {
    name: 'SVG Viewer',
    path: '/image-converter/svg-viewer',
    icon: <SVGIcon />,
    desc: 'View and inspect SVG files in the browser.',
  },
  {
    name: 'Photo Editor',
    path: '/image-converter/photo-editor',
    icon: <PicsEditorIcon />,
    desc: 'Just photoshop but faster.',
  },
  {
    name: 'Vector Editor',
    path: '/image-converter/vector-editor',
    icon: <VectorIcon />,
    desc: 'Create and edit vector graphics.',
  },
  {
    name: 'Image Base64 Converter',
    path: '/image-converter/base64',
    icon: <Base64Icon />,
    desc: 'Encode images to Base64 and decode back.',
  },

  // Editor
  {
    name: 'Readme Editor',
    path: '/editor/readme-editor',
    icon: <ReadmeIcon />,
    desc: 'Edit and preview README.md files.',
  },
  {
    name: 'Json Formatter',
    path: '/editor/json-formatter',
    icon: <JsonIcon />,
    desc: 'Format and validate JSON data quickly.',
  },
  {
    name: 'HTML Editor',
    path: '/editor/html-editor',
    icon: <HtmlIcon />,
    desc: 'Edit HTML with live preview support.',
  },
  {
    name: 'Mermaid Editor',
    path: '/editor/mermaid-editor',
    icon: <MermaidIcon />,
    desc: 'Create and edit Mermaid diagrams visually.',
  },

  // Randomizer
  {
    name: '🎡 Wheel of Names',
    path: '/randomizer/wheel-of-names',
    icon: <WheelIcon />,
    desc: 'Pick random names using a spinning wheel.',
  },
  {
    name: 'Random Generator',
    path: '/randomizer/random',
    icon: <RandomIcon />,
    desc: 'Generate random numbers, items, or selections.',
  },

  // Game
  {
    name: 'Tic-Tac-Toe',
    path: '/game/tic-tac-toe',
    icon: <TicTacToeIcon />,
    desc: 'Play the classic Tic-Tac-Toe game.',
  },
  {
    name: 'Snake xenzia',
    path: '/game/snake-xenzia',
    icon: <SnakeIcon />,
    desc: 'Classic Snake game for fun and practice.',
  },
  {
    name: 'Minesweeper',
    path: '/game/minesweeper',
    icon: <MinesweeperIcon />,
    desc: 'Clear all tiles without triggering hidden mines.',
  },
  {
    name: 'Sudoku',
    path: '/game/sudoku',
    icon: <SudokuIcon />,
    desc: 'Enjoy the Classic Sudoku Puzzle Game.',
  },
  {
    name: 'Chess',
    path: '/game/chess',
    icon: <ChessIcon />,
    desc: 'All about the game of chess.',
  },

  // Docs / Commands
  {
    name: 'Commands',
    path: '/docs/commands',
    icon: <CommandIcon />,
    desc: 'View all available commands and usage.',
  },
  {
    name: 'Emojis /  Kaomojis ',
    path: '/docs/emojis',
    icon: <EmojiIcon />,
    desc: 'Find and copy emojis and kaomojis.',
  },
  {
    name: 'Google Drive',
    path: '/docs/google-drive',
    icon: <GoogleDriveIcon />,
    desc: 'Browse and manage Google Drive files.',
  },
];
