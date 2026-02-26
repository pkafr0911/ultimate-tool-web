(("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]=("undefined"!=typeof globalThis?globalThis:self)["makoChunk_ultimate-tool-web"]||[]).push([["8d9696e1"],{"8d9696e1":function(t,e,i){"use strict";let n,s,r,a;i.d(e,"__esModule",{value:!0}),i.d(e,"diagram",{enumerable:!0,get:function(){return Z;}});var l=i("777fffbe"),o=i("2bd497b4"),c=l._(i("91b49a95")),d=l._(i("40963c37")),u=l._(i("461cad0d")),h=l._(i("e466ecb4")),f=i("098f2bda"),y=i("06c87c47");i("1ab0df57"),i("56ab4618"),i("d8b47e3d"),i("8e22be2e"),i("782824a9"),i("e15735a0"),i("b96058f2");var m=function(){var t=function(t,e,i,n){for(i=i||{},n=t.length;n--;i[t[n]]=e);return i;},e=[6,8,10,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,30,32,33,35,37],i=[1,25],n=[1,26],s=[1,27],r=[1,28],a=[1,29],l=[1,30],o=[1,31],c=[1,9],d=[1,10],u=[1,11],h=[1,12],f=[1,13],y=[1,14],m=[1,15],k=[1,16],p=[1,18],g=[1,19],b=[1,20],T=[1,21],x=[1,22],v=[1,24],_=[1,32],w={trace:function(){},yy:{},symbols_:{error:2,start:3,gantt:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NL:10,weekday:11,weekday_monday:12,weekday_tuesday:13,weekday_wednesday:14,weekday_thursday:15,weekday_friday:16,weekday_saturday:17,weekday_sunday:18,dateFormat:19,inclusiveEndDates:20,topAxis:21,axisFormat:22,tickInterval:23,excludes:24,includes:25,todayMarker:26,title:27,acc_title:28,acc_title_value:29,acc_descr:30,acc_descr_value:31,acc_descr_multiline_value:32,section:33,clickStatement:34,taskTxt:35,taskData:36,click:37,callbackname:38,callbackargs:39,href:40,clickStatementDebug:41,$accept:0,$end:1},terminals_:{2:"error",4:"gantt",6:"EOF",8:"SPACE",10:"NL",12:"weekday_monday",13:"weekday_tuesday",14:"weekday_wednesday",15:"weekday_thursday",16:"weekday_friday",17:"weekday_saturday",18:"weekday_sunday",19:"dateFormat",20:"inclusiveEndDates",21:"topAxis",22:"axisFormat",23:"tickInterval",24:"excludes",25:"includes",26:"todayMarker",27:"title",28:"acc_title",29:"acc_title_value",30:"acc_descr",31:"acc_descr_value",32:"acc_descr_multiline_value",33:"section",35:"taskTxt",36:"taskData",37:"click",38:"callbackname",39:"callbackargs",40:"href"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[11,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,1],[9,2],[34,2],[34,3],[34,3],[34,4],[34,3],[34,4],[34,2],[41,2],[41,3],[41,3],[41,4],[41,3],[41,4],[41,2]],performAction:function(t,e,i,n,s,r,a){var l=r.length-1;switch(s){case 1:return r[l-1];case 2:case 6:case 7:this.$=[];break;case 3:r[l-1].push(r[l]),this.$=r[l-1];break;case 4:case 5:this.$=r[l];break;case 8:n.setWeekday("monday");break;case 9:n.setWeekday("tuesday");break;case 10:n.setWeekday("wednesday");break;case 11:n.setWeekday("thursday");break;case 12:n.setWeekday("friday");break;case 13:n.setWeekday("saturday");break;case 14:n.setWeekday("sunday");break;case 15:n.setDateFormat(r[l].substr(11)),this.$=r[l].substr(11);break;case 16:n.enableInclusiveEndDates(),this.$=r[l].substr(18);break;case 17:n.TopAxis(),this.$=r[l].substr(8);break;case 18:n.setAxisFormat(r[l].substr(11)),this.$=r[l].substr(11);break;case 19:n.setTickInterval(r[l].substr(13)),this.$=r[l].substr(13);break;case 20:n.setExcludes(r[l].substr(9)),this.$=r[l].substr(9);break;case 21:n.setIncludes(r[l].substr(9)),this.$=r[l].substr(9);break;case 22:n.setTodayMarker(r[l].substr(12)),this.$=r[l].substr(12);break;case 24:n.setDiagramTitle(r[l].substr(6)),this.$=r[l].substr(6);break;case 25:this.$=r[l].trim(),n.setAccTitle(this.$);break;case 26:case 27:this.$=r[l].trim(),n.setAccDescription(this.$);break;case 28:n.addSection(r[l].substr(8)),this.$=r[l].substr(8);break;case 30:n.addTask(r[l-1],r[l]),this.$="task";break;case 31:this.$=r[l-1],n.setClickEvent(r[l-1],r[l],null);break;case 32:this.$=r[l-2],n.setClickEvent(r[l-2],r[l-1],r[l]);break;case 33:this.$=r[l-2],n.setClickEvent(r[l-2],r[l-1],null),n.setLink(r[l-2],r[l]);break;case 34:this.$=r[l-3],n.setClickEvent(r[l-3],r[l-2],r[l-1]),n.setLink(r[l-3],r[l]);break;case 35:this.$=r[l-2],n.setClickEvent(r[l-2],r[l],null),n.setLink(r[l-2],r[l-1]);break;case 36:this.$=r[l-3],n.setClickEvent(r[l-3],r[l-1],r[l]),n.setLink(r[l-3],r[l-2]);break;case 37:this.$=r[l-1],n.setLink(r[l-1],r[l]);break;case 38:case 44:this.$=r[l-1]+" "+r[l];break;case 39:case 40:case 42:this.$=r[l-2]+" "+r[l-1]+" "+r[l];break;case 41:case 43:this.$=r[l-3]+" "+r[l-2]+" "+r[l-1]+" "+r[l];}},table:[{3:1,4:[1,2]},{1:[3]},t(e,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:17,12:i,13:n,14:s,15:r,16:a,17:l,18:o,19:c,20:d,21:u,22:h,23:f,24:y,25:m,26:k,27:p,28:g,30:b,32:T,33:x,34:23,35:v,37:_},t(e,[2,7],{1:[2,1]}),t(e,[2,3]),{9:33,11:17,12:i,13:n,14:s,15:r,16:a,17:l,18:o,19:c,20:d,21:u,22:h,23:f,24:y,25:m,26:k,27:p,28:g,30:b,32:T,33:x,34:23,35:v,37:_},t(e,[2,5]),t(e,[2,6]),t(e,[2,15]),t(e,[2,16]),t(e,[2,17]),t(e,[2,18]),t(e,[2,19]),t(e,[2,20]),t(e,[2,21]),t(e,[2,22]),t(e,[2,23]),t(e,[2,24]),{29:[1,34]},{31:[1,35]},t(e,[2,27]),t(e,[2,28]),t(e,[2,29]),{36:[1,36]},t(e,[2,8]),t(e,[2,9]),t(e,[2,10]),t(e,[2,11]),t(e,[2,12]),t(e,[2,13]),t(e,[2,14]),{38:[1,37],40:[1,38]},t(e,[2,4]),t(e,[2,25]),t(e,[2,26]),t(e,[2,30]),t(e,[2,31],{39:[1,39],40:[1,40]}),t(e,[2,37],{38:[1,41]}),t(e,[2,32],{40:[1,42]}),t(e,[2,33]),t(e,[2,35],{39:[1,43]}),t(e,[2,34]),t(e,[2,36])],defaultActions:{},parseError:function(t,e){if(e.recoverable)this.trace(t);else{var i=Error(t);throw i.hash=e,i;}},parse:function(t){var e=this,i=[0],n=[],s=[null],r=[],a=this.table,l="",o=0,c=0,d=r.slice.call(arguments,1),u=Object.create(this.lexer),h={yy:{}};for(var f in this.yy)Object.prototype.hasOwnProperty.call(this.yy,f)&&(h.yy[f]=this.yy[f]);u.setInput(t,h.yy),h.yy.lexer=u,h.yy.parser=this,void 0===u.yylloc&&(u.yylloc={});var y=u.yylloc;r.push(y);var m=u.options&&u.options.ranges;"function"==typeof h.yy.parseError?this.parseError=h.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;for(var k,p,g,b,T,x,v,_,w={};;){if(p=i[i.length-1],this.defaultActions[p]?g=this.defaultActions[p]:(null==k&&(k=function(){var t;return"number"!=typeof(t=n.pop()||u.lex()||1)&&(t instanceof Array&&(t=(n=t).pop()),t=e.symbols_[t]||t),t;}()),g=a[p]&&a[p][k]),void 0===g||!g.length||!g[0]){var C="";for(T in _=[],a[p])this.terminals_[T]&&T>2&&_.push("'"+this.terminals_[T]+"'");C=u.showPosition?"Parse error on line "+(o+1)+":\n"+u.showPosition()+"\nExpecting "+_.join(", ")+", got '"+(this.terminals_[k]||k)+"'":"Parse error on line "+(o+1)+": Unexpected "+(1==k?"end of input":"'"+(this.terminals_[k]||k)+"'"),this.parseError(C,{text:u.match,token:this.terminals_[k]||k,line:u.yylineno,loc:y,expected:_});}if(g[0]instanceof Array&&g.length>1)throw Error("Parse Error: multiple actions possible at state: "+p+", token: "+k);switch(g[0]){case 1:i.push(k),s.push(u.yytext),r.push(u.yylloc),i.push(g[1]),k=null,c=u.yyleng,l=u.yytext,o=u.yylineno,y=u.yylloc;break;case 2:if(x=this.productions_[g[1]][1],w.$=s[s.length-x],w._$={first_line:r[r.length-(x||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(x||1)].first_column,last_column:r[r.length-1].last_column},m&&(w._$.range=[r[r.length-(x||1)].range[0],r[r.length-1].range[1]]),void 0!==(b=this.performAction.apply(w,[l,c,o,h.yy,g[1],s,r].concat(d))))return b;x&&(i=i.slice(0,-1*x*2),s=s.slice(0,-1*x),r=r.slice(0,-1*x)),i.push(this.productions_[g[1]][0]),s.push(w.$),r.push(w._$),v=a[i[i.length-2]][i[i.length-1]],i.push(v);break;case 3:return!0;}}return!0;}};function C(){this.yy={};}return w.lexer={EOF:1,parseError:function(t,e){if(this.yy.parser)this.yy.parser.parseError(t,e);else throw Error(t);},setInput:function(t,e){return this.yy=e||this.yy||{},this._input=t,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this;},input:function(){var t=this._input[0];return this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t,t.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t;},unput:function(t){var e=t.length,i=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-e),this.offset-=e;var n=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),i.length-1&&(this.yylineno-=i.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:i?(i.length===n.length?this.yylloc.first_column:0)+n[n.length-i.length].length-i[0].length:this.yylloc.first_column-e},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-e]),this.yyleng=this.yytext.length,this;},more:function(){return this._more=!0,this;},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});},less:function(t){this.unput(this.match.slice(t));},pastInput:function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return(t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"");},upcomingInput:function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"");},showPosition:function(){var t=this.pastInput(),e=Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+e+"^";},test_match:function(t,e){var i,n,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),(n=t[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=n.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:n?n[n.length-1].length-n[n.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length},this.yytext+=t[0],this.match+=t[0],this.matches=t,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(t[0].length),this.matched+=t[0],i=this.performAction.call(this,this.yy,this,e,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),i)return i;if(this._backtrack)for(var r in s)this[r]=s[r];return!1;},next:function(){if(this.done)return this.EOF;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var t,e,i,n,s=this._currentRules(),r=0;r<s.length;r++)if((i=this._input.match(this.rules[s[r]]))&&(!e||i[0].length>e[0].length)){if(e=i,n=r,this.options.backtrack_lexer){if(!1!==(t=this.test_match(i,s[r])))return t;if(!this._backtrack)return!1;e=!1;continue;}if(!this.options.flex)break;}return e?!1!==(t=this.test_match(e,s[n]))&&t:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});},lex:function(){return this.next()||this.lex();},begin:function(t){this.conditionStack.push(t);},popState:function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0];},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules;},topState:function(t){return(t=this.conditionStack.length-1-Math.abs(t||0))>=0?this.conditionStack[t]:"INITIAL";},pushState:function(t){this.begin(t);},stateStackSize:function(){return this.conditionStack.length;},options:{"case-insensitive":!0},performAction:function(t,e,i,n){switch(i){case 0:return this.begin("open_directive"),"open_directive";case 1:return this.begin("acc_title"),28;case 2:return this.popState(),"acc_title_value";case 3:return this.begin("acc_descr"),30;case 4:return this.popState(),"acc_descr_value";case 5:this.begin("acc_descr_multiline");break;case 6:case 15:case 18:case 21:case 24:this.popState();break;case 7:return"acc_descr_multiline_value";case 8:case 9:case 10:case 12:case 13:break;case 11:return 10;case 14:this.begin("href");break;case 16:return 40;case 17:this.begin("callbackname");break;case 19:this.popState(),this.begin("callbackargs");break;case 20:return 38;case 22:return 39;case 23:this.begin("click");break;case 25:return 37;case 26:return 4;case 27:return 19;case 28:return 20;case 29:return 21;case 30:return 22;case 31:return 23;case 32:return 25;case 33:return 24;case 34:return 26;case 35:return 12;case 36:return 13;case 37:return 14;case 38:return 15;case 39:return 16;case 40:return 17;case 41:return 18;case 42:return"date";case 43:return 27;case 44:return"accDescription";case 45:return 33;case 46:return 35;case 47:return 36;case 48:return":";case 49:return 6;case 50:return"INVALID";}},rules:[/^(?:%%\{)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:%%(?!\{)*[^\n]*)/i,/^(?:[^\}]%%*[^\n]*)/i,/^(?:%%*[^\n]*[\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:%[^\n]*)/i,/^(?:href[\s]+["])/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:call[\s]+)/i,/^(?:\([\s]*\))/i,/^(?:\()/i,/^(?:[^(]*)/i,/^(?:\))/i,/^(?:[^)]*)/i,/^(?:click[\s]+)/i,/^(?:[\s\n])/i,/^(?:[^\s\n]*)/i,/^(?:gantt\b)/i,/^(?:dateFormat\s[^#\n;]+)/i,/^(?:inclusiveEndDates\b)/i,/^(?:topAxis\b)/i,/^(?:axisFormat\s[^#\n;]+)/i,/^(?:tickInterval\s[^#\n;]+)/i,/^(?:includes\s[^#\n;]+)/i,/^(?:excludes\s[^#\n;]+)/i,/^(?:todayMarker\s[^\n;]+)/i,/^(?:weekday\s+monday\b)/i,/^(?:weekday\s+tuesday\b)/i,/^(?:weekday\s+wednesday\b)/i,/^(?:weekday\s+thursday\b)/i,/^(?:weekday\s+friday\b)/i,/^(?:weekday\s+saturday\b)/i,/^(?:weekday\s+sunday\b)/i,/^(?:\d\d\d\d-\d\d-\d\d\b)/i,/^(?:title\s[^\n]+)/i,/^(?:accDescription\s[^#\n;]+)/i,/^(?:section\s[^\n]+)/i,/^(?:[^:\n]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[6,7],inclusive:!1},acc_descr:{rules:[4],inclusive:!1},acc_title:{rules:[2],inclusive:!1},callbackargs:{rules:[21,22],inclusive:!1},callbackname:{rules:[18,19,20],inclusive:!1},href:{rules:[15,16],inclusive:!1},click:{rules:[24,25],inclusive:!1},INITIAL:{rules:[0,1,3,5,8,9,10,11,12,13,14,17,23,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50],inclusive:!0}}},C.prototype=w,w.Parser=C,new C;}();m.parser=m,c.default.extend(d.default),c.default.extend(u.default),c.default.extend(h.default);let k="",p="",g="",b=[],T=[],x={},v=[],_=[],w="",C="",$=["active","done","crit","milestone"],S=[],E=!1,D=!1,A="sunday",I=0,F=function(t,e,i,n){return!n.includes(t.format(e.trim()))&&(!!(t.isoWeekday()>=6&&i.includes("weekends")||i.includes(t.format("dddd").toLowerCase()))||i.includes(t.format(e.trim())));},L=function(t,e,i,n){let s;if(!i.length||t.manualEndTime)return;let[r,a]=M((t.startTime instanceof Date?(0,c.default)(t.startTime):(0,c.default)(t.startTime,e,!0)).add(1,"d"),t.endTime instanceof Date?(0,c.default)(t.endTime):(0,c.default)(t.endTime,e,!0),e,i,n);t.endTime=r.toDate(),t.renderEndTime=a;},M=function(t,e,i,n,s){let r=!1,a=null;for(;t<=e;)r||(a=e.toDate()),(r=F(t,i,n,s))&&(e=e.add(1,"d")),t=t.add(1,"d");return[e,a];},O=function(t,e,i){i=i.trim();let n=/^after\s+(?<ids>[\d\w- ]+)/.exec(i);if(null!==n){let t=null;for(let e of n.groups.ids.split(" ")){let i=R(e);void 0!==i&&(!t||i.endTime>t.endTime)&&(t=i);}if(t)return t.endTime;let e=new Date;return e.setHours(0,0,0,0),e;}let s=(0,c.default)(i,e.trim(),!0);if(s.isValid())return s.toDate();{f.l.debug("Invalid date:"+i),f.l.debug("With date format:"+e.trim());let t=new Date(i);if(void 0===t||isNaN(t.getTime())||-1e4>t.getFullYear()||t.getFullYear()>1e4)throw Error("Invalid date:"+i);return t;}},P=function(t){let e=/^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());return null!==e?[Number.parseFloat(e[1]),e[2]]:[NaN,"ms"];},B=function(t,e,i,n=!1){i=i.trim();let s=/^until\s+(?<ids>[\d\w- ]+)/.exec(i);if(null!==s){let t=null;for(let e of s.groups.ids.split(" ")){let i=R(e);void 0!==i&&(!t||i.startTime<t.startTime)&&(t=i);}if(t)return t.startTime;let e=new Date;return e.setHours(0,0,0,0),e;}let r=(0,c.default)(i,e.trim(),!0);if(r.isValid())return n&&(r=r.add(1,"d")),r.toDate();let a=(0,c.default)(t),[l,o]=P(i);if(!Number.isNaN(l)){let t=a.add(l,o);t.isValid()&&(a=t);}return a.toDate();},N=0,W=function(t){return void 0===t?"task"+(N+=1):t;},Y=function(t,e){let i=(":"===e.substr(0,1)?e.substr(1,e.length):e).split(","),n={};K(i,n,$);for(let t=0;t<i.length;t++)i[t]=i[t].trim();let s="";switch(i.length){case 1:n.id=W(),n.startTime=t.endTime,s=i[0];break;case 2:n.id=W(),n.startTime=O(void 0,k,i[0]),s=i[1];break;case 3:n.id=W(i[0]),n.startTime=O(void 0,k,i[1]),s=i[2];}return s&&(n.endTime=B(n.startTime,k,s,E),n.manualEndTime=(0,c.default)(s,"YYYY-MM-DD",!0).isValid(),L(n,k,T,b)),n;},z=function(t,e){let i=(":"===e.substr(0,1)?e.substr(1,e.length):e).split(","),n={};K(i,n,$);for(let t=0;t<i.length;t++)i[t]=i[t].trim();switch(i.length){case 1:n.id=W(),n.startTime={type:"prevTaskEnd",id:t},n.endTime={data:i[0]};break;case 2:n.id=W(),n.startTime={type:"getStartDate",startData:i[0]},n.endTime={data:i[1]};break;case 3:n.id=W(i[0]),n.startTime={type:"getStartDate",startData:i[1]},n.endTime={data:i[2]};}return n;},j=[],H={},R=function(t){return j[H[t]];},V=function(){let t=!0;for(let[e,i]of j.entries())!function(t){let e=j[t],i="";switch(j[t].raw.startTime.type){case"prevTaskEnd":{let t=R(e.prevTaskId);e.startTime=t.endTime;break;}case"getStartDate":(i=O(void 0,k,j[t].raw.startTime.startData))&&(j[t].startTime=i);}j[t].startTime&&(j[t].endTime=B(j[t].startTime,k,j[t].raw.endTime.data,E),j[t].endTime&&(j[t].processed=!0,j[t].manualEndTime=(0,c.default)(j[t].raw.endTime.data,"YYYY-MM-DD",!0).isValid(),L(j[t],k,T,b))),j[t].processed;}(e),t=t&&i.processed;return t;},q=function(t,e){t.split(",").forEach(function(t){let i=R(t);void 0!==i&&i.classes.push(e);});},G=function(t,e,i){if("loose"!==(0,f.c)().securityLevel||void 0===e)return;let n=[];if("string"==typeof i){n=i.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);for(let t=0;t<n.length;t++){let e=n[t].trim();'"'===e.charAt(0)&&'"'===e.charAt(e.length-1)&&(e=e.substr(1,e.length-2)),n[t]=e;}}0===n.length&&n.push(t),void 0!==R(t)&&U(t,()=>{f.u.runFunc(e,...n);});},U=function(t,e){S.push(function(){let i=document.querySelector(`[id="${t}"]`);null!==i&&i.addEventListener("click",function(){e();});},function(){let i=document.querySelector(`[id="${t}-text"]`);null!==i&&i.addEventListener("click",function(){e();});});},J={getConfig:()=>(0,f.c)().gantt,clear:function(){v=[],_=[],w="",S=[],N=0,n=void 0,s=void 0,j=[],k="",p="",C="",a=void 0,g="",b=[],T=[],E=!1,D=!1,I=0,x={},(0,f.v)(),A="sunday";},setDateFormat:function(t){k=t;},getDateFormat:function(){return k;},enableInclusiveEndDates:function(){E=!0;},endDatesAreInclusive:function(){return E;},enableTopAxis:function(){D=!0;},topAxisEnabled:function(){return D;},setAxisFormat:function(t){p=t;},getAxisFormat:function(){return p;},setTickInterval:function(t){a=t;},getTickInterval:function(){return a;},setTodayMarker:function(t){g=t;},getTodayMarker:function(){return g;},setAccTitle:f.s,getAccTitle:f.g,setDiagramTitle:f.q,getDiagramTitle:f.t,setDisplayMode:function(t){C=t;},getDisplayMode:function(){return C;},setAccDescription:f.b,getAccDescription:f.a,addSection:function(t){w=t,v.push(t);},getSections:function(){return v;},getTasks:function(){let t=V(),e=0;for(;!t&&e<10;)t=V(),e++;return _=j;},addTask:function(t,e){let i={section:w,type:w,processed:!1,manualEndTime:!1,renderEndTime:null,raw:{data:e},task:t,classes:[]},n=z(s,e);i.raw.startTime=n.startTime,i.raw.endTime=n.endTime,i.id=n.id,i.prevTaskId=s,i.active=n.active,i.done=n.done,i.crit=n.crit,i.milestone=n.milestone,i.order=I,I++;let r=j.push(i);s=i.id,H[i.id]=r-1;},findTaskById:R,addTaskOrg:function(t,e){let i={section:w,type:w,description:t,task:t,classes:[]},s=Y(n,e);i.startTime=s.startTime,i.endTime=s.endTime,i.id=s.id,i.active=s.active,i.done=s.done,i.crit=s.crit,i.milestone=s.milestone,n=i,_.push(i);},setIncludes:function(t){b=t.toLowerCase().split(/[\s,]+/);},getIncludes:function(){return b;},setExcludes:function(t){T=t.toLowerCase().split(/[\s,]+/);},getExcludes:function(){return T;},setClickEvent:function(t,e,i){t.split(",").forEach(function(t){G(t,e,i);}),q(t,"clickable");},setLink:function(t,e){let i=e;"loose"!==(0,f.c)().securityLevel&&(i=(0,o.sanitizeUrl)(e)),t.split(",").forEach(function(t){void 0!==R(t)&&(U(t,()=>{window.open(i,"_self");}),x[t]=i);}),q(t,"clickable");},getLinks:function(){return x;},bindFunctions:function(t){S.forEach(function(e){e(t);});},parseDuration:P,isInvalidDate:F,setWeekday:function(t){A=t;},getWeekday:function(){return A;}};function K(t,e,i){let n=!0;for(;n;)n=!1,i.forEach(function(i){let s=RegExp("^\\s*"+i+"\\s*$");t[0].match(s)&&(e[i]=!0,t.shift(1),n=!0);});}let Q={monday:y.timeMonday,tuesday:y.timeTuesday,wednesday:y.timeWednesday,thursday:y.timeThursday,friday:y.timeFriday,saturday:y.timeSaturday,sunday:y.timeSunday},X=(t,e)=>{let i=[...t].map(()=>-1/0),n=[...t].sort((t,e)=>t.startTime-e.startTime||t.order-e.order),s=0;for(let t of n)for(let n=0;n<i.length;n++)if(t.startTime>=i[n]){i[n]=t.endTime,t.order=n+e,n>s&&(s=n);break;}return s;},Z={parser:m,db:J,renderer:{setConf:function(){f.l.debug("Something is calling, setConf, remove the call");},draw:function(t,e,i,n){let s;let a=(0,f.c)().gantt,l=(0,f.c)().securityLevel;"sandbox"===l&&(s=(0,y.select)("#i"+e));let o="sandbox"===l?(0,y.select)(s.nodes()[0].contentDocument.body):(0,y.select)("body"),d="sandbox"===l?s.nodes()[0].contentDocument:document,u=d.getElementById(e);void 0===(r=u.parentElement.offsetWidth)&&(r=1200),void 0!==a.useWidth&&(r=a.useWidth);let h=n.db.getTasks(),m=[];for(let t of h)m.push(t.type);m=function(t){let e={},i=[];for(let n=0,s=t.length;n<s;++n)Object.prototype.hasOwnProperty.call(e,t[n])||(e[t[n]]=!0,i.push(t[n]));return i;}(m);let k={},p=2*a.topPadding;if("compact"===n.db.getDisplayMode()||"compact"===a.displayMode){let t={};for(let e of h)void 0===t[e.section]?t[e.section]=[e]:t[e.section].push(e);let e=0;for(let i of Object.keys(t)){let n=X(t[i],e)+1;e+=n,p+=n*(a.barHeight+a.barGap),k[i]=n;}}else for(let t of(p+=h.length*(a.barHeight+a.barGap),m))k[t]=h.filter(e=>e.type===t).length;u.setAttribute("viewBox","0 0 "+r+" "+p);let g=o.select(`[id="${e}"]`),b=(0,y.scaleTime)().domain([(0,y.min)(h,function(t){return t.startTime;}),(0,y.max)(h,function(t){return t.endTime;})]).rangeRound([0,r-a.leftPadding-a.rightPadding]);h.sort(function(t,e){let i=t.startTime,n=e.startTime,s=0;return i>n?s=1:i<n&&(s=-1),s;}),function(t,i,s){let r=a.barHeight,l=r+a.barGap,o=a.topPadding,u=a.leftPadding;(0,y.scaleLinear)().domain([0,m.length]).range(["#00B9FA","#F95002"]).interpolate(y.interpolateHcl),function(t,e,i,s,r,l,o,d){let u,h;if(0===o.length&&0===d.length)return;for(let{startTime:t,endTime:e}of l)(void 0===u||t<u)&&(u=t),(void 0===h||e>h)&&(h=e);if(!u||!h)return;if((0,c.default)(h).diff((0,c.default)(u),"year")>5){f.l.warn("The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days.");return;}let y=n.db.getDateFormat(),m=[],k=null,p=(0,c.default)(u);for(;p.valueOf()<=h;)n.db.isInvalidDate(p,y,o,d)?k?k.end=p:k={start:p,end:p}:k&&(m.push(k),k=null),p=p.add(1,"d");g.append("g").selectAll("rect").data(m).enter().append("rect").attr("id",function(t){return"exclude-"+t.start.format("YYYY-MM-DD");}).attr("x",function(t){return b(t.start)+i;}).attr("y",a.gridLineStartPadding).attr("width",function(t){return b(t.end.add(1,"day"))-b(t.start);}).attr("height",r-e-a.gridLineStartPadding).attr("transform-origin",function(e,n){return(b(e.start)+i+.5*(b(e.end)-b(e.start))).toString()+"px "+(n*t+.5*r).toString()+"px";}).attr("class","exclude-range");}(l,o,u,0,s,t,n.db.getExcludes(),n.db.getIncludes()),function(t,e,i,s){let r=(0,y.axisBottom)(b).tickSize(-s+e+a.gridLineStartPadding).tickFormat((0,y.timeFormat)(n.db.getAxisFormat()||a.axisFormat||"%Y-%m-%d")),l=/^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(n.db.getTickInterval()||a.tickInterval);if(null!==l){let t=l[1],e=l[2],i=n.db.getWeekday()||a.weekday;switch(e){case"millisecond":r.ticks(y.timeMillisecond.every(t));break;case"second":r.ticks(y.timeSecond.every(t));break;case"minute":r.ticks(y.timeMinute.every(t));break;case"hour":r.ticks(y.timeHour.every(t));break;case"day":r.ticks(y.timeDay.every(t));break;case"week":r.ticks(Q[i].every(t));break;case"month":r.ticks(y.timeMonth.every(t));}}if(g.append("g").attr("class","grid").attr("transform","translate("+t+", "+(s-50)+")").call(r).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10).attr("dy","1em"),n.db.topAxisEnabled()||a.topAxis){let i=(0,y.axisTop)(b).tickSize(-s+e+a.gridLineStartPadding).tickFormat((0,y.timeFormat)(n.db.getAxisFormat()||a.axisFormat||"%Y-%m-%d"));if(null!==l){let t=l[1],e=l[2],s=n.db.getWeekday()||a.weekday;switch(e){case"millisecond":i.ticks(y.timeMillisecond.every(t));break;case"second":i.ticks(y.timeSecond.every(t));break;case"minute":i.ticks(y.timeMinute.every(t));break;case"hour":i.ticks(y.timeHour.every(t));break;case"day":i.ticks(y.timeDay.every(t));break;case"week":i.ticks(Q[s].every(t));break;case"month":i.ticks(y.timeMonth.every(t));}}g.append("g").attr("class","grid").attr("transform","translate("+t+", "+e+")").call(i).selectAll("text").style("text-anchor","middle").attr("fill","#000").attr("stroke","none").attr("font-size",10);}}(u,o,0,s),function(t,i,s,r,l,o,c){let d=[...new Set(t.map(t=>t.order))].map(e=>t.find(t=>t.order===e));g.append("g").selectAll("rect").data(d).enter().append("rect").attr("x",0).attr("y",function(t,e){return t.order*i+s-2;}).attr("width",function(){return c-a.rightPadding/2;}).attr("height",i).attr("class",function(t){for(let[e,i]of m.entries())if(t.type===i)return"section section"+e%a.numberSectionStyles;return"section section0";});let u=g.append("g").selectAll("rect").data(t).enter(),h=n.db.getLinks();if(u.append("rect").attr("id",function(t){return t.id;}).attr("rx",3).attr("ry",3).attr("x",function(t){return t.milestone?b(t.startTime)+r+.5*(b(t.endTime)-b(t.startTime))-.5*l:b(t.startTime)+r;}).attr("y",function(t,e){return t.order*i+s;}).attr("width",function(t){return t.milestone?l:b(t.renderEndTime||t.endTime)-b(t.startTime);}).attr("height",l).attr("transform-origin",function(t,e){return e=t.order,(b(t.startTime)+r+.5*(b(t.endTime)-b(t.startTime))).toString()+"px "+(e*i+s+.5*l).toString()+"px";}).attr("class",function(t){let e="";t.classes.length>0&&(e=t.classes.join(" "));let i=0;for(let[e,n]of m.entries())t.type===n&&(i=e%a.numberSectionStyles);let n="";return t.active?t.crit?n+=" activeCrit":n=" active":t.done?n=t.crit?" doneCrit":" done":t.crit&&(n+=" crit"),0===n.length&&(n=" task"),t.milestone&&(n=" milestone "+n),"task"+(n+=i+" "+e);}),u.append("text").attr("id",function(t){return t.id+"-text";}).text(function(t){return t.task;}).attr("font-size",a.fontSize).attr("x",function(t){let e=b(t.startTime),i=b(t.renderEndTime||t.endTime);t.milestone&&(e+=.5*(b(t.endTime)-b(t.startTime))-.5*l),t.milestone&&(i=e+l);let n=this.getBBox().width;return n>i-e?i+n+1.5*a.leftPadding>c?e+r-5:i+r+5:(i-e)/2+e+r;}).attr("y",function(t,e){return t.order*i+a.barHeight/2+(a.fontSize/2-2)+s;}).attr("text-height",l).attr("class",function(t){let e=b(t.startTime),i=b(t.endTime);t.milestone&&(i=e+l);let n=this.getBBox().width,s="";t.classes.length>0&&(s=t.classes.join(" "));let r=0;for(let[e,i]of m.entries())t.type===i&&(r=e%a.numberSectionStyles);let o="";return(t.active&&(o=t.crit?"activeCritText"+r:"activeText"+r),t.done?o=t.crit?o+" doneCritText"+r:o+" doneText"+r:t.crit&&(o=o+" critText"+r),t.milestone&&(o+=" milestoneText"),n>i-e)?i+n+1.5*a.leftPadding>c?s+" taskTextOutsideLeft taskTextOutside"+r+" "+o:s+" taskTextOutsideRight taskTextOutside"+r+" "+o+" width-"+n:s+" taskText taskText"+r+" "+o+" width-"+n;}),"sandbox"===(0,f.c)().securityLevel){let t=(0,y.select)("#i"+e).nodes()[0].contentDocument;u.filter(function(t){return void 0!==h[t.id];}).each(function(e){var i=t.querySelector("#"+e.id),n=t.querySelector("#"+e.id+"-text");let s=i.parentNode;var r=t.createElement("a");r.setAttribute("xlink:href",h[e.id]),r.setAttribute("target","_top"),s.appendChild(r),r.appendChild(i),r.appendChild(n);});}}(t,l,o,u,r,0,i),function(t,e){let i=0,n=Object.keys(k).map(t=>[t,k[t]]);g.append("g").selectAll("text").data(n).enter().append(function(t){let e=t[0].split(f.e.lineBreakRegex),i=-(e.length-1)/2,n=d.createElementNS("http://www.w3.org/2000/svg","text");for(let[t,s]of(n.setAttribute("dy",i+"em"),e.entries())){let e=d.createElementNS("http://www.w3.org/2000/svg","tspan");e.setAttribute("alignment-baseline","central"),e.setAttribute("x","10"),t>0&&e.setAttribute("dy","1em"),e.textContent=s,n.appendChild(e);}return n;}).attr("x",10).attr("y",function(s,r){if(!(r>0))return s[1]*t/2+e;for(let a=0;a<r;a++)return i+=n[r-1][1],s[1]*t/2+i*t+e;}).attr("font-size",a.sectionFontSize).attr("class",function(t){for(let[e,i]of m.entries())if(t[0]===i)return"sectionTitle sectionTitle"+e%a.numberSectionStyles;return"sectionTitle";});}(l,o),function(t,e,i,s){let r=n.db.getTodayMarker();if("off"===r)return;let l=g.append("g").attr("class","today"),o=new Date,c=l.append("line");c.attr("x1",b(o)+t).attr("x2",b(o)+t).attr("y1",a.titleTopMargin).attr("y2",s-a.titleTopMargin).attr("class","today"),""!==r&&c.attr("style",r.replace(/,/g,";"));}(u,0,0,s);}(h,r,p),(0,f.i)(g,p,r,a.useMaxWidth),g.append("text").text(n.db.getDiagramTitle()).attr("x",r/2).attr("y",a.titleTopMargin).attr("class","titleText");}},styles:t=>`
  .mermaid-main-font {
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor||t.textColor};
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }
`};}}]);
//# sourceMappingURL=8d9696e1-async.eb233459.js.map