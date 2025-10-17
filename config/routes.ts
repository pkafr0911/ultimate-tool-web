export default [
  {
    path: '/',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
  },
  {
    key: 'utility',
    name: 'utility',
    icon: 'tool',
    routes: [
      { path: '/utility/qr', name: 'qr', component: './QR' },
      { path: '/utility/videowatch', name: 'videowatch', component: './VideoWatch' },
      { path: '/utility/epoch', name: 'epoch', component: './Epoch' },
      { path: '/utility/regex', name: 'regex', component: './Regex' },
      { path: '/utility/uuid', name: 'uuid', component: './UUID' },
      { path: '/utility/password', name: 'password', component: './Password' },
      { path: '/utility/jwt', name: 'jwt', component: './JWT' },
      { path: '/utility/colorpicker', name: 'colorpicker', component: './ColorPicker' },
    ],
  },
  {
    key: 'randomizer',
    name: 'randomizer',
    icon: '🎲',
    routes: [
      { path: '/randomizer/wheel-of-names', name: 'wheel-of-names', component: './WheelOfNames' },
      { path: '/randomizer/random', name: 'random', component: './Random' },
    ],
  },
  {
    key: 'imageConverter',
    name: 'imageConverter',
    icon: 'picture',
    routes: [
      { path: '/imageConverter/svg-viewer', name: 'svg-viewer', component: './SVGViewer' },
      { path: '/imageConverter/pnj-jpeg', name: 'pnj-jpeg', component: './PNGJPEG' },
      { path: '/imageConverter/base64', name: 'base64', component: './Base64' },
    ],
  },
  {
    key: 'editor',
    name: 'editor',
    icon: 'edit',
    routes: [
      { path: '/editor/readme-editor', name: 'readme-editor', component: './ReadmeEditor' },
      { path: '/editor/json-formatter', name: 'json-formatter', component: './JsonFormatter' },
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
    routes: [{ path: '/game/tic-tac-toe', name: 'tic-tac-toe', component: './TicTacToe' }],
  },
  {
    key: 'docs',
    name: 'docs',
    icon: 'fileText',
    routes: [{ path: '/docs/commands', name: 'commands', component: './Commands' }],
  },

  { path: '*', component: './404' },
];
