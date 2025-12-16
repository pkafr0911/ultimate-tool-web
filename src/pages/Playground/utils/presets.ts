export type PresetType = 'html' | 'react' | 'javascript';

export interface Preset {
  id: string;
  name: string;
  description: string;
  type: PresetType;
  data: any;
}

export const PRESETS: Preset[] = [
  // HTML Presets
  {
    id: 'html-basic',
    name: 'Basic HTML5',
    description: 'A simple HTML5 boilerplate with CSS and JS.',
    type: 'html',
    data: {
      html: '<div class="container">\n  <h1>Hello World</h1>\n  <p>Start editing to see some magic happen!</p>\n  <button id="btn">Click me</button>\n</div>',
      css: '.container {\n  font-family: sans-serif;\n  text-align: center;\n  padding: 2rem;\n}\n\nh1 {\n  color: #333;\n}\n\nbutton {\n  padding: 8px 16px;\n  cursor: pointer;\n}',
      javascript:
        'document.getElementById("btn").addEventListener("click", () => {\n  alert("Button clicked!");\n});',
    },
  },
  {
    id: 'html-tailwind',
    name: 'Tailwind CSS',
    description: 'HTML with Tailwind CSS via CDN.',
    type: 'html',
    data: {
      html: '<div class="min-h-screen bg-gray-100 flex items-center justify-center">\n  <div class="bg-white p-8 rounded-lg shadow-lg">\n    <h1 class="text-2xl font-bold text-blue-600 mb-4">Hello Tailwind</h1>\n    <p class="text-gray-700">This is a card styled with Tailwind CSS.</p>\n    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">Action</button>\n  </div>\n</div>',
      css: '/* Tailwind is loaded via CDN in the head */',
      javascript: '// Add your logic here',
    },
  },
  {
    id: 'html-chartjs',
    name: 'Chart.js Example',
    description: 'Simple bar chart using Chart.js.',
    type: 'html',
    data: {
      html: '<div style="width: 80%; margin: auto;">\n  <canvas id="myChart"></canvas>\n</div>\n<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
      css: 'body { padding: 20px; }',
      javascript:
        'const ctx = document.getElementById("myChart");\n\nnew Chart(ctx, {\n  type: "bar",\n  data: {\n    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],\n    datasets: [{\n      label: "# of Votes",\n      data: [12, 19, 3, 5, 2, 3],\n      borderWidth: 1\n    }]\n  },\n  options: {\n    scales: {\n      y: {\n        beginAtZero: true\n      }\n    }\n  }\n});',
    },
  },

  // React Presets
  {
    id: 'react-counter',
    name: 'Counter Component',
    description: 'A simple counter with useState.',
    type: 'react',
    data: [
      {
        name: 'App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Counter: {count}</h1>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => setCount(c => c - 1)}>Decrement</button>
        <button onClick={() => setCount(c => c + 1)}>Increment</button>
      </div>
    </div>
  );
}`,
      },
    ],
  },
  {
    id: 'react-todo',
    name: 'Todo List',
    description: 'A todo list with add and delete functionality.',
    type: 'react',
    data: [
      {
        name: 'App.tsx',
        language: 'typescript',
        content: `import React, { useState } from 'react';
import TodoItem from './TodoItem';

export default function App() {
  const [todos, setTodos] = useState<{id: number, text: string}[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input }]);
    setInput('');
  };

  const removeTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  return (
    <div style={{ maxWidth: 400, margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h2>Todo List</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px' }}>Add</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <TodoItem key={todo.id} todo={todo} onDelete={removeTodo} />
        ))}
        {todos.length === 0 && <p style={{ color: '#888' }}>No tasks yet.</p>}
      </ul>
    </div>
  );
}`,
      },
      {
        name: 'TodoItem.tsx',
        language: 'typescript',
        content: `import React from 'react';

export default function TodoItem({ todo, onDelete }: any) {
  return (
    <li style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '8px 0',
      borderBottom: '1px solid #eee'
    }}>
      <span>{todo.text}</span>
      <button 
        onClick={() => onDelete(todo.id)}
        style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
      >
        Delete
      </button>
    </li>
  );
}`,
      },
    ],
  },
  {
    id: 'react-effects',
    name: 'useEffect Fetch',
    description: 'Fetching data from an API using useEffect.',
    type: 'react',
    data: [
      {
        name: 'App.tsx',
        language: 'typescript',
        content: `import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>API Data</h1>
      <pre style={{ background: '#f4f4f4', padding: 10, borderRadius: 4 }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}`,
      },
    ],
  },

  // JavaScript Presets
  {
    id: 'js-basics',
    name: 'JS Basics',
    description: 'Console logging and basic variables.',
    type: 'javascript',
    data: `// Basic JavaScript Example
const name = "Developer";
console.log("Hello, " + name + "!");

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);

console.log("Original:", numbers);
console.log("Doubled:", doubled);`,
  },
  {
    id: 'js-async',
    name: 'Async/Await',
    description: 'Fetching data asynchronously.',
    type: 'javascript',
    data: `// Async/Await Example
async function fetchData() {
  console.log("Fetching data...");
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const data = await response.json();
    console.log("Data received:", data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchData();`,
  },
  {
    id: 'js-objects',
    name: 'Object Manipulation',
    description: 'Working with objects and arrays.',
    type: 'javascript',
    data: `const users = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
  { id: 3, name: 'Charlie', role: 'User' },
];

// Filter users
const admins = users.filter(u => u.role === 'Admin');
console.log("Admins:", admins);

// Transform users
const userNames = users.map(u => u.name);
console.log("User Names:", userNames);

// Reduce
const rolesCount = users.reduce((acc, user) => {
  acc[user.role] = (acc[user.role] || 0) + 1;
  return acc;
}, {});

console.log("Role Counts:", rolesCount);`,
  },
];
