(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["6591a143"],{a92ea9b9:function(e,t,a){a.d(t,"__esModule",{value:!0}),a.e(t,{default:function(){return eC;}});var r=a("777fffbe"),i=a("852bbaa9"),l=a("1a7c85b4"),n=a("3cdaadee"),s=a("d43df923"),o=a("93cff216"),c=r._(o),d=a("81108cbb"),u=r._(d),m=a("b1e256d1"),f=r._(m),h=a("1ee4d6ad"),g=r._(h),p=a("07d5c3d6"),x=r._(p),b=a("57727de8"),y=r._(b),v=a("f6c9c5f6"),j=r._(v),C=a("adbfb03b"),k=r._(C),w=a("c0340237"),S=r._(w),M=a("36ede29e"),A=r._(M),T=a("5c60b09b"),R=r._(T),D=a("452a6b49"),N=r._(D),E=a("54c1db7a"),_=r._(E),L=a("b2ef07e9"),B=r._(L),P=a("88fe0e90"),z=r._(P),F=a("684426da"),I=r._(F),O=a("7e7852f8"),q=r._(O),G=a("b2a1469e"),W=r._(G),U=a("764a8673"),H=r._(U),Y=a("97125d22"),$=r._(Y),J=a("c9d8dc0b"),X=r._(J),V=a("88b618ad"),Z=r._(V),Q=a("d4a32650"),K=r._(Q),ee=a("6effc0fd"),et=r._(ee),ea=a("d322be42"),er=i._(ea),ei=a("f79388d9");let el={flowchart:{label:"Flowchart",icon:"\u{1F4CA}",code:`flowchart TD
    A[Christmas] -->|Get money| B(Go shopping)
    B --> C{Let me think}
    C -->|One| D[Laptop]
    C -->|Two| E[iPhone]
    C -->|Three| F[fa:fa-car Car]`},sequence:{label:"Sequence",icon:"\u{1F504}",code:`sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!`},classDiagram:{label:"Class",icon:"\u{1F3D7}\uFE0F",code:`classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
        +String beakColor
        +swim()
        +quack()
    }
    class Fish{
        -int sizeInFeet
        -canEat()
    }
    class Zebra{
        +bool is_wild
        +run()
    }`},stateDiagram:{label:"State",icon:"\u{1F532}",code:`stateDiagram-v2
    [*] --> Still
    Still --> [*]

    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`},erDiagram:{label:"Entity Relationship",icon:"\u{1F5C3}\uFE0F",code:`erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`},gantt:{label:"Gantt",icon:"\u{1F4C5}",code:`gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
        A task          :a1, 2024-01-01, 30d
        Another task    :after a1, 20d
    section Another
        Task in Another :2024-01-12, 12d
        another task    :24d`},pie:{label:"Pie",icon:"\u{1F967}",code:`pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`},gitGraph:{label:"Git",icon:"\u{1F33F}",code:`gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit`},mindmap:{label:"Mindmap",icon:"\u{1F9E0}",code:`mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)
      Popularisation
        British popular psychology author Tony Buzan
    Research
      On effectiveness<br/>and features
      On Automatic creation
        Uses
            Creative techniques
            Strategic planning
            Argument mapping
    Tools
      Pen and paper
      Mermaid`},timeline:{label:"Timeline",icon:"\u23F3",code:`timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
         : Google
    2005 : YouTube
    2006 : Twitter`},quadrant:{label:"Quadrant",icon:"\u{1F4D0}",code:`quadrantChart
    title Reach and engagement of campaigns
    x-axis Low Reach --> High Reach
    y-axis Low Engagement --> High Engagement
    quadrant-1 We should expand
    quadrant-2 Need to promote
    quadrant-3 Re-evaluate
    quadrant-4 May be improved
    Campaign A: [0.3, 0.6]
    Campaign B: [0.45, 0.23]
    Campaign C: [0.57, 0.69]
    Campaign D: [0.78, 0.34]
    Campaign E: [0.40, 0.34]
    Campaign F: [0.35, 0.78]`},sankey:{label:"Sankey",icon:"\u{1F30A}",code:`sankey-beta

Agricultural 'waste',Bio-energy,124.729
Bio-energy,Electricity grid,29.544
Bio-energy,Losses,6.242
Bio-energy,Industry,10.544
Coal imports,Coal,135.835
Coal reserves,Coal,35.000
Coal,Electricity grid,35.999
Coal,Industry,11.606
Coal,Losses,51.230`},xychart:{label:"XY Chart",icon:"\u{1F4C8}",code:`xychart-beta
    title "Sales Revenue"
    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
    y-axis "Revenue (in $)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]`},block:{label:"Block",icon:"\u{1F9F1}",code:`block-beta
columns 1
  db(("DB"))
  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
  block:ID
    A
    B["A wide one in the middle"]
    C
  end
  space
  D
  ID --> D
  C --> D
  style B fill:#969,stroke:#333,stroke-width:4px`},journey:{label:"User Journey",icon:"\u{1F6B6}",code:`journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`},requirement:{label:"Requirement",icon:"\u{1F4CB}",code:`requirementDiagram

    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }

    element test_entity {
    type: simulation
    }

    test_entity - satisfies -> test_req`},c4:{label:"C4",icon:"\u{1F3E2}",code:`C4Context
      title System Context diagram for Internet Banking System
      Enterprise_Boundary(b0, "BankBoundary0") {
        Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
        System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")

        Enterprise_Boundary(b1, "BankBoundary") {
          SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
          System_Boundary(b2, "BankBoundary2") {
            System(SystemA, "Banking System A")
          }
        }
      }

      BiRel(customerA, SystemAA, "Uses")
      Rel(SystemAA, SystemE, "Uses")
      Rel(SystemAA, SystemA, "Uses")

      UpdateRelStyle(customerA, SystemAA, $offsetY="10")`},kanban:{label:"Kanban",icon:"\u{1F4CC}",code:`kanban
  Todo
    id1[Design new feature]
    id2[Write documentation]
  "In Progress"
    id3[Implement login]@{ assigned: 'knsv' }
  Done
    id4[Setup CI/CD]
    id5[Create test cases]`}},en=el.flowchart.code,es=`{
  "theme": "default"
}`;var eo={fullscreenContent:"fullscreenContent-5QHMvfvD",mermaidEditorPageDark:"mermaidEditorPageDark-0uqRHYPB",previewPane:"previewPane-V8yqv8mL",toolbar:"toolbar-P6PY3OSU",sampleGrid:"sampleGrid-ylYNvRTR",errorMessage:"errorMessage-09DphXw0",editorPane:"editorPane-uBafukMN",editorTab:"editorTab-LwbGvuQv",mermaidOutput:"mermaidOutput-h_lG0LPQ",sampleIcon:"sampleIcon-k03R-H5M",fullscreenHeader:"fullscreenHeader-vNwgiEM6",toolbarLeft:"toolbarLeft-rk4j-HZs",editorContent:"editorContent-JcQkascd",previewContent:"previewContent-STtgrtW-",editorTabs:"editorTabs-aLzkjWsc",previewTitle:"previewTitle-hC0wgeAG",fullscreenOverlay:"fullscreenOverlay-YsfxxJ3F",active:"active-NKZINbso",toolbarRight:"toolbarRight-kDAHcCSf",previewHeader:"previewHeader-zAfSNtTo",editorContainer:"editorContainer-r1mqEq7F",previewActions:"previewActions-ssoXK-lU",mermaidEditorPage:"mermaidEditorPage-h4k9NT7L",sampleCard:"sampleCard-HN8bm_zj",sampleDiagramsPanel:"sampleDiagramsPanel-fC-p95mX"},ec=a("f1001040"),ed=r._(ec),eu=a("8fd9fc22"),em=r._(eu),ef=a("1ee30358");let{Title:eh,Text:eg}=et.default,ep=e=>{let t=btoa(String.fromCharCode(...(0,ef.deflate)(new TextEncoder().encode(e),{level:9}))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");return`pako:${t}`;},ex=e=>{try{let t=e.startsWith("#")?e.slice(1):e;if(!t.startsWith("pako:"))return null;let a=t.slice(5).replace(/-/g,"+").replace(/_/g,"/"),r=atob(a),i=Uint8Array.from(r,e=>e.charCodeAt(0));return new TextDecoder().decode((0,ef.inflate)(i));}catch{return null;}},eb={backgroundImage:"linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.06) 75%)",backgroundPosition:"0 0, 0 10px, 10px -10px, -10px 0px",backgroundSize:"20px 20px"},ey=(e,t)=>t?{backgroundColor:e,...eb}:{backgroundColor:e},ev="mermaid-editor",ej=()=>{try{let e=localStorage.getItem(ev);if(e)return JSON.parse(e);}catch{}return null;},eC=()=>{let{darkMode:e}=(0,n.useDarkMode)(),t=(0,s.useIsMobile)(),a=(0,er.useRef)(ej()).current,r=ex(window.location.hash)??(null==a?void 0:a.code)??en,[i,o]=(0,er.useState)(r),[d,m]=(0,er.useState)((null==a?void 0:a.config)??es),[h,p]=(0,er.useState)("code"),[b,v]=(0,er.useState)(""),[C,w]=(0,er.useState)(""),[M,T]=(0,er.useState)(!1),[D,E]=(0,er.useState)((null==a?void 0:a.previewBg)??(e?"#1f1f1f":"#ffffff")),[L,P]=(0,er.useState)((null==a?void 0:a.showGrid)??!0);(0,er.useEffect)(()=>{try{localStorage.setItem(ev,JSON.stringify({code:i,config:d,previewBg:D,showGrid:L}));}catch{}},[i,d,D,L]);let F=(0,er.useRef)(null),O=(0,er.useRef)(null),G=(0,er.useRef)(null),U=(0,er.useRef)(null),Y=(0,er.useRef)(),J=(0,er.useRef)(0),[V,Q]=(0,er.useState)(1),[ee,et]=(0,er.useState)(1),[ea,ec]=(0,er.useState)({x:0,y:0}),eu=(0,er.useRef)(!1),ef=(0,er.useRef)({x:0,y:0}),eb=(0,er.useRef)({x:0,y:0}),eC=(0,er.useRef)(),[ek,ew]=(0,er.useState)(1),[eS,eM]=(0,er.useState)(1),[eA,eT]=(0,er.useState)({x:0,y:0}),eR=(0,er.useRef)(!1),eD=(0,er.useRef)({x:0,y:0}),eN=(0,er.useRef)({x:0,y:0}),eE=(0,er.useRef)();(0,er.useEffect)(()=>{Q(1),et(1),ec({x:0,y:0});},[b]);let e_=(e,t)=>{if(!e)return;let a=e.querySelector("svg");if(!a)return;let r=a.getAttribute("data-base-width"),i=a.getAttribute("data-base-height"),l=r?parseFloat(r):NaN,n=i?parseFloat(i):NaN;if(!isFinite(l)||!isFinite(n)){let e=a.getAttribute("viewBox");if(e){let t=e.split(/[\s,]+/).map(Number);4===t.length&&(l=t[2],n=t[3]);}if(!isFinite(l)||!isFinite(n)){let e=parseFloat(a.getAttribute("width")||""),t=parseFloat(a.getAttribute("height")||"");if(isFinite(e)&&isFinite(t))l=e,n=t;else{var s;let e=null===(s=a.getBBox)||void 0===s?void 0:s.call(a);e&&(l=e.width,n=e.height);}}isFinite(l)&&isFinite(n)&&(a.setAttribute("data-base-width",String(l)),a.setAttribute("data-base-height",String(n)));}isFinite(l)&&isFinite(n)&&(a.setAttribute("width",String(l*t)),a.setAttribute("height",String(n*t)),a.style.maxWidth="none");};(0,er.useEffect)(()=>{e_(G.current,ee);},[ee,b]),(0,er.useEffect)(()=>{e_(U.current,eS);},[eS,b,M]);let eL=(0,er.useCallback)(e=>{eC.current&&clearTimeout(eC.current),eC.current=setTimeout(()=>et(e),180);},[]),eB=(0,er.useCallback)(e=>{eE.current&&clearTimeout(eE.current),eE.current=setTimeout(()=>eM(e),180);},[]);(0,er.useEffect)(()=>()=>{eC.current&&clearTimeout(eC.current),eE.current&&clearTimeout(eE.current);},[]);let eP=()=>{eE.current&&clearTimeout(eE.current),ew(1),eM(1),eT({x:0,y:0});},ez=(0,er.useCallback)(e=>{e.preventDefault();let t=e.currentTarget.getBoundingClientRect(),a=e.clientX-t.left,r=e.clientY-t.top,i=t.width/2,l=t.height/2;Q(t=>{let n=Math.min(5,Math.max(.1,t*Math.exp(-(.0015*e.deltaY)))),s=n/t;return ec(e=>({x:a-i-(a-i-e.x)*s,y:r-l-(r-l-e.y)*s})),eL(n),n;});},[eL]),eF=(0,er.useCallback)(e=>{0===e.button&&(eu.current=!0,ef.current={x:e.clientX,y:e.clientY},eb.current={...ea},e.currentTarget.style.cursor="grabbing");},[ea]),eI=(0,er.useCallback)(e=>{if(!eu.current)return;let t=e.clientX-ef.current.x,a=e.clientY-ef.current.y;ec({x:eb.current.x+t,y:eb.current.y+a});},[]),eO=(0,er.useCallback)(e=>{eu.current=!1,e.currentTarget.style.cursor="grab";},[]),eq=(0,er.useCallback)(e=>{e.preventDefault();let t=e.currentTarget.getBoundingClientRect(),a=e.clientX-t.left,r=e.clientY-t.top,i=t.width/2,l=t.height/2;ew(t=>{let n=Math.min(5,Math.max(.1,t*Math.exp(-(.0015*e.deltaY)))),s=n/t;return eT(e=>({x:a-i-(a-i-e.x)*s,y:r-l-(r-l-e.y)*s})),eB(n),n;});},[eB]),eG=(0,er.useCallback)(e=>{0===e.button&&(eR.current=!0,eD.current={x:e.clientX,y:e.clientY},eN.current={...eA},e.currentTarget.style.cursor="grabbing");},[eA]),eW=(0,er.useCallback)(e=>{if(!eR.current)return;let t=e.clientX-eD.current.x,a=e.clientY-eD.current.y;eT({x:eN.current.x+t,y:eN.current.y+a});},[]),eU=(0,er.useCallback)(e=>{eR.current=!1,e.currentTarget.style.cursor="grab";},[]);(0,er.useEffect)(()=>{em.default.initialize({startOnLoad:!1,theme:e?"dark":"default",securityLevel:"loose",fontFamily:'"trebuchet ms", verdana, arial, sans-serif',flowchart:{useMaxWidth:!1,htmlLabels:!0,padding:15},sequence:{useMaxWidth:!1},gantt:{useMaxWidth:!1},class:{useMaxWidth:!1},state:{useMaxWidth:!1},er:{useMaxWidth:!1},pie:{useMaxWidth:!1},journey:{useMaxWidth:!1}});},[e]);let eH=(0,er.useCallback)(async(t,a)=>{Y.current&&clearTimeout(Y.current),Y.current=setTimeout(async()=>{let r=++J.current;try{let i={};try{i=JSON.parse(a);}catch{}em.default.initialize({startOnLoad:!1,theme:e?"dark":"default",securityLevel:"loose",fontFamily:'"trebuchet ms", verdana, arial, sans-serif',flowchart:{useMaxWidth:!1,htmlLabels:!0,padding:15},sequence:{useMaxWidth:!1},gantt:{useMaxWidth:!1},class:{useMaxWidth:!1},state:{useMaxWidth:!1},er:{useMaxWidth:!1},pie:{useMaxWidth:!1},journey:{useMaxWidth:!1},...i}),await em.default.parse(t);let l=`mermaid-preview-${r}-${Date.now()}`,{svg:n}=await em.default.render(l,t);r===J.current&&(v(n),w(""));}catch(e){r===J.current&&w((null==e?void 0:e.message)||"Failed to render diagram");}},300);},[e]);(0,er.useEffect)(()=>(eH(i,d),()=>{Y.current&&clearTimeout(Y.current);}),[i,d,eH]);let eY=async()=>{try{let e=ep(i),t=`${window.location.origin}${window.location.pathname}#${e}`;window.history.replaceState(null,"",`#${e}`),await navigator.clipboard.writeText(t),X.default.success("Share link copied to clipboard!");}catch{X.default.error("Failed to copy share link");}},e$=async()=>{if(!b){X.default.warning("No diagram to copy");return;}try{await navigator.clipboard.writeText(b),X.default.success("SVG copied to clipboard");}catch{X.default.error("Failed to copy");}},eJ=async()=>{try{await navigator.clipboard.writeText(i),X.default.success("Code copied to clipboard");}catch{X.default.error("Failed to copy");}},eX=e=>{let t=el[e];t&&(o(t.code),p("code"));},eV="code"===h?i:d,eZ=(0,ed.default)(eo.mermaidEditorPage,{[eo.mermaidEditorPageDark]:e});return(0,l.jsxs)("div",{className:eZ,children:[(0,l.jsxs)("div",{className:eo.toolbar,children:[(0,l.jsxs)("div",{className:eo.toolbarLeft,children:[(0,l.jsx)(eh,{level:5,style:{margin:0},children:"Mermaid Live Editor"}),C?(0,l.jsx)(eg,{type:"danger",style:{fontSize:12},children:"\u25CF Syntax Error"}):b?(0,l.jsx)(eg,{type:"success",style:{fontSize:12},children:"\u25CF Valid"}):null]}),(0,l.jsxs)("div",{className:eo.toolbarRight,children:[(0,l.jsx)(K.default,{title:"Share (copy link)",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(I.default,{}),size:"small",onClick:eY})}),(0,l.jsx)(K.default,{title:"Copy Code",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(g.default,{}),size:"small",onClick:eJ})}),(0,l.jsx)(K.default,{title:"Copy SVG",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(f.default,{}),size:"small",onClick:e$})}),(0,l.jsx)(K.default,{title:"Download SVG",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(x.default,{}),size:"small",onClick:()=>{if(!b){X.default.warning("No diagram to download");return;}let e=new Blob([b],{type:"image/svg+xml"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download="mermaid-diagram.svg",a.click(),URL.revokeObjectURL(t),X.default.success("SVG downloaded");}})}),(0,l.jsx)(K.default,{title:"Download PNG",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(A.default,{}),size:"small",onClick:()=>{if(!b){X.default.warning("No diagram to download");return;}let t=document.createElement("div");t.innerHTML=b;let a=t.querySelector("svg");if(!a)return;let r=a.getAttribute("viewBox"),i=0,l=0;if(r){let e=r.split(/[\s,]+/).map(Number);4===e.length&&(i=e[2],l=e[3]);}if(!i||!l){let e=a.getAttribute("width"),t=a.getAttribute("height");e&&t&&(i=parseFloat(e),l=parseFloat(t));}i&&l&&!isNaN(i)&&!isNaN(l)&&(a.setAttribute("width",i.toString()),a.setAttribute("height",l.toString())),a.querySelectorAll("style").forEach(e=>{e.textContent=(e.textContent??"").replace(/@import[^;]+;/g,"");}),a.querySelectorAll("use").forEach(e=>{let t=e.getAttribute("href")||e.getAttribute("xlink:href")||"";/^https?:\/\/|^\/\//.test(t)&&e.remove();}),a.querySelectorAll("image").forEach(e=>{let t=e.getAttribute("href")||e.getAttribute("xlink:href")||"";/^https?:\/\/|^\/\//.test(t)&&e.remove();});let n=new XMLSerializer().serializeToString(a),s=`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(n)))}`,o=document.createElement("canvas"),c=o.getContext("2d");if(!c)return;let d=new Image;d.onload=()=>{o.width=2*d.width,o.height=2*d.height,c.scale(2,2),c.fillStyle=e?"#1f1f1f":"#ffffff",c.fillRect(0,0,d.width,d.height),c.drawImage(d,0,0),o.toBlob(e=>{if(!e)return;let t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download="mermaid-diagram.png",a.click(),URL.revokeObjectURL(t),X.default.success("PNG downloaded");});},d.src=s;}})}),(0,l.jsx)(K.default,{title:"Save to Google Drive",children:(0,l.jsx)(ei.SaveToDriveButton,{getContent:()=>i,fileName:"mermaid-diagram.mmd",mimeType:"text/plain",buttonProps:{size:"small",icon:(0,l.jsx)(B.default,{})},children:null})}),(0,l.jsx)(K.default,{title:"Load from Google Drive",children:(0,l.jsx)(ei.LoadFromDriveButton,{onLoad:e=>o(e),accept:["text/plain"],buttonProps:{size:"small",icon:(0,l.jsx)(z.default,{})},children:null})}),(0,l.jsx)(K.default,{title:"Fullscreen",children:(0,l.jsx)(W.default,{icon:(0,l.jsx)(y.default,{}),size:"small",onClick:()=>T(!0)})})]})]}),(0,l.jsxs)(Z.default,{className:eo.editorContainer,layout:t?"vertical":"horizontal",children:[(0,l.jsx)(Z.default.Panel,{defaultSize:"30%",min:"20%",children:(0,l.jsxs)("div",{className:eo.editorPane,children:[(0,l.jsxs)("div",{className:eo.editorTabs,children:[(0,l.jsxs)("div",{className:(0,ed.default)(eo.editorTab,{[eo.active]:"code"===h}),onClick:()=>p("code"),children:[(0,l.jsx)(f.default,{})," Code"]}),(0,l.jsxs)("div",{className:(0,ed.default)(eo.editorTab,{[eo.active]:"config"===h}),onClick:()=>p("config"),children:[(0,l.jsx)(k.default,{})," Config"]})]}),(0,l.jsx)("div",{className:eo.editorContent,children:(0,l.jsx)(q.default,{height:"100%",language:"code"===h?"markdown":"json",value:eV,theme:e?"vs-dark":"vs",onChange:e=>{"code"===h?o(e||""):m(e||"");},options:{minimap:{enabled:!1},fontSize:14,lineNumbers:"on",wordWrap:"on",scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:12},tabSize:2}})}),(0,l.jsx)(H.default,{ghost:!0,size:"small",items:[{key:"samples",label:(0,l.jsxs)("span",{children:[(0,l.jsx)(R.default,{})," Sample Diagrams"]}),children:(0,l.jsx)("div",{className:eo.sampleDiagramsPanel,children:(0,l.jsx)("div",{className:eo.sampleGrid,children:Object.entries(el).map(([e,t])=>(0,l.jsxs)("div",{className:eo.sampleCard,onClick:()=>eX(e),children:[(0,l.jsx)("div",{className:eo.sampleIcon,children:t.icon}),(0,l.jsx)("div",{children:t.label})]},e))})})}]})]})}),(0,l.jsx)(Z.default.Panel,{min:"20%",children:(0,l.jsxs)("div",{className:eo.previewPane,children:[(0,l.jsxs)("div",{className:eo.previewHeader,children:[(0,l.jsxs)("span",{className:eo.previewTitle,children:[(0,l.jsx)(j.default,{})," Preview",(0,l.jsxs)(eg,{type:"secondary",style:{fontSize:11,marginLeft:8},children:[Math.round(100*V),"%"]})]}),(0,l.jsxs)("div",{className:eo.previewActions,children:[(0,l.jsx)(K.default,{title:"Toggle Grid",children:(0,l.jsx)(W.default,{type:L?"primary":"text",size:"small",icon:(0,l.jsx)(u.default,{}),onClick:()=>P(e=>!e)})}),(0,l.jsx)($.default,{size:"small",value:D,onChange:(e,t)=>E(t),presets:[{label:"Presets",colors:["#ffffff","#f5f5f5","#e8e8e8","#1f1f1f","#141414","#000000","#f0f5ff","#f6ffed","#fff7e6","#fff1f0"]}]}),(0,l.jsx)(K.default,{title:"Zoom In",children:(0,l.jsx)(W.default,{type:"text",size:"small",icon:(0,l.jsx)(N.default,{}),onClick:()=>Q(e=>{let t=Math.min(5,e+.1);return eL(t),t;})})}),(0,l.jsx)(K.default,{title:"Zoom Out",children:(0,l.jsx)(W.default,{type:"text",size:"small",icon:(0,l.jsx)(_.default,{}),onClick:()=>Q(e=>{let t=Math.max(.1,e-.1);return eL(t),t;})})}),(0,l.jsx)(K.default,{title:"Reset View",children:(0,l.jsx)(W.default,{type:"text",size:"small",icon:(0,l.jsx)(c.default,{}),onClick:()=>{eC.current&&clearTimeout(eC.current),Q(1),et(1),ec({x:0,y:0});}})}),(0,l.jsx)(K.default,{title:"Fullscreen",children:(0,l.jsx)(W.default,{type:"text",size:"small",icon:(0,l.jsx)(y.default,{}),onClick:()=>T(!0)})})]})]}),(0,l.jsx)("div",{className:eo.previewContent,ref:F,onWheel:ez,onMouseDown:eF,onMouseMove:eI,onMouseUp:eO,onMouseLeave:eO,style:{cursor:"grab",...ey(D,L)},children:C?(0,l.jsx)("div",{className:eo.errorMessage,children:C}):b?(0,l.jsx)("div",{ref:G,className:eo.mermaidOutput,style:{transform:`translate(${ea.x}px, ${ea.y}px) scale(${V/ee})`,transformOrigin:"center center",willChange:"transform"},dangerouslySetInnerHTML:{__html:b}}):(0,l.jsx)(eg,{type:"secondary",children:"Enter Mermaid code to see preview..."})})]})})]}),M&&(0,l.jsxs)("div",{className:eo.fullscreenOverlay,children:[(0,l.jsxs)("div",{className:eo.fullscreenHeader,children:[(0,l.jsx)(eh,{level:5,style:{margin:0},children:"Mermaid Diagram Preview"}),(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8},children:[(0,l.jsxs)(eg,{type:"secondary",style:{fontSize:12},children:[Math.round(100*ek),"%"]}),(0,l.jsx)(K.default,{title:"Zoom In",children:(0,l.jsx)(W.default,{size:"small",icon:(0,l.jsx)(N.default,{}),onClick:()=>ew(e=>{let t=Math.min(5,e+.1);return eB(t),t;})})}),(0,l.jsx)(K.default,{title:"Zoom Out",children:(0,l.jsx)(W.default,{size:"small",icon:(0,l.jsx)(_.default,{}),onClick:()=>ew(e=>{let t=Math.max(.1,e-.1);return eB(t),t;})})}),(0,l.jsx)(K.default,{title:"Reset View",children:(0,l.jsx)(W.default,{size:"small",icon:(0,l.jsx)(c.default,{}),onClick:eP})}),(0,l.jsx)(W.default,{icon:(0,l.jsx)(S.default,{}),onClick:()=>{T(!1),eP();},children:"Exit Fullscreen"})]})]}),(0,l.jsx)("div",{className:eo.fullscreenContent,ref:O,onWheel:eq,onMouseDown:eG,onMouseMove:eW,onMouseUp:eU,onMouseLeave:eU,style:{cursor:"grab",...ey(D,L)},children:C?(0,l.jsx)("div",{className:eo.errorMessage,children:C}):b?(0,l.jsx)("div",{ref:U,className:eo.mermaidOutput,style:{transform:`translate(${eA.x}px, ${eA.y}px) scale(${ek/eS})`,transformOrigin:"center center",willChange:"transform"},dangerouslySetInnerHTML:{__html:b}}):(0,l.jsx)(eg,{type:"secondary",children:"No diagram to display"})})]})]});};}}]);
//# sourceMappingURL=6591a143-async.d6d81342.js.map