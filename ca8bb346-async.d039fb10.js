(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ant-design-pro"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ant-design-pro"]||[]).push([["ca8bb346"],{"9dd1b3dc":function(e,t,l){l.d(t,"__esModule",{value:!0}),l.e(t,{default:function(){return U;}});var a=l("777fffbe"),n=l("852bbaa9"),r=l("1a7c85b4"),o=l("b1e256d1"),i=a._(o),d=l("1ee4d6ad"),s=a._(d),c=l("07d5c3d6"),u=a._(c),h=l("5af7999d"),f=a._(h),p=l("cd4e89d2"),m=a._(p),g=l("7e7852f8"),b=a._(g),x=l("b2a1469e"),y=a._(x),v=l("e9bcd22d"),j=a._(v),S=l("c9d8dc0b"),C=a._(S),T=l("ae31d792"),_=a._(T),k=l("3eb6f542"),N=a._(k),L=l("ea21718c"),E=a._(L),w=l("92be0fc5"),M=a._(w),B=l("6effc0fd"),H=a._(B),$=l("d322be42"),A=n._($),D=l("b9a1c321"),F=a._(D);let J=`<div class="container">
    <h1>Hello World \u{1F30D}</h1>
    <p>This is a live HTML + CSS + JS playground!</p>
    <button id="clickBtn">Click me</button>
  </div>`,O=`
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
  `,P=`
  document.getElementById('clickBtn').addEventListener('click', () => {
    alert('Hello from JavaScript!');
  });
  `,{Title:R}=H.default,U=()=>{let[e,t]=(0,A.useState)("html"),[l,a]=(0,A.useState)("html"),[n,o]=(0,A.useState)(J),[d,c]=(0,A.useState)(O),[h,p]=(0,A.useState)(P),[g,x]=(0,A.useState)(""),v=e=>{try{let t=new DOMParser().parseFromString(e,"text/html"),l=(e,t=0)=>{let a="  ".repeat(t),n="";if(e.nodeType===Node.TEXT_NODE){var r;let t=null===(r=e.textContent)||void 0===r?void 0:r.trim();return t&&(n+=a+t+"\n"),n;}if(e.nodeType===Node.ELEMENT_NODE){let r=e.tagName.toLowerCase();for(let t of(n+=`${a}<${r}`,Array.from(e.attributes)))n+=` ${t.name}="${t.value}"`;n+=">";let o=Array.from(e.childNodes),i=o.some(e=>{var t;return e.nodeType===Node.ELEMENT_NODE||(null===(t=e.textContent)||void 0===t?void 0:t.trim());});for(let e of(i&&(n+="\n"),o))n+=l(e,t+1);i&&(n+=a),n+=`</${r}>
`;}return n;};return Array.from(t.body.childNodes).map(e=>l(e)).join("").trim();}catch{return e;}};(0,A.useEffect)(()=>{x(`
      <!DOCTYPE html>
      <html lang="en">
      <head><style>${d}</style></head>
      <body>
        ${n}
        <script>${h}</script>
      </body>
      </html>`);},[n,d,h]);let S=async e=>{try{await navigator.clipboard.writeText(e),C.default.success("Copied!");}catch{C.default.error("Failed to copy.");}},T=(e,t)=>{let l=new Blob([t],{type:"text/plain;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(l),a.download=e,a.click();},[k,L]=(0,A.useState)("javascript"),[w,B]=(0,A.useState)(`// Try something!
console.log("Hello, playground!");`),[H,$]=(0,A.useState)("");return(0,r.jsxs)("div",{className:"playground-container",children:[(0,r.jsx)(R,{level:2,className:"playground-title",children:"\u{1F9E0} Ultimate Playground"}),(0,r.jsx)(_.default,{options:[{label:"HTML / CSS / JS",value:"html"},{label:"JS / TS Runner",value:"playground"}],value:e,onChange:e=>t(e),style:{marginBottom:16}}),"html"===e?(0,r.jsxs)(j.default,{className:"html-card",variant:"borderless",children:[(0,r.jsx)(M.default,{defaultActiveKey:"html",items:[{key:"html",label:"HTML",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(E.default,{align:"center",style:{marginBottom:12},children:[(0,r.jsx)(_.default,{options:[{label:"HTML Mode",value:"html",icon:(0,r.jsx)(i.default,{})},{label:"Rich Mode",value:"rich",icon:(0,r.jsx)(f.default,{})}],value:l,onChange:e=>a(e)}),(0,r.jsx)(y.default,{icon:(0,r.jsx)(m.default,{}),onClick:()=>{if(!n.trim()){C.default.warning("No HTML content to prettify.");return;}o(v(n)),C.default.success("HTML prettified!");},children:"Prettify"})]}),"rich"===l?(0,r.jsx)(F.default,{value:n,onChange:o}):(0,r.jsx)(b.default,{height:"400px",language:"html",value:n,onChange:e=>o(e||""),options:{minimap:{enabled:!1}}})]})},{key:"css",label:"CSS",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(E.default,{align:"center",style:{marginBottom:12},children:(0,r.jsx)(y.default,{icon:(0,r.jsx)(m.default,{}),onClick:()=>C.default.info("Add CSS prettifier here"),children:"Prettify"})}),(0,r.jsx)(b.default,{height:"400px",language:"css",value:d,onChange:e=>c(e||""),options:{minimap:{enabled:!1}}})]})},{key:"js",label:"JS",children:(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(E.default,{align:"center",style:{marginBottom:12},children:(0,r.jsx)(y.default,{icon:(0,r.jsx)(m.default,{}),onClick:()=>C.default.info("Add JS prettifier here"),children:"Prettify"})}),(0,r.jsx)(b.default,{height:"400px",language:"javascript",value:h,onChange:e=>p(e||""),options:{minimap:{enabled:!1}}})]})}]}),(0,r.jsxs)(E.default,{style:{marginTop:16},children:[(0,r.jsx)(y.default,{icon:(0,r.jsx)(s.default,{}),onClick:()=>S(g),children:"Copy All"}),(0,r.jsx)(y.default,{icon:(0,r.jsx)(u.default,{}),onClick:()=>T("index.html",g),children:"Download HTML"})]}),(0,r.jsxs)("div",{className:"preview-pane",style:{marginTop:24},children:[(0,r.jsx)(R,{level:5,children:"Live Preview"}),(0,r.jsx)("iframe",{title:"preview",srcDoc:g,className:"html-preview",style:{width:"100%",height:"600px",border:"1px solid #ddd",borderRadius:8,background:"#fff"}})]})]}):(0,r.jsxs)(j.default,{className:"playground-card",variant:"borderless",children:[(0,r.jsxs)(E.default,{style:{marginBottom:16},children:[(0,r.jsx)(N.default,{value:k,onChange:e=>L(e),options:[{label:"JavaScript",value:"javascript"},{label:"TypeScript",value:"typescript"}]}),(0,r.jsx)(y.default,{type:"primary",onClick:()=>{let e=[],t=console.log,l=console.error;console.log=(...l)=>{e.push(l.join(" ")),t(...l);},console.error=(...t)=>{e.push("\u274C "+t.join(" ")),l(...t);};try{let t=Function(w)();void 0!==t&&e.push(`\u{27A1}\u{FE0F} ${String(t)}`);}catch(t){e.push(`\u{274C} Error: ${t.message}`);}console.log=t,console.error=l,$(e.join("\n"));},children:"\u25B6 Run"})]}),(0,r.jsx)(b.default,{height:"400px",language:k,value:w,onChange:e=>B(e||""),theme:"vs-light",options:{minimap:{enabled:!1},fontSize:14,scrollBeyondLastLine:!1,automaticLayout:!0}}),(0,r.jsxs)("div",{className:"playground-output",children:[(0,r.jsx)(R,{level:5,children:"Output:"}),(0,r.jsx)("pre",{children:H||"// Your output will appear here"})]})]})]});};}}]);
//# sourceMappingURL=ca8bb346-async.d039fb10.js.map