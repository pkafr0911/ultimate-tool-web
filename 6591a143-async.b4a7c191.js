(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["6591a143"],{a92ea9b9:function(e,t,a){a.d(t,"__esModule",{value:!0}),a.e(t,{default:function(){return ep;}});var i=a("777fffbe"),r=a("852bbaa9"),l=a("1a7c85b4"),n=a("3cdaadee"),s=a("d43df923"),o=a("93cff216"),c=i._(o),d=a("81108cbb"),u=i._(d),m=a("b1e256d1"),f=i._(m),h=a("1ee4d6ad"),g=i._(h),x=a("07d5c3d6"),p=i._(x),b=a("57727de8"),y=i._(b),v=a("f6c9c5f6"),j=i._(v),C=a("adbfb03b"),k=i._(C),w=a("c0340237"),S=i._(w),M=a("36ede29e"),R=i._(M),A=a("5c60b09b"),T=i._(A),D=a("452a6b49"),N=i._(D),L=a("54c1db7a"),E=i._(L),_=a("b2ef07e9"),B=i._(_),P=a("88fe0e90"),z=i._(P),F=a("7e7852f8"),I=i._(F),O=a("b2a1469e"),G=i._(O),q=a("764a8673"),U=i._(q),W=a("97125d22"),H=i._(W),Y=a("c9d8dc0b"),J=i._(Y),X=a("88b618ad"),$=i._(X),V=a("d4a32650"),Z=i._(V),Q=a("6effc0fd"),K=i._(Q),ee=a("d322be42"),et=r._(ee),ea=a("f79388d9");let ei={flowchart:{label:"Flowchart",icon:"\u{1F4CA}",code:`flowchart TD
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
    id5[Create test cases]`}},er=ei.flowchart.code,el=`{
  "theme": "default"
}`;var en={fullscreenContent:"fullscreenContent-5QHMvfvD",mermaidEditorPageDark:"mermaidEditorPageDark-0uqRHYPB",previewPane:"previewPane-V8yqv8mL",toolbar:"toolbar-P6PY3OSU",sampleGrid:"sampleGrid-ylYNvRTR",errorMessage:"errorMessage-09DphXw0",editorPane:"editorPane-uBafukMN",editorTab:"editorTab-LwbGvuQv",mermaidOutput:"mermaidOutput-h_lG0LPQ",sampleIcon:"sampleIcon-k03R-H5M",fullscreenHeader:"fullscreenHeader-vNwgiEM6",toolbarLeft:"toolbarLeft-rk4j-HZs",editorContent:"editorContent-JcQkascd",previewContent:"previewContent-STtgrtW-",editorTabs:"editorTabs-aLzkjWsc",previewTitle:"previewTitle-hC0wgeAG",fullscreenOverlay:"fullscreenOverlay-YsfxxJ3F",active:"active-NKZINbso",toolbarRight:"toolbarRight-kDAHcCSf",previewHeader:"previewHeader-zAfSNtTo",editorContainer:"editorContainer-r1mqEq7F",previewActions:"previewActions-ssoXK-lU",mermaidEditorPage:"mermaidEditorPage-h4k9NT7L",sampleCard:"sampleCard-HN8bm_zj",sampleDiagramsPanel:"sampleDiagramsPanel-fC-p95mX"},es=a("f1001040"),eo=i._(es),ec=a("8fd9fc22"),ed=i._(ec);let{Title:eu,Text:em}=K.default,ef={backgroundImage:"linear-gradient(45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.06) 75%)",backgroundPosition:"0 0, 0 10px, 10px -10px, -10px 0px",backgroundSize:"20px 20px"},eh=(e,t)=>t?{backgroundColor:e,...ef}:{backgroundColor:e},eg="mermaid-editor",ex=()=>{try{let e=localStorage.getItem(eg);if(e)return JSON.parse(e);}catch{}return null;},ep=()=>{let{darkMode:e}=(0,n.useDarkMode)(),t=(0,s.useIsMobile)(),a=(0,et.useRef)(ex()).current,[i,r]=(0,et.useState)((null==a?void 0:a.code)??er),[o,d]=(0,et.useState)((null==a?void 0:a.config)??el),[m,h]=(0,et.useState)("code"),[x,b]=(0,et.useState)(""),[v,C]=(0,et.useState)(""),[w,M]=(0,et.useState)(!1),[A,D]=(0,et.useState)((null==a?void 0:a.previewBg)??(e?"#1f1f1f":"#ffffff")),[L,_]=(0,et.useState)((null==a?void 0:a.showGrid)??!0);(0,et.useEffect)(()=>{try{localStorage.setItem(eg,JSON.stringify({code:i,config:o,previewBg:A,showGrid:L}));}catch{}},[i,o,A,L]);let P=(0,et.useRef)(null),F=(0,et.useRef)(null),O=(0,et.useRef)(null),q=(0,et.useRef)(null),W=(0,et.useRef)(),Y=(0,et.useRef)(0),[X,V]=(0,et.useState)(1),[Q,K]=(0,et.useState)(1),[ee,es]=(0,et.useState)({x:0,y:0}),ec=(0,et.useRef)(!1),ef=(0,et.useRef)({x:0,y:0}),ep=(0,et.useRef)({x:0,y:0}),eb=(0,et.useRef)(),[ey,ev]=(0,et.useState)(1),[ej,eC]=(0,et.useState)(1),[ek,ew]=(0,et.useState)({x:0,y:0}),eS=(0,et.useRef)(!1),eM=(0,et.useRef)({x:0,y:0}),eR=(0,et.useRef)({x:0,y:0}),eA=(0,et.useRef)();(0,et.useEffect)(()=>{V(1),K(1),es({x:0,y:0});},[x]);let eT=(e,t)=>{if(!e)return;let a=e.querySelector("svg");if(!a)return;let i=a.getAttribute("data-base-width"),r=a.getAttribute("data-base-height"),l=i?parseFloat(i):NaN,n=r?parseFloat(r):NaN;if(!isFinite(l)||!isFinite(n)){let e=a.getAttribute("viewBox");if(e){let t=e.split(/[\s,]+/).map(Number);4===t.length&&(l=t[2],n=t[3]);}if(!isFinite(l)||!isFinite(n)){let e=parseFloat(a.getAttribute("width")||""),t=parseFloat(a.getAttribute("height")||"");if(isFinite(e)&&isFinite(t))l=e,n=t;else{var s;let e=null===(s=a.getBBox)||void 0===s?void 0:s.call(a);e&&(l=e.width,n=e.height);}}isFinite(l)&&isFinite(n)&&(a.setAttribute("data-base-width",String(l)),a.setAttribute("data-base-height",String(n)));}isFinite(l)&&isFinite(n)&&(a.setAttribute("width",String(l*t)),a.setAttribute("height",String(n*t)),a.style.maxWidth="none");};(0,et.useEffect)(()=>{eT(O.current,Q);},[Q,x]),(0,et.useEffect)(()=>{eT(q.current,ej);},[ej,x,w]);let eD=(0,et.useCallback)(e=>{eb.current&&clearTimeout(eb.current),eb.current=setTimeout(()=>K(e),180);},[]),eN=(0,et.useCallback)(e=>{eA.current&&clearTimeout(eA.current),eA.current=setTimeout(()=>eC(e),180);},[]);(0,et.useEffect)(()=>()=>{eb.current&&clearTimeout(eb.current),eA.current&&clearTimeout(eA.current);},[]);let eL=()=>{eA.current&&clearTimeout(eA.current),ev(1),eC(1),ew({x:0,y:0});},eE=(0,et.useCallback)(e=>{e.preventDefault();let t=e.currentTarget.getBoundingClientRect(),a=e.clientX-t.left,i=e.clientY-t.top,r=t.width/2,l=t.height/2;V(t=>{let n=Math.min(5,Math.max(.1,t*Math.exp(-(.0015*e.deltaY)))),s=n/t;return es(e=>({x:a-r-(a-r-e.x)*s,y:i-l-(i-l-e.y)*s})),eD(n),n;});},[eD]),e_=(0,et.useCallback)(e=>{0===e.button&&(ec.current=!0,ef.current={x:e.clientX,y:e.clientY},ep.current={...ee},e.currentTarget.style.cursor="grabbing");},[ee]),eB=(0,et.useCallback)(e=>{if(!ec.current)return;let t=e.clientX-ef.current.x,a=e.clientY-ef.current.y;es({x:ep.current.x+t,y:ep.current.y+a});},[]),eP=(0,et.useCallback)(e=>{ec.current=!1,e.currentTarget.style.cursor="grab";},[]),ez=(0,et.useCallback)(e=>{e.preventDefault();let t=e.currentTarget.getBoundingClientRect(),a=e.clientX-t.left,i=e.clientY-t.top,r=t.width/2,l=t.height/2;ev(t=>{let n=Math.min(5,Math.max(.1,t*Math.exp(-(.0015*e.deltaY)))),s=n/t;return ew(e=>({x:a-r-(a-r-e.x)*s,y:i-l-(i-l-e.y)*s})),eN(n),n;});},[eN]),eF=(0,et.useCallback)(e=>{0===e.button&&(eS.current=!0,eM.current={x:e.clientX,y:e.clientY},eR.current={...ek},e.currentTarget.style.cursor="grabbing");},[ek]),eI=(0,et.useCallback)(e=>{if(!eS.current)return;let t=e.clientX-eM.current.x,a=e.clientY-eM.current.y;ew({x:eR.current.x+t,y:eR.current.y+a});},[]),eO=(0,et.useCallback)(e=>{eS.current=!1,e.currentTarget.style.cursor="grab";},[]);(0,et.useEffect)(()=>{ed.default.initialize({startOnLoad:!1,theme:e?"dark":"default",securityLevel:"loose",fontFamily:'"trebuchet ms", verdana, arial, sans-serif',flowchart:{useMaxWidth:!1,htmlLabels:!0,padding:15},sequence:{useMaxWidth:!1},gantt:{useMaxWidth:!1},class:{useMaxWidth:!1},state:{useMaxWidth:!1},er:{useMaxWidth:!1},pie:{useMaxWidth:!1},journey:{useMaxWidth:!1}});},[e]);let eG=(0,et.useCallback)(async(t,a)=>{W.current&&clearTimeout(W.current),W.current=setTimeout(async()=>{let i=++Y.current;try{let r={};try{r=JSON.parse(a);}catch{}ed.default.initialize({startOnLoad:!1,theme:e?"dark":"default",securityLevel:"loose",fontFamily:'"trebuchet ms", verdana, arial, sans-serif',flowchart:{useMaxWidth:!1,htmlLabels:!0,padding:15},sequence:{useMaxWidth:!1},gantt:{useMaxWidth:!1},class:{useMaxWidth:!1},state:{useMaxWidth:!1},er:{useMaxWidth:!1},pie:{useMaxWidth:!1},journey:{useMaxWidth:!1},...r}),await ed.default.parse(t);let l=`mermaid-preview-${i}-${Date.now()}`,{svg:n}=await ed.default.render(l,t);if(i===Y.current){let e=n.replace(/max-width:\s*[\d.]+px;?/gi,"").replace(/style="/i,'style="max-width:none!important;');b(e),C("");}}catch(e){i===Y.current&&C((null==e?void 0:e.message)||"Failed to render diagram");}},300);},[e]);(0,et.useEffect)(()=>(eG(i,o),()=>{W.current&&clearTimeout(W.current);}),[i,o,eG]);let eq=async()=>{if(!x){J.default.warning("No diagram to copy");return;}try{await navigator.clipboard.writeText(x),J.default.success("SVG copied to clipboard");}catch{J.default.error("Failed to copy");}},eU=async()=>{try{await navigator.clipboard.writeText(i),J.default.success("Code copied to clipboard");}catch{J.default.error("Failed to copy");}},eW=e=>{let t=ei[e];t&&(r(t.code),h("code"));},eH="code"===m?i:o,eY=(0,eo.default)(en.mermaidEditorPage,{[en.mermaidEditorPageDark]:e});return(0,l.jsxs)("div",{className:eY,children:[(0,l.jsxs)("div",{className:en.toolbar,children:[(0,l.jsxs)("div",{className:en.toolbarLeft,children:[(0,l.jsx)(eu,{level:5,style:{margin:0},children:"Mermaid Live Editor"}),v?(0,l.jsx)(em,{type:"danger",style:{fontSize:12},children:"\u25CF Syntax Error"}):x?(0,l.jsx)(em,{type:"success",style:{fontSize:12},children:"\u25CF Valid"}):null]}),(0,l.jsxs)("div",{className:en.toolbarRight,children:[(0,l.jsx)(Z.default,{title:"Copy Code",children:(0,l.jsx)(G.default,{icon:(0,l.jsx)(g.default,{}),size:"small",onClick:eU})}),(0,l.jsx)(Z.default,{title:"Copy SVG",children:(0,l.jsx)(G.default,{icon:(0,l.jsx)(f.default,{}),size:"small",onClick:eq})}),(0,l.jsx)(Z.default,{title:"Download SVG",children:(0,l.jsx)(G.default,{icon:(0,l.jsx)(p.default,{}),size:"small",onClick:()=>{if(!x){J.default.warning("No diagram to download");return;}let e=new Blob([x],{type:"image/svg+xml"}),t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download="mermaid-diagram.svg",a.click(),URL.revokeObjectURL(t),J.default.success("SVG downloaded");}})}),(0,l.jsx)(Z.default,{title:"Download PNG",children:(0,l.jsx)(G.default,{icon:(0,l.jsx)(R.default,{}),size:"small",onClick:()=>{if(!x){J.default.warning("No diagram to download");return;}let t=document.createElement("div");t.innerHTML=x;let a=t.querySelector("svg");if(!a)return;let i=document.createElement("canvas"),r=i.getContext("2d");if(!r)return;let l=new Blob([new XMLSerializer().serializeToString(a)],{type:"image/svg+xml;charset=utf-8"}),n=URL.createObjectURL(l),s=new Image;s.onload=()=>{i.width=2*s.width,i.height=2*s.height,r.scale(2,2),r.fillStyle=e?"#1f1f1f":"#ffffff",r.fillRect(0,0,s.width,s.height),r.drawImage(s,0,0),i.toBlob(e=>{if(!e)return;let t=URL.createObjectURL(e),a=document.createElement("a");a.href=t,a.download="mermaid-diagram.png",a.click(),URL.revokeObjectURL(t),J.default.success("PNG downloaded");}),URL.revokeObjectURL(n);},s.src=n;}})}),(0,l.jsx)(Z.default,{title:"Save to Google Drive",children:(0,l.jsx)(ea.SaveToDriveButton,{getContent:()=>i,fileName:"mermaid-diagram.mmd",mimeType:"text/plain",buttonProps:{size:"small",icon:(0,l.jsx)(B.default,{})},children:null})}),(0,l.jsx)(Z.default,{title:"Load from Google Drive",children:(0,l.jsx)(ea.LoadFromDriveButton,{onLoad:e=>r(e),accept:["text/plain"],buttonProps:{size:"small",icon:(0,l.jsx)(z.default,{})},children:null})}),(0,l.jsx)(Z.default,{title:"Fullscreen",children:(0,l.jsx)(G.default,{icon:(0,l.jsx)(y.default,{}),size:"small",onClick:()=>M(!0)})})]})]}),(0,l.jsxs)($.default,{className:en.editorContainer,layout:t?"vertical":"horizontal",children:[(0,l.jsx)($.default.Panel,{defaultSize:"30%",min:"20%",children:(0,l.jsxs)("div",{className:en.editorPane,children:[(0,l.jsxs)("div",{className:en.editorTabs,children:[(0,l.jsxs)("div",{className:(0,eo.default)(en.editorTab,{[en.active]:"code"===m}),onClick:()=>h("code"),children:[(0,l.jsx)(f.default,{})," Code"]}),(0,l.jsxs)("div",{className:(0,eo.default)(en.editorTab,{[en.active]:"config"===m}),onClick:()=>h("config"),children:[(0,l.jsx)(k.default,{})," Config"]})]}),(0,l.jsx)("div",{className:en.editorContent,children:(0,l.jsx)(I.default,{height:"100%",language:"code"===m?"markdown":"json",value:eH,theme:e?"vs-dark":"vs",onChange:e=>{"code"===m?r(e||""):d(e||"");},options:{minimap:{enabled:!1},fontSize:14,lineNumbers:"on",wordWrap:"on",scrollBeyondLastLine:!1,automaticLayout:!0,padding:{top:12},tabSize:2}})}),(0,l.jsx)(U.default,{ghost:!0,size:"small",items:[{key:"samples",label:(0,l.jsxs)("span",{children:[(0,l.jsx)(T.default,{})," Sample Diagrams"]}),children:(0,l.jsx)("div",{className:en.sampleDiagramsPanel,children:(0,l.jsx)("div",{className:en.sampleGrid,children:Object.entries(ei).map(([e,t])=>(0,l.jsxs)("div",{className:en.sampleCard,onClick:()=>eW(e),children:[(0,l.jsx)("div",{className:en.sampleIcon,children:t.icon}),(0,l.jsx)("div",{children:t.label})]},e))})})}]})]})}),(0,l.jsx)($.default.Panel,{min:"20%",children:(0,l.jsxs)("div",{className:en.previewPane,children:[(0,l.jsxs)("div",{className:en.previewHeader,children:[(0,l.jsxs)("span",{className:en.previewTitle,children:[(0,l.jsx)(j.default,{})," Preview",(0,l.jsxs)(em,{type:"secondary",style:{fontSize:11,marginLeft:8},children:[Math.round(100*X),"%"]})]}),(0,l.jsxs)("div",{className:en.previewActions,children:[(0,l.jsx)(Z.default,{title:"Toggle Grid",children:(0,l.jsx)(G.default,{type:L?"primary":"text",size:"small",icon:(0,l.jsx)(u.default,{}),onClick:()=>_(e=>!e)})}),(0,l.jsx)(H.default,{size:"small",value:A,onChange:(e,t)=>D(t),presets:[{label:"Presets",colors:["#ffffff","#f5f5f5","#e8e8e8","#1f1f1f","#141414","#000000","#f0f5ff","#f6ffed","#fff7e6","#fff1f0"]}]}),(0,l.jsx)(Z.default,{title:"Zoom In",children:(0,l.jsx)(G.default,{type:"text",size:"small",icon:(0,l.jsx)(N.default,{}),onClick:()=>V(e=>{let t=Math.min(5,e+.1);return eD(t),t;})})}),(0,l.jsx)(Z.default,{title:"Zoom Out",children:(0,l.jsx)(G.default,{type:"text",size:"small",icon:(0,l.jsx)(E.default,{}),onClick:()=>V(e=>{let t=Math.max(.1,e-.1);return eD(t),t;})})}),(0,l.jsx)(Z.default,{title:"Reset View",children:(0,l.jsx)(G.default,{type:"text",size:"small",icon:(0,l.jsx)(c.default,{}),onClick:()=>{eb.current&&clearTimeout(eb.current),V(1),K(1),es({x:0,y:0});}})}),(0,l.jsx)(Z.default,{title:"Fullscreen",children:(0,l.jsx)(G.default,{type:"text",size:"small",icon:(0,l.jsx)(y.default,{}),onClick:()=>M(!0)})})]})]}),(0,l.jsx)("div",{className:en.previewContent,ref:P,onWheel:eE,onMouseDown:e_,onMouseMove:eB,onMouseUp:eP,onMouseLeave:eP,style:{cursor:"grab",...eh(A,L)},children:v?(0,l.jsx)("div",{className:en.errorMessage,children:v}):x?(0,l.jsx)("div",{ref:O,className:en.mermaidOutput,style:{transform:`translate(${ee.x}px, ${ee.y}px) scale(${X/Q})`,transformOrigin:"center center",willChange:"transform"},dangerouslySetInnerHTML:{__html:x}}):(0,l.jsx)(em,{type:"secondary",children:"Enter Mermaid code to see preview..."})})]})})]}),w&&(0,l.jsxs)("div",{className:en.fullscreenOverlay,children:[(0,l.jsxs)("div",{className:en.fullscreenHeader,children:[(0,l.jsx)(eu,{level:5,style:{margin:0},children:"Mermaid Diagram Preview"}),(0,l.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:8},children:[(0,l.jsxs)(em,{type:"secondary",style:{fontSize:12},children:[Math.round(100*ey),"%"]}),(0,l.jsx)(Z.default,{title:"Zoom In",children:(0,l.jsx)(G.default,{size:"small",icon:(0,l.jsx)(N.default,{}),onClick:()=>ev(e=>{let t=Math.min(5,e+.1);return eN(t),t;})})}),(0,l.jsx)(Z.default,{title:"Zoom Out",children:(0,l.jsx)(G.default,{size:"small",icon:(0,l.jsx)(E.default,{}),onClick:()=>ev(e=>{let t=Math.max(.1,e-.1);return eN(t),t;})})}),(0,l.jsx)(Z.default,{title:"Reset View",children:(0,l.jsx)(G.default,{size:"small",icon:(0,l.jsx)(c.default,{}),onClick:eL})}),(0,l.jsx)(G.default,{icon:(0,l.jsx)(S.default,{}),onClick:()=>{M(!1),eL();},children:"Exit Fullscreen"})]})]}),(0,l.jsx)("div",{className:en.fullscreenContent,ref:F,onWheel:ez,onMouseDown:eF,onMouseMove:eI,onMouseUp:eO,onMouseLeave:eO,style:{cursor:"grab",...eh(A,L)},children:v?(0,l.jsx)("div",{className:en.errorMessage,children:v}):x?(0,l.jsx)("div",{ref:q,className:en.mermaidOutput,style:{transform:`translate(${ek.x}px, ${ek.y}px) scale(${ey/ej})`,transformOrigin:"center center",willChange:"transform"},dangerouslySetInnerHTML:{__html:x}}):(0,l.jsx)(em,{type:"secondary",children:"No diagram to display"})})]})]});};}}]);
//# sourceMappingURL=6591a143-async.b4a7c191.js.map