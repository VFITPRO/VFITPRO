/* VFIT PRO V53 universal visual fallback.
   Keeps stable exercise identity; only fills visual fields that have no premium asset. */
(() => {
  'use strict';
  if (typeof exerciseCatalog === 'undefined') return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=svg=>'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  const lower=s=>String(s||'').toLowerCase();
  const eqOf=ex=>String(ex?.equipment||'').split('·')[0].trim()||'Otro';
  const metaFor=(key,ex)=>window.VFITCatalogV49?.get?.(key)||{name:ex?.name,primary:ex?.primary,secondary:ex?.secondary,equipment:eqOf(ex),pose:'base',category:''};

  function zones(primary){
    const p=lower(primary),front=[],back=[];
    const f=(x,y,rx,ry)=>front.push([x,y,rx,ry]);
    const b=(x,y,rx,ry)=>back.push([x,y,rx,ry]);
    if(/pectoral/.test(p)){f(72,75,18,12);f(108,75,18,12);}
    else if(/deltoides posterior/.test(p)){b(61,69,11,10);b(119,69,11,10);}
    else if(/deltoides|hombro/.test(p)){f(58,70,11,10);f(122,70,11,10);}
    else if(/dorsal ancho/.test(p)){b(67,104,16,28);b(113,104,16,28);}
    else if(/espalda|rombo|dorsal medio|dorsal superior/.test(p)){b(90,95,28,22);}
    else if(/erector|cadena posterior/.test(p)){b(90,112,9,39);b(72,194,12,30);b(108,194,12,30);}
    else if(/trapecio/.test(p)){b(90,68,24,16);}
    else if(/bíceps|biceps/.test(p)){f(50,112,8,22);f(130,112,8,22);}
    else if(/tríceps|triceps/.test(p)){b(49,112,8,22);b(131,112,8,22);}
    else if(/braquial|braquiorradial/.test(p)){f(47,128,8,19);f(133,128,8,19);}
    else if(/antebrazo|agarre/.test(p)){f(40,148,7,24);f(140,148,7,24);}
    else if(/oblicuo/.test(p)){f(72,129,8,29);f(108,129,8,29);}
    else if(/abdominal inferior/.test(p)){f(90,148,17,19);}
    else if(/abdominal|core/.test(p)){f(90,124,18,42);}
    else if(/flexor.*cadera/.test(p)){f(75,166,10,16);f(105,166,10,16);}
    else if(/glúteo medio|gluteo medio/.test(p)){b(68,174,14,15);b(112,174,14,15);}
    else if(/glúte|glute/.test(p)){b(75,184,16,18);b(105,184,16,18);}
    else if(/isquio|femoral/.test(p)){b(72,222,12,31);b(108,222,12,31);}
    else if(/cuádriceps|cuadriceps/.test(p)){f(72,220,13,32);f(108,220,13,32);}
    else if(/aductor/.test(p)){f(82,216,9,31);f(98,216,9,31);}
    else if(/gastro|gemelo/.test(p)){b(72,270,10,26);b(108,270,10,26);}
    else if(/sóleo|soleo/.test(p)){b(72,278,9,19);b(108,278,9,19);}
    else {f(90,125,18,22);}
    return {front,back};
  }
  const highlights=arr=>arr.map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#hot)" filter="url(#glow)"/>`).join('');
  function body(which,x,scale=1){
    const mirror=which==='back';
    return `<g transform="translate(${x} 14) scale(${scale})">
      <ellipse cx="90" cy="34" rx="15" ry="18" fill="url(#skin)"/>
      <path d="M68 57 Q90 45 112 57 L119 141 Q109 159 106 181 L112 305 H94 L90 193 L86 305 H68 L74 181 Q71 159 61 141Z" fill="url(#skin)" stroke="#cbd3db" stroke-opacity=".25"/>
      <path d="M66 67 L37 143 L50 150 L78 91 M114 67 L143 143 L130 150 L102 91" fill="none" stroke="url(#skin)" stroke-width="13" stroke-linecap="round"/>
      ${mirror?'<path d="M73 72 Q90 63 107 72 M76 95 Q90 104 104 95 M76 119 Q90 128 104 119" fill="none" stroke="#56616d" stroke-width="2" opacity=".55"/>':'<path d="M71 76 Q90 66 109 76 M79 103 L101 103 M81 120 L99 120 M82 137 L98 137" fill="none" stroke="#59636d" stroke-width="2" opacity=".5"/>'}
      <path d="M74 181 L59 242 L62 305 M106 181 L121 242 L118 305" fill="none" stroke="#7f8993" stroke-width="12" stroke-linecap="round"/>
    </g>`;
  }
  function anatomySvg(ex){
    const z=zones(ex.primary),name=esc(ex.primary||'Grupo principal');
    return data(`<svg xmlns="http://www.w3.org/2000/svg" width="620" height="720" viewBox="0 0 620 720">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111a24"/><stop offset="1" stop-color="#05080d"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c2c8ce"/><stop offset=".55" stop-color="#858f99"/><stop offset="1" stop-color="#5f6872"/></linearGradient><radialGradient id="hot"><stop stop-color="#ffb13d"/><stop offset=".45" stop-color="#ff8610"/><stop offset="1" stop-color="#ff4b16"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="2.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="620" height="720" rx="34" fill="url(#bg)"/><g opacity=".5"><rect x="40" y="0" width="8" height="720" fill="#ff8610"/><rect x="548" y="0" width="5" height="720" fill="#ff8610"/><path d="M0 575 H620 M0 620 H620" stroke="#243342"/><path d="M130 50 V575 M490 70 V575" stroke="#172431" stroke-width="16"/></g>
      <g transform="translate(82 84) scale(1.38)">${body('front',0,.96)}<g transform="translate(0 14) scale(.96)">${highlights(z.front)}</g></g>
      <g transform="translate(318 84) scale(1.38)">${body('back',0,.96)}<g transform="translate(0 14) scale(.96)">${highlights(z.back)}</g></g>
      <rect x="26" y="24" width="116" height="34" rx="17" fill="#ff8610"/><text x="84" y="46" text-anchor="middle" fill="#111" font-family="Arial,sans-serif" font-size="15" font-weight="900">VFIT PRO</text>
      <text x="310" y="653" text-anchor="middle" fill="#ffad2e" font-family="Arial,sans-serif" font-size="24" font-weight="900" textLength="540" lengthAdjust="spacingAndGlyphs">${name}</text><text x="310" y="686" text-anchor="middle" fill="#aebbc9" font-family="Arial,sans-serif" font-size="15">Músculo principal trabajado</text>
    </svg>`);
  }

  function poseName(ex,meta){
    const n=lower(ex.name),p=lower(meta?.pose);
    if(/dominada/.test(n))return'pullup'; if(/jalón|jalon/.test(n))return'pulldown'; if(/remo/.test(n))return'row'; if(/pullover/.test(n))return'pullover';
    if(/press.*homb|press militar|arnold/.test(n))return'shoulderpress'; if(/elevación lateral|elevacion lateral/.test(n))return'lateralraise'; if(/elevación frontal|elevacion frontal/.test(n))return'frontraise'; if(/face pull|pájaros|pajaros|apertura posterior|pec deck inverso/.test(n))return'reardelt';
    if(/curl/.test(n))return'curl'; if(/tríceps|triceps|press francés|press frances|jm press/.test(n))return/overhead|sobre cabeza/.test(n)?'overheadtri':'triceps';
    if(/sentadilla|sissy|belt squat/.test(n))return'squat'; if(/prensa/.test(n))return'legpress'; if(/zancada|búlgara|bulgara|step-up/.test(n))return'lunge'; if(/peso muerto|buenos días|buenos dias|rack pull|pull-through|swing|hiperextensión|hiperextension/.test(n))return'hinge';
    if(/hip thrust|puente|frog pump/.test(n))return'hipthrust'; if(/curl femoral|nórdico|nordico/.test(n))return'legcurl'; if(/extensión.*cuádriceps|extension.*cuadriceps/.test(n))return'legextension'; if(/abducción|aducción|abduccion|aduccion/.test(n))return'hipmachine'; if(/gemelo|calf/.test(n))return'calf';
    if(/crunch|sit-up/.test(n))return'crunch'; if(/elevación.*pierna|elevacion.*pierna|elevación.*rodilla|elevacion.*rodilla/.test(n))return'legraise'; if(/plancha|dead bug|bird dog|rueda abdominal/.test(n))return'plank'; if(/woodchop|russian|pallof/.test(n))return'rotate'; if(/encogimiento/.test(n))return'shrug'; if(/farmer|pinza/.test(n))return'carry';
    if(/apertura|cruce de polea|pec deck/.test(n))return'fly'; if(/fondo/.test(n))return'dip'; if(/flexion/.test(n))return'plank'; if(/press/.test(n))return'press';
    return p&&p!=='base'?p:'stand';
  }
  function joints(pose){
    const j={h:[215,64],n:[215,88],hip:[215,208],le:[174,124],re:[256,124],lh:[160,174],rh:[270,174],lk:[188,265],rk:[242,265],lf:[180,324],rf:[250,324]};
    const s=(k,x,y)=>j[k]=[x,y];
    if(['press','fly'].includes(pose)){s('h',145,120);s('n',166,128);s('hip',254,190);s('le',175,145);s('re',218,149);s('lh',151,106);s('rh',236,110);s('lk',300,232);s('rk',310,246);s('lf',337,280);s('rf',345,294);}
    else if(pose==='dip'){s('h',210,82);s('n',215,103);s('hip',225,202);s('le',174,130);s('re',254,130);s('lh',165,183);s('rh',265,183);s('lk',210,263);s('rk',242,267);s('lf',210,323);s('rf',248,325);}
    else if(pose==='row'){s('h',176,108);s('n',191,123);s('hip',242,205);s('le',182,154);s('re',218,158);s('lh',184,202);s('rh',226,202);}
    else if(['pulldown','pullup'].includes(pose)){s('le',172,110);s('re',258,110);s('lh',148,67);s('rh',282,67);}
    else if(pose==='pullover'){s('h',143,122);s('n',164,128);s('hip',252,194);s('le',178,122);s('re',204,127);s('lh',151,83);s('rh',180,86);s('lk',294,236);s('rk',306,244);s('lf',330,280);s('rf',340,289);}
    else if(pose==='shoulderpress'){s('le',178,112);s('re',252,112);s('lh',178,70);s('rh',252,70);}
    else if(pose==='lateralraise'){s('le',176,112);s('re',254,112);s('lh',123,102);s('rh',307,102);}
    else if(pose==='frontraise'){s('le',184,130);s('re',246,130);s('lh',174,92);s('rh',256,92);}
    else if(pose==='reardelt'){s('h',188,98);s('n',201,115);s('hip',236,207);s('le',176,139);s('re',244,139);s('lh',131,128);s('rh',289,128);}
    else if(['curl','triceps','overheadtri'].includes(pose)){s('le',178,127);s('re',252,127);s('lh',184,94);s('rh',246,94);if(pose==='overheadtri'){s('lh',195,64);s('rh',235,64);}}
    else if(pose==='squat'){s('hip',215,213);s('lk',179,260);s('rk',251,260);s('lf',160,315);s('rf',270,315);}
    else if(pose==='legpress'){s('h',151,112);s('n',172,122);s('hip',245,190);s('lk',287,225);s('rk',298,244);s('lf',337,198);s('rf',347,216);}
    else if(pose==='lunge'){s('hip',216,208);s('lk',180,264);s('rk',265,284);s('lf',161,326);s('rf',303,323);}
    else if(pose==='hinge'){s('h',176,110);s('n',190,126);s('hip',244,204);s('le',181,153);s('re',218,160);s('lh',180,211);s('rh',226,211);}
    else if(pose==='hipthrust'){s('h',141,185);s('n',163,188);s('hip',244,197);s('le',176,189);s('re',217,192);s('lh',172,218);s('rh',217,221);s('lk',285,244);s('rk',295,255);s('lf',321,302);s('rf',332,310);}
    else if(pose==='legcurl'){s('h',140,184);s('n',162,186);s('hip',244,198);s('lk',295,209);s('rk',300,218);s('lf',278,253);s('rf',285,260);}
    else if(pose==='legextension'){s('lk',188,265);s('rk',242,265);s('lf',151,260);s('rf',279,260);}
    else if(pose==='hipmachine'){s('h',215,73);s('n',215,96);s('hip',215,206);s('lk',169,255);s('rk',261,255);s('lf',160,320);s('rf',270,320);}
    else if(pose==='crunch'){s('h',169,146);s('n',190,151);s('hip',240,207);s('le',173,162);s('re',225,164);s('lh',160,138);s('rh',232,140);s('lk',281,252);s('rk',290,264);s('lf',315,309);s('rf',324,316);}
    else if(pose==='legraise'){s('h',151,159);s('n',172,163);s('hip',246,200);s('lk',282,163);s('rk',287,175);s('lf',314,122);s('rf',322,136);}
    else if(pose==='plank'){s('h',122,190);s('n',146,194);s('hip',246,216);s('le',168,211);s('re',174,217);s('lh',148,249);s('rh',151,257);s('lk',318,225);s('rk',322,234);s('lf',367,229);s('rf',370,240);}
    else if(pose==='rotate'){s('le',181,131);s('re',248,131);s('lh',148,113);s('rh',281,147);}
    else if(pose==='carry'){s('lh',165,205);s('rh',265,205);}
    return j;
  }
  const line=(a,b,j,w=18)=>`<line x1="${j[a][0]}" y1="${j[a][1]}" x2="${j[b][0]}" y2="${j[b][1]}" stroke="#aeb7c0" stroke-width="${w}" stroke-linecap="round"/>`;
  function equipment(ex,pose,j){
    const e=lower(eqOf(ex)),n=lower(ex.name);let s='';
    if(/barra|smith/.test(e)||/peso muerto|sentadilla/.test(n)){const y=Math.min(j.lh[1],j.rh[1])-4;s+=`<line x1="${j.lh[0]-45}" y1="${y}" x2="${j.rh[0]+45}" y2="${y}" stroke="#444e58" stroke-width="8"/><circle cx="${j.lh[0]-50}" cy="${y}" r="18" fill="#1b232b" stroke="#ff8610"/><circle cx="${j.rh[0]+50}" cy="${y}" r="18" fill="#1b232b" stroke="#ff8610"/>`;}
    if(/mancuer/.test(e)){for(const k of ['lh','rh'])s+=`<g transform="translate(${j[k][0]} ${j[k][1]})"><rect x="-16" y="-4" width="32" height="8" rx="4" fill="#4d5964"/><circle cx="-18" cy="0" r="9" fill="#202932"/><circle cx="18" cy="0" r="9" fill="#202932"/></g>`;}
    if(/polea/.test(e)){s+=`<rect x="42" y="34" width="22" height="268" rx="8" fill="#111a23" stroke="#394957"/><circle cx="53" cy="65" r="8" fill="#ff8610"/><line x1="53" y1="65" x2="${j.lh[0]}" y2="${j.lh[1]}" stroke="#7d8994" stroke-width="2"/>`;}
    if(/máquina|maquina/.test(e)||pose==='hipmachine'||pose==='legpress'){s+=`<path d="M70 290 V82 Q70 58 94 58 H116 M70 245 H140 M325 294 V92" fill="none" stroke="#1d2934" stroke-width="18"/><path d="M74 290 V82 M326 294 V92" stroke="#ff8610" stroke-width="3" opacity=".85"/>`;}
    if(['press','fly','pullover','hipthrust','legcurl','legextension','crunch'].includes(pose)||/banco/.test(e)){s+=`<rect x="120" y="205" width="170" height="18" rx="9" fill="#1b242d"/><rect x="142" y="220" width="12" height="74" fill="#252f39"/><rect x="260" y="220" width="12" height="74" fill="#252f39"/>`;}
    if(['pullup','pulldown'].includes(pose))s+=`<line x1="125" y1="45" x2="305" y2="45" stroke="#47525d" stroke-width="9"/>`;
    return s;
  }
  function miniAnatomy(ex){
    const z=zones(ex.primary);return `<g transform="translate(382 30) scale(.72)">${body('front',0,.88)}<g transform="translate(0 14) scale(.88)">${highlights(z.front)}</g></g><g transform="translate(462 30) scale(.72)">${body('back',0,.88)}<g transform="translate(0 14) scale(.88)">${highlights(z.back)}</g></g>`;
  }
  function exerciseSvg(ex,key){
    const meta=metaFor(key,ex),pose=poseName(ex,meta),j=joints(pose),name=esc(ex.name),equip=esc(eqOf(ex));
    const figure=`<g filter="url(#shadow)">${line('n','hip',j,30)}${line('n','le',j,18)}${line('le','lh',j,14)}${line('n','re',j,18)}${line('re','rh',j,14)}${line('hip','lk',j,20)}${line('lk','lf',j,16)}${line('hip','rk',j,20)}${line('rk','rf',j,16)}<ellipse cx="${j.h[0]}" cy="${j.h[1]}" rx="20" ry="23" fill="#b7bec5"/><ellipse cx="${j.n[0]}" cy="${j.n[1]+48}" rx="35" ry="55" fill="#929ca6" opacity=".86"/></g>`;
    return data(`<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="700" viewBox="0 0 560 350"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111a24"/><stop offset="1" stop-color="#05080d"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c2c8ce"/><stop offset=".55" stop-color="#858f99"/><stop offset="1" stop-color="#5f6872"/></linearGradient><radialGradient id="hot"><stop stop-color="#ffb13d"/><stop offset=".45" stop-color="#ff8610"/><stop offset="1" stop-color="#ff4b16"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity=".55"/></filter></defs><rect width="560" height="350" rx="24" fill="url(#bg)"/><g opacity=".7"><rect x="20" width="5" height="350" fill="#ff8610"/><rect x="342" width="4" height="350" fill="#ff8610"/><path d="M0 298 H560" stroke="#273746"/><path d="M86 36 V298 M330 50 V298" stroke="#14202b" stroke-width="12"/></g>${equipment(ex,pose,j)}${figure}${miniAnatomy(ex)}<rect x="16" y="16" width="92" height="26" rx="13" fill="#ff8610"/><text x="62" y="34" text-anchor="middle" fill="#111" font-family="Arial,sans-serif" font-size="12" font-weight="900">VFIT PRO</text><rect x="14" y="294" width="532" height="42" rx="12" fill="#060a0f" opacity=".92"/><text x="28" y="318" fill="#fff" font-family="Arial,sans-serif" font-size="17" font-weight="900" textLength="360" lengthAdjust="spacingAndGlyphs">${name}</text><text x="535" y="318" text-anchor="end" fill="#ffad2e" font-family="Arial,sans-serif" font-size="11">${equip}</text></svg>`);
  }

  function apply(){
    let art=0,anatomy=0;
    for(const [key,ex] of exerciseCatalog){
      if(!ex||String(key).startsWith('assets/custom-exercise.svg#custom-'))continue;
      if(!ex.premiumArt){ex.thumb=exerciseSvg(ex,key);ex.universalArt=true;art++;}
      if(!ex.premiumAnatomy){ex.anatomy=anatomySvg(ex);ex.universalAnatomy=true;anatomy++;}
    }
    if(Array.isArray(routines))for(const day of routines)for(const ex of (day?.ex||[])){
      const src=exerciseCatalog.get(ex.image);if(!src)continue;
      if(!ex.premiumArt&&src.thumb){ex.thumb=src.thumb;ex.universalArt=!!src.universalArt;}
      if(!ex.premiumAnatomy&&src.anatomy){ex.anatomy=src.anatomy;ex.universalAnatomy=!!src.universalAnatomy;}
    }
    if(typeof renderDays==='function')renderDays();
    if(window.VFITLibraryV49?.renderCatalog)window.VFITLibraryV49.renderCatalog();
    return {art,anatomy,total:exerciseCatalog.size};
  }
  const result=apply();
  window.VFITUniversalArtV53={...result,refresh:apply,exerciseSvg,anatomySvg};
})();