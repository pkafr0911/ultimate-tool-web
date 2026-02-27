(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["90e85d4b"],{"90e85d4b":function(t,e,i){"use strict";i.d(e,"__esModule",{value:!0}),i.d(e,"diagram",{enumerable:!0,get:function(){return S;}});var n=i("5bc44871"),s=i("6e19b862"),r=i("685aea6d");i("967c9690"),i("21589439"),i("2ce92803"),i("41cf68e9"),i("8cc988a4"),i("a57dfb6b"),i("6d7df77e"),i("71eef041"),i("81540306");var a=function(){var t=function(t,e,i,n){for(i=i||{},n=t.length;n--;i[t[n]]=e);return i;},e=[6,8,10,11,12,14,16,17,18],i=[1,9],n=[1,10],s=[1,11],r=[1,12],a=[1,13],l=[1,14],o={trace:function(){},yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:function(t,e,i,n,s,r,a){var l=r.length-1;switch(s){case 1:return r[l-1];case 2:case 6:case 7:this.$=[];break;case 3:r[l-1].push(r[l]),this.$=r[l-1];break;case 4:case 5:this.$=r[l];break;case 8:n.setDiagramTitle(r[l].substr(6)),this.$=r[l].substr(6);break;case 9:this.$=r[l].trim(),n.setAccTitle(this.$);break;case 10:case 11:this.$=r[l].trim(),n.setAccDescription(this.$);break;case 12:n.addSection(r[l].substr(8)),this.$=r[l].substr(8);break;case 13:n.addTask(r[l-1],r[l]),this.$="task";}},table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:i,12:n,14:s,16:r,17:a,18:l},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:15,11:i,12:n,14:s,16:r,17:a,18:l},t(e,[2,5]),t(e,[2,6]),t(e,[2,8]),{13:[1,16]},{15:[1,17]},t(e,[2,11]),t(e,[2,12]),{19:[1,18]},t(e,[2,4]),t(e,[2,9]),t(e,[2,10]),t(e,[2,13])],defaultActions:{},parseError:function(t,e){if(e.recoverable)this.trace(t);else{var i=Error(t);throw i.hash=e,i;}},parse:function(t){var e=this,i=[0],n=[],s=[null],r=[],a=this.table,l="",o=0,c=0,h=r.slice.call(arguments,1),u=Object.create(this.lexer),y={yy:{}};for(var p in this.yy)Object.prototype.hasOwnProperty.call(this.yy,p)&&(y.yy[p]=this.yy[p]);u.setInput(t,y.yy),y.yy.lexer=u,y.yy.parser=this,void 0===u.yylloc&&(u.yylloc={});var d=u.yylloc;r.push(d);var f=u.options&&u.options.ranges;"function"==typeof y.yy.parseError?this.parseError=y.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;for(var g,m,x,k,_,b,v,$,w={};;){if(m=i[i.length-1],this.defaultActions[m]?x=this.defaultActions[m]:(null==g&&(g=function(){var t;return"number"!=typeof(t=n.pop()||u.lex()||1)&&(t instanceof Array&&(t=(n=t).pop()),t=e.symbols_[t]||t),t;}()),x=a[m]&&a[m][g]),void 0===x||!x.length||!x[0]){var M="";for(_ in $=[],a[m])this.terminals_[_]&&_>2&&$.push("'"+this.terminals_[_]+"'");M=u.showPosition?"Parse error on line "+(o+1)+":\n"+u.showPosition()+"\nExpecting "+$.join(", ")+", got '"+(this.terminals_[g]||g)+"'":"Parse error on line "+(o+1)+": Unexpected "+(1==g?"end of input":"'"+(this.terminals_[g]||g)+"'"),this.parseError(M,{text:u.match,token:this.terminals_[g]||g,line:u.yylineno,loc:d,expected:$});}if(x[0]instanceof Array&&x.length>1)throw Error("Parse Error: multiple actions possible at state: "+m+", token: "+g);switch(x[0]){case 1:i.push(g),s.push(u.yytext),r.push(u.yylloc),i.push(x[1]),g=null,c=u.yyleng,l=u.yytext,o=u.yylineno,d=u.yylloc;break;case 2:if(b=this.productions_[x[1]][1],w.$=s[s.length-b],w._$={first_line:r[r.length-(b||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(b||1)].first_column,last_column:r[r.length-1].last_column},f&&(w._$.range=[r[r.length-(b||1)].range[0],r[r.length-1].range[1]]),void 0!==(k=this.performAction.apply(w,[l,c,o,y.yy,x[1],s,r].concat(h))))return k;b&&(i=i.slice(0,-1*b*2),s=s.slice(0,-1*b),r=r.slice(0,-1*b)),i.push(this.productions_[x[1]][0]),s.push(w.$),r.push(w._$),v=a[i[i.length-2]][i[i.length-1]],i.push(v);break;case 3:return!0;}}return!0;}};function c(){this.yy={};}return o.lexer={EOF:1,parseError:function(t,e){if(this.yy.parser)this.yy.parser.parseError(t,e);else throw Error(t);},setInput:function(t,e){return this.yy=e||this.yy||{},this._input=t,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this;},input:function(){var t=this._input[0];return this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t,t.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t;},unput:function(t){var e=t.length,i=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-e),this.offset-=e;var n=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),i.length-1&&(this.yylineno-=i.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:i?(i.length===n.length?this.yylloc.first_column:0)+n[n.length-i.length].length-i[0].length:this.yylloc.first_column-e},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-e]),this.yyleng=this.yytext.length,this;},more:function(){return this._more=!0,this;},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});},less:function(t){this.unput(this.match.slice(t));},pastInput:function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return(t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"");},upcomingInput:function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"");},showPosition:function(){var t=this.pastInput(),e=Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+e+"^";},test_match:function(t,e){var i,n,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),(n=t[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=n.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:n?n[n.length-1].length-n[n.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length},this.yytext+=t[0],this.match+=t[0],this.matches=t,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(t[0].length),this.matched+=t[0],i=this.performAction.call(this,this.yy,this,e,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),i)return i;if(this._backtrack)for(var r in s)this[r]=s[r];return!1;},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var t,e,i,n,s=this._currentRules(),r=0;r<s.length;r++)if((i=this._input.match(this.rules[s[r]]))&&(!e||i[0].length>e[0].length)){if(e=i,n=r,this.options.backtrack_lexer){if(!1!==(t=this.test_match(i,s[r])))return t;if(!this._backtrack)return!1;e=!1;continue;}if(!this.options.flex)break;}return e?!1!==(t=this.test_match(e,s[n]))&&t:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});},lex:function(){return this.next()||this.lex();},begin:function(t){this.conditionStack.push(t);},popState:function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0];},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules;},topState:function(t){return(t=this.conditionStack.length-1-Math.abs(t||0))>=0?this.conditionStack[t]:"INITIAL";},pushState:function(t){this.begin(t);},stateStackSize:function(){return this.conditionStack.length;},options:{"case-insensitive":!0},performAction:function(t,e,i,n){switch(i){case 0:case 1:case 3:case 4:break;case 2:return 10;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;case 8:return this.popState(),"acc_title_value";case 9:return this.begin("acc_descr"),14;case 10:return this.popState(),"acc_descr_value";case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID";}},rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}},c.prototype=o,o.Parser=c,new c;}();a.parser=a;let l="",o=[],c=[],h=[],u=function(){let t=[];return c.forEach(e=>{e.people&&t.push(...e.people);}),[...new Set(t)].sort();},y=function(){let t=!0;for(let[e,i]of h.entries())h[e].processed,t=t&&i.processed;return t;},p={getConfig:()=>(0,n.c)().journey,clear:function(){o.length=0,c.length=0,l="",h.length=0,(0,n.v)();},setDiagramTitle:n.q,getDiagramTitle:n.t,setAccTitle:n.s,getAccTitle:n.g,setAccDescription:n.b,getAccDescription:n.a,addSection:function(t){l=t,o.push(t);},getSections:function(){return o;},getTasks:function(){let t=y(),e=0;for(;!t&&e<100;)t=y(),e++;return c.push(...h),c;},addTask:function(t,e){let i=e.substr(1).split(":"),n=0,s=[];1===i.length?(n=Number(i[0]),s=[]):(n=Number(i[0]),s=i[1].split(","));let r=s.map(t=>t.trim()),a={section:l,type:l,people:r,task:t,score:n};h.push(a);},addTaskOrg:function(t){let e={section:l,type:l,description:t,task:t,classes:[]};c.push(e);},getActors:function(){return u();}},d=function(t,e){return(0,r.d)(t,e);},f=function(t,e){let i=t.append("circle").attr("cx",e.cx).attr("cy",e.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),n=t.append("g");return n.append("circle").attr("cx",e.cx-5).attr("cy",e.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),n.append("circle").attr("cx",e.cx+5).attr("cy",e.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),e.score>3?function(t){let i=(0,s.arc)().startAngle(Math.PI/2).endAngle(Math.PI/2*3).innerRadius(7.5).outerRadius(15/2.2);t.append("path").attr("class","mouth").attr("d",i).attr("transform","translate("+e.cx+","+(e.cy+2)+")");}(n):e.score<3?function(t){let i=(0,s.arc)().startAngle(3*Math.PI/2).endAngle(Math.PI/2*5).innerRadius(7.5).outerRadius(15/2.2);t.append("path").attr("class","mouth").attr("d",i).attr("transform","translate("+e.cx+","+(e.cy+7)+")");}(n):function(t){t.append("line").attr("class","mouth").attr("stroke",2).attr("x1",e.cx-5).attr("y1",e.cy+7).attr("x2",e.cx+5).attr("y2",e.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666");}(n),i;},g=function(t,e){let i=t.append("circle");return i.attr("cx",e.cx),i.attr("cy",e.cy),i.attr("class","actor-"+e.pos),i.attr("fill",e.fill),i.attr("stroke",e.stroke),i.attr("r",e.r),void 0!==i.class&&i.attr("class",i.class),void 0!==e.title&&i.append("title").text(e.title),i;},m=-1,x=function(){function t(t,e,i,s,r,a,l,o){n(e.append("text").attr("x",i+r/2).attr("y",s+a/2+5).style("font-color",o).style("text-anchor","middle").text(t),l);}function e(t,e,i,s,r,a,l,o,c){let{taskFontSize:h,taskFontFamily:u}=o,y=t.split(/<br\s*\/?>/gi);for(let t=0;t<y.length;t++){let o=t*h-h*(y.length-1)/2,p=e.append("text").attr("x",i+r/2).attr("y",s).attr("fill",c).style("text-anchor","middle").style("font-size",h).style("font-family",u);p.append("tspan").attr("x",i+r/2).attr("dy",o).text(y[t]),p.attr("y",s+a/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),n(p,l);}}function i(t,i,s,r,a,l,o,c){let h=i.append("switch"),u=h.append("foreignObject").attr("x",s).attr("y",r).attr("width",a).attr("height",l).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");u.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(t),e(t,h,s,r,a,l,o,c),n(u,o);}function n(t,e){for(let i in e)i in e&&t.attr(i,e[i]);}return function(n){return"fo"===n.textPlacement?i:"old"===n.textPlacement?t:e;};}(),k={drawCircle:g,drawSection:function(t,e,i){let n=t.append("g"),s=(0,r.g)();s.x=e.x,s.y=e.y,s.fill=e.fill,s.width=i.width*e.taskCount+i.diagramMarginX*(e.taskCount-1),s.height=i.height,s.class="journey-section section-type-"+e.num,s.rx=3,s.ry=3,d(n,s),x(i)(e.text,n,s.x,s.y,s.width,s.height,{class:"journey-section section-type-"+e.num},i,e.colour);},drawText:function(t,e){return(0,r.f)(t,e);},drawTask:function(t,e,i){let n=e.x+i.width/2,s=t.append("g");m++,s.append("line").attr("id","task"+m).attr("x1",n).attr("y1",e.y).attr("x2",n).attr("y2",450).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),f(s,{cx:n,cy:300+(5-e.score)*30,score:e.score});let a=(0,r.g)();a.x=e.x,a.y=e.y,a.fill=e.fill,a.width=i.width,a.height=i.height,a.class="task task-type-"+e.num,a.rx=3,a.ry=3,d(s,a);let l=e.x+14;e.people.forEach(t=>{let i=e.actors[t].color;g(s,{cx:l,cy:e.y,r:7,fill:i,stroke:"#000",title:t,pos:e.actors[t].position}),l+=10;}),x(i)(e.task,s,a.x,a.y,a.width,a.height,{class:"task"},i,e.colour);},initGraphics:function(t){t.append("defs").append("marker").attr("id","arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z");}},_={},b=(0,n.c)().journey,v=b.leftMargin,$={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0;},updateVal:function(t,e,i,n){void 0===t[e]?t[e]=i:t[e]=n(i,t[e]);},updateBounds:function(t,e,i,s){let r=(0,n.c)().journey,a=this,l=0;this.sequenceItems.forEach(function(n){l++;let o=a.sequenceItems.length-l+1;a.updateVal(n,"starty",e-o*r.boxMargin,Math.min),a.updateVal(n,"stopy",s+o*r.boxMargin,Math.max),a.updateVal($.data,"startx",t-o*r.boxMargin,Math.min),a.updateVal($.data,"stopx",i+o*r.boxMargin,Math.max),a.updateVal(n,"startx",t-o*r.boxMargin,Math.min),a.updateVal(n,"stopx",i+o*r.boxMargin,Math.max),a.updateVal($.data,"starty",e-o*r.boxMargin,Math.min),a.updateVal($.data,"stopy",s+o*r.boxMargin,Math.max);});},insert:function(t,e,i,n){let s=Math.min(t,i),r=Math.max(t,i),a=Math.min(e,n),l=Math.max(e,n);this.updateVal($.data,"startx",s,Math.min),this.updateVal($.data,"starty",a,Math.min),this.updateVal($.data,"stopx",r,Math.max),this.updateVal($.data,"stopy",l,Math.max),this.updateBounds(s,a,r,l);},bumpVerticalPos:function(t){this.verticalPos=this.verticalPos+t,this.data.stopy=this.verticalPos;},getVerticalPos:function(){return this.verticalPos;},getBounds:function(){return this.data;}},w=b.sectionFills,M=b.sectionColours,T=function(t,e,i){let s=(0,n.c)().journey,r="",a=i+(2*s.height+s.diagramMarginY),l=0,o="#CCC",c="black",h=0;for(let[i,n]of e.entries()){if(r!==n.section){o=w[l%w.length],h=l%w.length,c=M[l%M.length];let a=0,u=n.section;for(let t=i;t<e.length&&e[t].section==u;t++)a+=1;let y={x:i*s.taskMargin+i*s.width+v,y:50,text:n.section,fill:o,num:h,colour:c,taskCount:a};k.drawSection(t,y,s),r=n.section,l++;}let u=n.people.reduce((t,e)=>(_[e]&&(t[e]=_[e]),t),{});n.x=i*s.taskMargin+i*s.width+v,n.y=a,n.width=s.diagramMarginX,n.height=s.diagramMarginY,n.colour=c,n.fill=o,n.num=h,n.actors=u,k.drawTask(t,n,s),$.insert(n.x,n.y,n.x+n.width+s.taskMargin,450);}},E={setConf:function(t){Object.keys(t).forEach(function(e){b[e]=t[e];});},draw:function(t,e,i,r){let a;let l=(0,n.c)().journey,o=(0,n.c)().securityLevel;"sandbox"===o&&(a=(0,s.select)("#i"+e));let c="sandbox"===o?(0,s.select)(a.nodes()[0].contentDocument.body):(0,s.select)("body");$.init();let h=c.select("#"+e);k.initGraphics(h);let u=r.db.getTasks(),y=r.db.getDiagramTitle(),p=r.db.getActors();for(let t in _)delete _[t];let d=0;p.forEach(t=>{_[t]={color:l.actorColours[d%l.actorColours.length],position:d},d++;}),function(t){let e=(0,n.c)().journey,i=60;Object.keys(_).forEach(n=>{let s=_[n].color,r={cx:20,cy:i,r:7,fill:s,stroke:"#000",pos:_[n].position};k.drawCircle(t,r);let a={x:40,y:i+7,fill:"#666",text:n,textMargin:5|e.boxTextMargin};k.drawText(t,a),i+=20;});}(h),$.insert(0,0,v,50*Object.keys(_).length),T(h,u,0);let f=$.getBounds();y&&h.append("text").text(y).attr("x",v).attr("font-size","4ex").attr("font-weight","bold").attr("y",25);let g=f.stopy-f.starty+2*l.diagramMarginY,m=v+f.stopx+2*l.diagramMarginX;(0,n.i)(h,g,m,l.useMaxWidth),h.append("line").attr("x1",v).attr("y1",4*l.height).attr("x2",m-v-4).attr("y2",4*l.height).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#arrowhead)");let x=y?70:0;h.attr("viewBox",`${f.startx} -25 ${m} ${g+x}`),h.attr("preserveAspectRatio","xMinYMin meet"),h.attr("height",g+x+25);}},S={parser:a,db:p,renderer:E,styles:t=>`.label {
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
    color: ${t.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${t.textColor}
  }

  .legend {
    fill: ${t.textColor};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${t.textColor}
  }

  .face {
    ${t.faceColor?`fill: ${t.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${t.mainBkg};
    stroke: ${t.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${t.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${t.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${t.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${t.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${t.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: 'trebuchet ms', verdana, arial, sans-serif;
    font-family: var(--mermaid-font-family);
    font-size: 12px;
    background: ${t.tertiaryColor};
    border: 1px solid ${t.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${t.fillType0?`fill: ${t.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${t.fillType0?`fill: ${t.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${t.fillType0?`fill: ${t.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${t.fillType0?`fill: ${t.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${t.fillType0?`fill: ${t.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${t.fillType0?`fill: ${t.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${t.fillType0?`fill: ${t.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${t.fillType0?`fill: ${t.fillType7}`:""};
  }

  .actor-0 {
    ${t.actor0?`fill: ${t.actor0}`:""};
  }
  .actor-1 {
    ${t.actor1?`fill: ${t.actor1}`:""};
  }
  .actor-2 {
    ${t.actor2?`fill: ${t.actor2}`:""};
  }
  .actor-3 {
    ${t.actor3?`fill: ${t.actor3}`:""};
  }
  .actor-4 {
    ${t.actor4?`fill: ${t.actor4}`:""};
  }
  .actor-5 {
    ${t.actor5?`fill: ${t.actor5}`:""};
  }
`,init:t=>{E.setConf(t.journey),p.clear();}};}}]);
//# sourceMappingURL=90e85d4b-async.1d63bd8a.js.map