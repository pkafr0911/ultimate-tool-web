(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ant-design-pro"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ant-design-pro"]||[]).push([["ca8bb346"],{"9dd1b3dc":function(e,t,l){l.d(t,"__esModule",{value:!0}),l.e(t,{default:function(){return I;}});var a=l("777fffbe"),n=l("852bbaa9"),r=l("1a7c85b4"),o=l("3cdaadee"),i=l("b1e256d1"),d=a._(i),s=l("1ee4d6ad"),c=a._(s),u=l("07d5c3d6"),h=a._(u),f=l("5af7999d"),p=a._(f),m=l("cd4e89d2"),g=a._(m),b=l("7e7852f8"),x=a._(b),y=l("b2a1469e"),v=a._(y),j=l("e9bcd22d"),S=a._(j),C=l("c9d8dc0b"),T=a._(C),k=l("ae31d792"),_=a._(k),N=l("3eb6f542"),L=a._(N),E=l("ea21718c"),w=a._(E),M=l("92be0fc5"),B=a._(M),H=l("6effc0fd"),$=a._(H),A=l("d322be42"),D=n._(A),F=l("b9a1c321"),J=a._(F);let O=`<div class="container">
    <h1>Hello World \u{1F30D}</h1>
    <p>This is a live HTML + CSS + JS playground!</p>
    <button id="clickBtn">Click me</button>
  </div>`,P=`
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
  `,R=`
  document.getElementById('clickBtn').addEventListener('click', () => {
    alert('Hello from JavaScript!');
  });
  `,{Title:U}=$.default,I=()=>{let{darkMode:e}=(0,o.useDarkMode)(),[t,l]=(0,D.useState)("html"),[a,n]=(0,D.useState)("html"),[i,s]=(0,D.useState)(O),[u,f]=(0,D.useState)(P),[m,b]=(0,D.useState)(R),[y,j]=(0,D.useState)(""),C=e=>{try{let t=new DOMParser().parseFromString(e,"text/html"),l=(e,t=0)=>{let a="  ".repeat(t),n="";if(e.nodeType===Node.TEXT_NODE){var r;let t=null===(r=e.textContent)||void 0===r?void 0:r.trim();return t&&(n+=a+t+"\n"),n;}if(e.nodeType===Node.ELEMENT_NODE){let r=e.tagName.toLowerCase();for(let t of(n+=`${a}<${r}`,Array.from(e.attributes)))n+=` ${t.name}="${t.value}"`;n+=">";let o=Array.from(e.childNodes),i=o.some(e=>{var t;return e.nodeType===Node.ELEMENT_NODE||(null===(t=e.textContent)||void 0===t?void 0:t.trim());});for(let e of(i&&(n+="\n"),o))n+=l(e,t+1);i&&(n+=a),n+=`</${r}>
`;}return n;};return Array.from(t.body.childNodes).map(e=>l(e)).join("").trim();}catch{return e;}};(0,D.useEffect)(()=>{j(`
      <!DOCTYPE html>
      <html lang="en">
      <head><style>${u}</style></head>
      <body>
        ${i}
        <script>${m}</script>
      </body>
      </html>`);},[i,u,m]);let k=async e=>{try{await navigator.clipboard.writeText(e),T.default.success("Copied!");}catch{T.default.error("Failed to copy.");}},N=(e,t)=>{let l=new Blob([t],{type:"text/plain;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(l),a.download=e,a.click();},[E,M]=(0,D.useState)("javascript"),[H,$]=(0,D.useState)(`// Try something!
console.log("Hello, playground!");`),[A,F]=(0,D.useState)("");return(0,r.jsxs)("div",{className:"playground-container",children:[(0,r.jsx)(U,{level:2,className:"playground-title",children:"\u{1F9E0} Ultimate Playground"}),(0,r.jsx)(_.default,{options:[{label:"HTML / CSS / JS",value:"html"},{label:"JS / TS Runner",value:"playground"}],value:t,onChange:e=>l(e),style:{marginBottom:16}}),"html"===t?(0,r.jsxs)(S.default,{className:"html-card",variant:"borderless",children:[(0,r.jsx)(B.default,{defaultActiveKey:"html",items:[{key:"html",label:"HTML",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(w.default,{align:"center",style:{marginBottom:12},children:[(0,r.jsx)(_.default,{options:[{label:"HTML Mode",value:"html",icon:(0,r.jsx)(d.default,{})},{label:"Rich Mode",value:"rich",icon:(0,r.jsx)(p.default,{})}],value:a,onChange:e=>n(e)}),(0,r.jsx)(v.default,{icon:(0,r.jsx)(g.default,{}),onClick:()=>{if(!i.trim()){T.default.warning("No HTML content to prettify.");return;}s(C(i)),T.default.success("HTML prettified!");},children:"Prettify"})]}),"rich"===a?(0,r.jsx)(J.default,{value:i,onChange:s}):(0,r.jsx)(x.default,{height:"400px",language:"html",value:i,onChange:e=>s(e||""),options:{minimap:{enabled:!1}}})]})},{key:"css",label:"CSS",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(w.default,{align:"center",style:{marginBottom:12},children:(0,r.jsx)(v.default,{icon:(0,r.jsx)(g.default,{}),onClick:()=>T.default.info("Add CSS prettifier here"),children:"Prettify"})}),(0,r.jsx)(x.default,{height:"400px",language:"css",value:u,onChange:e=>f(e||""),options:{minimap:{enabled:!1}}})]})},{key:"js",label:"JS",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(w.default,{align:"center",style:{marginBottom:12},children:(0,r.jsx)(v.default,{icon:(0,r.jsx)(g.default,{}),onClick:()=>T.default.info("Add JS prettifier here"),children:"Prettify"})}),(0,r.jsx)(x.default,{height:"400px",language:"javascript",value:m,onChange:e=>b(e||""),options:{minimap:{enabled:!1}}})]})}]}),(0,r.jsxs)(w.default,{style:{marginTop:16},children:[(0,r.jsx)(v.default,{icon:(0,r.jsx)(c.default,{}),onClick:()=>k(y),children:"Copy All"}),(0,r.jsx)(v.default,{icon:(0,r.jsx)(h.default,{}),onClick:()=>N("index.html",y),children:"Download HTML"})]}),(0,r.jsxs)("div",{className:"preview-pane",style:{marginTop:24},children:[(0,r.jsx)(U,{level:5,children:"Live Preview"}),(0,r.jsx)("iframe",{title:"preview",srcDoc:y,className:"html-preview",style:{width:"100%",height:"600px",border:"1px solid #ddd",borderRadius:8,background:"#fff"}})]})]}):(0,r.jsxs)(S.default,{className:"playground-card",variant:"borderless",children:[(0,r.jsxs)(w.default,{style:{marginBottom:16},children:[(0,r.jsx)(L.default,{value:E,onChange:e=>M(e),options:[{label:"JavaScript",value:"javascript"},{label:"TypeScript",value:"typescript"}]}),(0,r.jsx)(v.default,{type:"primary",onClick:()=>{let e=[],t=console.log,l=console.error;console.log=(...l)=>{e.push(l.join(" ")),t(...l);},console.error=(...t)=>{e.push("\u274C "+t.join(" ")),l(...t);};try{let t=Function(H)();void 0!==t&&e.push(`\u{27A1}\u{FE0F} ${String(t)}`);}catch(t){e.push(`\u{274C} Error: ${t.message}`);}console.log=t,console.error=l,F(e.join("\n"));},children:"\u25B6 Run"})]}),(0,r.jsx)(x.default,{height:"400px",language:E,value:H,onChange:e=>$(e||""),theme:e?"vs-dark":"light",options:{minimap:{enabled:!1},fontSize:14,scrollBeyondLastLine:!1,automaticLayout:!0}}),(0,r.jsxs)("div",{className:"playground-output",children:[(0,r.jsx)(U,{level:5,children:"Output:"}),(0,r.jsx)("pre",{children:A||"// Your output will appear here"})]})]})]});};}}]);
//# sourceMappingURL=ca8bb346-async.84623870.js.map