(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["6fd603ba"],{"6fd603ba":function(e,t,l){"use strict";l.d(t,"__esModule",{value:!0}),l.d(t,"diagram",{enumerable:!0,get:function(){return B;}});var o=l("777fffbe"),a=l("5f284468"),r=l("6e19b862"),i=l("fb738436"),n=l("5bc44871"),s=o._(l("f8fd2ebd"));l("a2c94fe0"),l("8eaf5076"),l("967c9690"),l("21589439"),l("2ce92803"),l("41cf68e9"),l("8cc988a4"),l("a57dfb6b"),l("6d7df77e"),l("71eef041"),l("81540306");let d=(e,t,l)=>{let{parentById:o}=l,a=new Set,r=e;for(;r;){if(a.add(r),r===t)return r;r=o[r];}for(r=t;r;){if(a.has(r))return r;r=o[r];}return"root";},c=new s.default,h={},p={},u={},b=async function(e,t,l,o,a,r,s){let d=l.select(`[id="${t}"]`).insert("g").attr("class","nodes"),c=Object.keys(e);return await Promise.all(c.map(async function(t){let l,s;let c=e[t],h="default";c.classes.length>0&&(h=c.classes.join(" ")),h+=" flowchart-label";let p=(0,n.k)(c.styles),b=void 0!==c.text?c.text:c.id,f={width:0,height:0},y=[{id:c.id+"-west",layoutOptions:{"port.side":"WEST"}},{id:c.id+"-east",layoutOptions:{"port.side":"EAST"}},{id:c.id+"-south",layoutOptions:{"port.side":"SOUTH"}},{id:c.id+"-north",layoutOptions:{"port.side":"NORTH"}}],g=0,w="",k={};switch(c.type){case"round":g=5,w="rect";break;case"square":case"group":default:w="rect";break;case"diamond":w="question",k={portConstraints:"FIXED_SIDE"};break;case"hexagon":w="hexagon";break;case"odd":case"odd_right":w="rect_left_inv_arrow";break;case"lean_right":w="lean_right";break;case"lean_left":w="lean_left";break;case"trapezoid":w="trapezoid";break;case"inv_trapezoid":w="inv_trapezoid";break;case"circle":w="circle";break;case"ellipse":w="ellipse";break;case"stadium":w="stadium";break;case"subroutine":w="subroutine";break;case"cylinder":w="cylinder";break;case"doublecircle":w="doublecircle";}let x={labelStyle:p.labelStyle,shape:w,labelText:b,labelType:c.labelType,rx:g,ry:g,class:h,style:p.style,id:c.id,link:c.link,linkTarget:c.linkTarget,tooltip:a.db.getTooltip(c.id)||"",domId:a.db.lookUpDomId(c.id),haveCallback:c.haveCallback,width:"group"===c.type?500:void 0,dir:c.dir,type:c.type,props:c.props,padding:(0,n.F)().flowchart.padding};if("group"!==x.type)l=(s=await (0,i.e)(d,x,c.dir)).node().getBBox();else{o.createElementNS("http://www.w3.org/2000/svg","text");let{shapeSvg:e,bbox:t}=await (0,i.l)(d,x,void 0,!0);f.width=t.width,f.wrappingWidth=(0,n.F)().flowchart.wrappingWidth,f.height=t.height,f.labelNode=e.node(),x.labelData=f;}let m={id:c.id,ports:"diamond"===c.type?y:[],layoutOptions:k,labelText:b,labelData:f,domId:a.db.lookUpDomId(c.id),width:null==l?void 0:l.width,height:null==l?void 0:l.height,type:c.type,el:s,parent:r.parentById[c.id]};u[x.id]=m;})),s;},f=(e,t,l)=>{let o={TB:{in:{north:"north"},out:{south:"west",west:"east",east:"south"}},LR:{in:{west:"west"},out:{east:"south",south:"north",north:"east"}},RL:{in:{east:"east"},out:{west:"north",north:"south",south:"west"}},BT:{in:{south:"south"},out:{north:"east",east:"west",west:"north"}}};return o.TD=o.TB,o[l][t][e];},y=(e,t,l)=>{if(n.l.info("getNextPort",{node:e,edgeDirection:t,graphDirection:l}),!h[e])switch(l){case"TB":case"TD":h[e]={inPosition:"north",outPosition:"south"};break;case"BT":h[e]={inPosition:"south",outPosition:"north"};break;case"RL":h[e]={inPosition:"east",outPosition:"west"};break;case"LR":h[e]={inPosition:"west",outPosition:"east"};}let o="in"===t?h[e].inPosition:h[e].outPosition;return"in"===t?h[e].inPosition=f(h[e].inPosition,t,l):h[e].outPosition=f(h[e].outPosition,t,l),o;},g=(e,t)=>{let l=e.start,o=e.end,a=l,r=o,i=u[l],n=u[o];return i&&n?("diamond"===i.type&&(l=`${l}-${y(l,"out",t)}`),"diamond"===n.type&&(o=`${o}-${y(o,"in",t)}`),{source:l,target:o,sourceId:a,targetId:r}):{source:l,target:o};},w=function(e,t,l,o){let a,s;n.l.info("abc78 edges = ",e);let d=o.insert("g").attr("class","edgeLabels"),c={},h=t.db.getDirection();if(void 0!==e.defaultStyle){let t=(0,n.k)(e.defaultStyle);a=t.style,s=t.labelStyle;}return e.forEach(function(t){let o="L-"+t.start+"-"+t.end;void 0===c[o]?c[o]=0:c[o]++,n.l.info("abc78 new entry",o,c[o]);let u=o+"-"+c[o];n.l.info("abc78 new link id to be used is",o,u,c[o]);let b="LS-"+t.start,f="LE-"+t.end,y={style:"",labelStyle:""};switch(y.minlen=t.length||1,"arrow_open"===t.type?y.arrowhead="none":y.arrowhead="normal",y.arrowTypeStart="arrow_open",y.arrowTypeEnd="arrow_open",t.type){case"double_arrow_cross":y.arrowTypeStart="arrow_cross";case"arrow_cross":y.arrowTypeEnd="arrow_cross";break;case"double_arrow_point":y.arrowTypeStart="arrow_point";case"arrow_point":y.arrowTypeEnd="arrow_point";break;case"double_arrow_circle":y.arrowTypeStart="arrow_circle";case"arrow_circle":y.arrowTypeEnd="arrow_circle";}let w="",k="";switch(t.stroke){case"normal":w="fill:none;",void 0!==a&&(w=a),void 0!==s&&(k=s),y.thickness="normal",y.pattern="solid";break;case"dotted":y.thickness="normal",y.pattern="dotted",y.style="fill:none;stroke-width:2px;stroke-dasharray:3;";break;case"thick":y.thickness="thick",y.pattern="solid",y.style="stroke-width: 3.5px;fill:none;";}if(void 0!==t.style){let e=(0,n.k)(t.style);w=e.style,k=e.labelStyle;}y.style=y.style+=w,y.labelStyle=y.labelStyle+=k,void 0!==t.interpolate?y.curve=(0,n.n)(t.interpolate,r.curveLinear):void 0!==e.defaultInterpolate?y.curve=(0,n.n)(e.defaultInterpolate,r.curveLinear):y.curve=(0,n.n)(p.curve,r.curveLinear),void 0===t.text?void 0!==t.style&&(y.arrowheadStyle="fill: #333"):(y.arrowheadStyle="fill: #333",y.labelpos="c"),y.labelType=t.labelType,y.label=t.text.replace(n.e.lineBreakRegex,"\n"),void 0===t.style&&(y.style=y.style||"stroke: #333; stroke-width: 1.5px;fill:none;"),y.labelStyle=y.labelStyle.replace("color:","fill:"),y.id=u,y.classes="flowchart-link "+b+" "+f;let x=(0,i.f)(d,y),{source:m,target:v,sourceId:T,targetId:$}=g(t,h);n.l.debug("abc78 source and target",m,v),l.edges.push({id:"e"+t.start+t.end,sources:[m],targets:[v],sourceId:T,targetId:$,labelEl:x,labels:[{width:y.width,height:y.height,orgWidth:y.width,orgHeight:y.height,text:y.label,layoutOptions:{"edgeLabels.inline":"true","edgeLabels.placement":"CENTER"}}],edgeData:y});}),l;},k=function(e,t,l,o,a){let r="";o&&(r=(r=(r=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.search).replace(/\(/g,"\\(")).replace(/\)/g,"\\)")),(0,i.m)(e,t,r,a,l);},x=function(e){let t={parentById:{},childrenById:{}},l=e.getSubGraphs();return n.l.info("Subgraphs - ",l),l.forEach(function(e){e.nodes.forEach(function(l){t.parentById[l]=e.id,void 0===t.childrenById[e.id]&&(t.childrenById[e.id]=[]),t.childrenById[e.id].push(l);});}),l.forEach(function(e){e.id,void 0!==t.parentById[e.id]&&t.parentById[e.id];}),t;},m=function(e,t,l){let o=d(e,t,l);if(void 0===o||"root"===o)return{x:0,y:0};let a=u[o].offset;return{x:a.posX,y:a.posY};},v=function(e,t,l,o,a,n){let s=m(t.sourceId,t.targetId,a),d=t.sections[0].startPoint,c=t.sections[0].endPoint,h=(t.sections[0].bendPoints?t.sections[0].bendPoints:[]).map(e=>[e.x+s.x,e.y+s.y]),p=[[d.x+s.x,d.y+s.y],...h,[c.x+s.x,c.y+s.y]],{x:u,y:b}=(0,i.k)(t.edgeData),f=(0,r.line)().x(u).y(b).curve(r.curveLinear),y=e.insert("path").attr("d",f(p)).attr("class","path "+l.classes).attr("fill","none"),g=e.insert("g").attr("class","edgeLabel"),w=(0,r.select)(g.node().appendChild(t.labelEl)),x=w.node().firstChild.getBoundingClientRect();w.attr("width",x.width),w.attr("height",x.height),g.attr("transform",`translate(${t.labels[0].x+s.x}, ${t.labels[0].y+s.y})`),k(y,l,o.type,o.arrowMarkerAbsolute,n);},T=(e,t)=>{e.forEach(e=>{e.children||(e.children=[]);let l=t.childrenById[e.id];l&&l.forEach(t=>{e.children.push(u[t]);}),T(e.children,t);});},$=async function(e,t,l,o){var a;let s,d;o.db.clear(),u={},h={},o.db.setGen("gen-2"),o.parser.parse(e);let p=(0,r.select)("body").append("div").attr("style","height:400px").attr("id","cy"),f={id:"root",layoutOptions:{"elk.hierarchyHandling":"INCLUDE_CHILDREN","org.eclipse.elk.padding":"[top=100, left=100, bottom=110, right=110]","elk.layered.spacing.edgeNodeBetweenLayers":"30","elk.direction":"DOWN"},children:[],edges:[]};switch(n.l.info("Drawing flowchart using v3 renderer",c),o.db.getDirection()){case"BT":f.layoutOptions["elk.direction"]="UP";break;case"TB":f.layoutOptions["elk.direction"]="DOWN";break;case"LR":f.layoutOptions["elk.direction"]="RIGHT";break;case"RL":f.layoutOptions["elk.direction"]="LEFT";}let{securityLevel:y,flowchart:g}=(0,n.F)();"sandbox"===y&&(s=(0,r.select)("#i"+t));let k="sandbox"===y?(0,r.select)(s.nodes()[0].contentDocument.body):(0,r.select)("body"),m="sandbox"===y?s.nodes()[0].contentDocument:document,$=k.select(`[id="${t}"]`);(0,i.a)($,["point","circle","cross"],o.type,t);let C=o.db.getVertices(),B=o.db.getSubGraphs();n.l.info("Subgraphs - ",B);for(let e=B.length-1;e>=0;e--)d=B[e],o.db.addVertex(d.id,{text:d.title,type:d.labelType},"group",void 0,d.classes,d.dir);let E=$.insert("g").attr("class","subgraphs"),S=x(o.db);f=await b(C,t,k,m,o,S,f);let I=$.insert("g").attr("class","edges edgePath");f=w(o.db.getEdges(),o,f,$),Object.keys(u).forEach(e=>{let t=u[e];t.parent||f.children.push(t),void 0!==S.childrenById[e]&&(t.labels=[{text:t.labelText,layoutOptions:{"nodeLabels.placement":"[H_CENTER, V_TOP, INSIDE]"},width:t.labelData.width,height:t.labelData.height}],delete t.x,delete t.y,delete t.width,delete t.height);}),T(f.children,S),n.l.info("after layout",JSON.stringify(f,null,2));let L=await c.layout(f);_(0,0,L.children,$,E,o,0),n.l.info("after layout",L),null==(a=L.edges)||a.map(e=>{v(I,e,e.edgeData,o,S,t);}),(0,n.o)({},$,g.diagramPadding,g.useMaxWidth),p.remove();},_=(e,t,l,o,a,r,i)=>{l.forEach(function(l){if(l){if(u[l.id].offset={posX:l.x+e,posY:l.y+t,x:e,y:t,depth:i,width:l.width,height:l.height},"group"===l.type){let o=a.insert("g").attr("class","subgraph");o.insert("rect").attr("class","subgraph subgraph-lvl-"+i%5+" node").attr("x",l.x+e).attr("y",l.y+t).attr("width",l.width).attr("height",l.height);let r=o.insert("g").attr("class","label"),s=(0,n.F)().flowchart.htmlLabels?l.labelData.width/2:0;r.attr("transform",`translate(${l.labels[0].x+e+l.x+s}, ${l.labels[0].y+t+l.y+3})`),r.node().appendChild(l.labelData.labelNode),n.l.info("Id (UGH)= ",l.type,l.labels);}else n.l.info("Id (UGH)= ",l.id),l.el.attr("transform",`translate(${l.x+e+l.width/2}, ${l.y+t+l.height/2})`);}}),l.forEach(function(l){l&&"group"===l.type&&_(e+l.x,t+l.y,l.children,o,a,r,i+1);});},C=e=>{let t="";for(let l=0;l<5;l++)t+=`
      .subgraph-lvl-${l} {
        fill: ${e[`surface${l}`]};
        stroke: ${e[`surfacePeer${l}`]};
      }
    `;return t;},B={db:a.d,renderer:{getClasses:function(e,t){return n.l.info("Extracting classes"),t.db.getClasses();},draw:$},parser:a.p,styles:e=>`.label {
    font-family: ${e.fontFamily};
    color: ${e.nodeTextColor||e.textColor};
  }
  .cluster-label text {
    fill: ${e.titleColor};
  }
  .cluster-label span {
    color: ${e.titleColor};
  }

  .label text,span {
    fill: ${e.nodeTextColor||e.textColor};
    color: ${e.nodeTextColor||e.textColor};
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${e.mainBkg};
    stroke: ${e.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${e.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${e.lineColor};
    stroke-width: 2.0px;
  }

  .flowchart-link {
    stroke: ${e.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${e.edgeLabelBackground};
    rect {
      opacity: 0.85;
      background-color: ${e.edgeLabelBackground};
      fill: ${e.edgeLabelBackground};
    }
    text-align: center;
  }

  .cluster rect {
    fill: ${e.clusterBkg};
    stroke: ${e.clusterBorder};
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${e.titleColor};
  }

  .cluster span {
    color: ${e.titleColor};
  }
  /* .cluster div {
    color: ${e.titleColor};
  } */

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${e.fontFamily};
    font-size: 12px;
    background: ${e.tertiaryColor};
    border: 1px solid ${e.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .flowchartTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.textColor};
  }
  .subgraph {
    stroke-width:2;
    rx:3;
  }
  // .subgraph-lvl-1 {
  //   fill:#ccc;
  //   // stroke:black;
  // }

  .flowchart-label text {
    text-anchor: middle;
  }

  ${C(e)}
`};}}]);
//# sourceMappingURL=6fd603ba-async.53fb88c0.js.map