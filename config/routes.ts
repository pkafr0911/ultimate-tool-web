export default [
  {
    path: '/',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
    hideInMenu: true,
  },
  {
    key: 'utility',
    name: 'utility',
    icon: 'tool',
    routes: [
      { path: '/utility/qr', name: 'qr', icon: 'qrcode', component: './QR' },
      {
        path: '/utility/videowatch',
        name: 'videowatch',
        icon: 'playCircle',
        component: './VideoWatch',
      },
      { path: '/utility/epoch', name: 'epoch', icon: 'clockCircle', component: './Epoch' },
      { path: '/utility/regex', name: 'regex', icon: 'code', component: './Regex' },
      { path: '/utility/uuid', name: 'uuid', icon: 'barcode', component: './UUID' },
      { path: '/utility/password', name: 'password', icon: 'key', component: './Password' },
      { path: '/utility/jwt', name: 'jwt', icon: 'idcard', component: './JWT' },
      {
        path: '/utility/colorpicker',
        name: 'colorpicker',
        icon: 'bgColors',
        component: './ColorPicker',
      },
    ],
  },
  {
    key: 'imageConverter',
    name: 'imageConverter',
    icon: 'picture',
    routes: [
      {
        path: '/imageConverter/svg-viewer',
        name: 'svg-viewer',
        icon: 'fileImage',
        component: './SVGViewer',
      },
      {
        path: '/imageConverter/pnj-jpeg',
        name: 'pnj-jpeg',
        icon: 'fileImage',
        component: './PNGJPEG',
      },
      { path: '/imageConverter/base64', name: 'base64', icon: 'fileText', component: './Base64' },
      {
        path: '/imageConverter/text-art',
        name: 'text-art',
        icon: 'fontColors',
        component: './TextArt',
      },
    ],
  },
  {
    key: 'editor',
    name: 'editor',
    icon: 'edit',
    routes: [
      {
        path: '/editor/readme-editor',
        name: 'readme-editor',
        icon: 'fileMarkdown',
        component: './ReadmeEditor',
      },
      {
        path: '/editor/json-formatter',
        name: 'json-formatter',
        icon: 'fileText',
        component: './JsonFormatter',
      },
      {
        path: '/editor/html-editor',
        name: 'html-editor',
        icon: 'file',
        component: './HtmlEditor',
      },
    ],
  },
  {
    key: 'randomizer',
    name: 'randomizer',
    icon: '🎲',
    routes: [
      {
        path: '/randomizer/wheel-of-names',
        name: 'wheel-of-names',
        icon: 'sync',
        component: './WheelOfNames',
      },
      {
        path: '/randomizer/random',
        name: 'random',
        icon: 'questionCircle',
        component: './Random',
      },
    ],
  },
  {
    path: '/playground',
    name: 'playground',
    icon: 'appstore',
    component: './Playground',
  },
  {
    key: 'game',
    name: 'game',
    icon: '🎮',
    routes: [
      {
        path: '/game/tic-tac-toe',
        name: 'tic-tac-toe',
        icon: '❌',
        component: './TicTacToe',
      },
      {
        path: '/game/snake-xenzia',
        name: 'snake-xenzia',
        icon: '🐍',
        component: './SnakeXenzia',
      },
      {
        path: '/game/minesweeper',
        name: 'minesweeper',
        icon: '💣',
        component: './Minesweeper',
      },
      {
        path: '/game/sudoku',
        name: 'sudoku',
        icon: '9️⃣',
        component: './Sudoku',
      },
      {
        path: '/game/chess',
        name: 'chess',
        icon: '♟️',
        component: './Chess',
      },
    ],
  },
  {
    key: 'docs',
    name: 'docs',
    icon: 'fileText',
    routes: [
      { path: '/docs/commands', name: 'commands', icon: 'fileText', component: './Commands' },
      { path: '/docs/emojis', name: 'emojis', icon: 'smile', component: './Emojis' },
    ],
  },

  { path: '*', component: './404', icon: 'frown' },
];
