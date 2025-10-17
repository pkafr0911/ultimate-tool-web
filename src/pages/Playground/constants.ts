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
