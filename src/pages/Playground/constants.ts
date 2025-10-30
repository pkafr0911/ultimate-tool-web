export const DEFAULT_HTML = `<div class="container">
    <h1>Hello World 🌍</h1>
    <p>This is a live HTML + CSS + JS playground!</p>
    <button id="clickBtn">Click me</button>
  </div>`;
export const DEFAULT_CSS = `
  body {
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #fdfbfb, #ebedee);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .container { text-align: center; }
  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.3s;
  }
  button:hover { background-color: #45a049; transform: scale(1.05); }
  `;
export const DEFAULT_SCRIPT = `
  document.getElementById('clickBtn').addEventListener('click', () => {
    alert('Hello from JavaScript!');
  });
  `;

export const DEFAULT_CODE = `// Try something!\nconsole.log("Hello, playground!");`;

// Default React code shown in the editor initially
export const DEFAULT_REACT_TS = `type Props = { name: string };

const App: React.FC<Props> = ({ name }) => {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Hello, {name}! 👋</h2>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App name="TAIN" />);`;

export const DEFAULT_REACT_JS = `function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h2>React Playground ⚛️</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`;

/**
 * This defines React types for Monaco so the in-browser TypeScript compiler
 * knows how to interpret JSX and React APIs.
 */
export const REACT_EXTRA_LIB = `declare namespace React {
  type FC<P = {}> = (props: P & { children?: any }) => any;
  function createElement(...args: any[]): any;
  function useState<T>(initial: T): [T, (v: T) => void];
  const Fragment: any;
}

declare module "react" {
  export = React;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
declare namespace ReactDOM {
  function render(element: any, container: any): void;
  function createRoot(container: any): {
    render(children: any): void;
  };
}

declare module "react-dom" {
  export = ReactDOM;
}

declare module "react-dom/client" {
  export = ReactDOM;
}`;
