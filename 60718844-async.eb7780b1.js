(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["60718844"],{60718844:function(e,t,a){"use strict";a.d(t,"__esModule",{value:!0}),a.d(t,"diagram",{enumerable:!0,get:function(){return C;}});var i=a("97bc6d5f"),l=a("984b2fcc"),r=a("6ed2aaa7"),n=a("7f0e46ef"),o=a("a72e0573"),s=a("c25c4247"),c=a("06c87c47"),d=n.defaultConfig_default.pie,p={sections:new Map,showData:!1,config:d},g=p.sections,u=p.showData,f=structuredClone(d),m=(0,o.__name)(()=>structuredClone(f),"getConfig"),h=(0,o.__name)(()=>{g=new Map,u=p.showData,(0,n.clear)();},"clear"),x=(0,o.__name)(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);g.has(e)||(g.set(e,t),o.log.debug(`added new section: ${e}, with value: ${t}`));},"addSection"),_=(0,o.__name)(()=>g,"getSections"),w=(0,o.__name)(e=>{u=e;},"setShowData"),S=(0,o.__name)(()=>u,"getShowData"),T={getConfig:m,clear:h,setDiagramTitle:n.setDiagramTitle,getDiagramTitle:n.getDiagramTitle,setAccTitle:n.setAccTitle,getAccTitle:n.getAccTitle,setAccDescription:n.setAccDescription,getAccDescription:n.getAccDescription,addSection:x,getSections:_,setShowData:w,getShowData:S},v=(0,o.__name)((e,t)=>{(0,l.populateCommonDb)(e,t),t.setShowData(e.showData),e.sections.map(t.addSection);},"populateDb"),y={parse:(0,o.__name)(async e=>{let t=await (0,s.parse)("pie",e);o.log.debug(t),v(t,T);},"parse")},$=(0,o.__name)(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),b=(0,o.__name)(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),a=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return(0,c.pie)().value(e=>e.value).sort(null)(a);},"createPieArcs"),C={parser:y,db:T,renderer:{draw:(0,o.__name)((e,t,a,l)=>{var s;o.log.debug("rendering pie chart\n"+e);let d=l.db,p=(0,n.getConfig2)(),g=(0,r.cleanAndMerge)(d.getConfig(),p.pie),u=(0,i.selectSvgElement)(t),f=u.append("g");f.attr("transform","translate(225,225)");let{themeVariables:m}=p,[h]=(0,r.parseFontSize)(m.pieOuterStrokeWidth);h??(h=2);let x=g.textPosition,_=(0,c.arc)().innerRadius(0).outerRadius(185),w=(0,c.arc)().innerRadius(185*x).outerRadius(185*x);f.append("circle").attr("cx",0).attr("cy",0).attr("r",185+h/2).attr("class","pieOuterCircle");let S=d.getSections(),T=b(S),v=[m.pie1,m.pie2,m.pie3,m.pie4,m.pie5,m.pie6,m.pie7,m.pie8,m.pie9,m.pie10,m.pie11,m.pie12],y=0;S.forEach(e=>{y+=e;});let $=T.filter(e=>"0"!==(e.data.value/y*100).toFixed(0)),C=(0,c.scaleOrdinal)(v).domain([...S.keys()]);f.selectAll("mySlices").data($).enter().append("path").attr("d",_).attr("fill",e=>C(e.data.label)).attr("class","pieCircle"),f.selectAll("mySlices").data($).enter().append("text").text(e=>(e.data.value/y*100).toFixed(0)+"%").attr("transform",e=>"translate("+w.centroid(e)+")").style("text-anchor","middle").attr("class","slice");let D=f.append("text").text(d.getDiagramTitle()).attr("x",0).attr("y",-200).attr("class","pieTitleText"),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=f.selectAll(".legend").data(k).enter().append("g").attr("class","legend").attr("transform",(e,t)=>"translate(216,"+(22*t-22*k.length/2)+")");A.append("rect").attr("width",18).attr("height",18).style("fill",e=>C(e.label)).style("stroke",e=>C(e.label)),A.append("text").attr("x",22).attr("y",14).text(e=>d.getShowData()?`${e.label} [${e.value}]`:e.label);let z=Math.max(...A.selectAll("text").nodes().map(e=>(null==e?void 0:e.getBoundingClientRect().width)??0)),M=(null===(s=D.node())||void 0===s?void 0:s.getBoundingClientRect().width)??0,O=Math.min(0,225-M/2),F=Math.max(512+z,225+M/2)-O;u.attr("viewBox",`${O} 0 ${F} 450`),(0,n.configureSvgSize)(u,450,F,g.useMaxWidth);},"draw")},styles:$};}}]);
//# sourceMappingURL=60718844-async.eb7780b1.js.map