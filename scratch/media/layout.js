/* Pane preferences are separate from the robot program. */
(function(root){
'use strict';
root.RoboLayout = function(ws, B, vscode) {
    const $ = id => document.getElementById(id), clamp = (v,min,max) => Math.max(min,Math.min(max,v));
    let saved = {};
    try { saved = vscode?.getState?.()?.layout || JSON.parse(localStorage.getItem('zmrobo-blocks-layout') || '{}'); } catch {}
    const prefs = {category:180,palette:320,code:330,...saved,python:false,dark:saved.defaultsVersion===2&&typeof saved.dark==='boolean'?saved.dark:true,defaultsVersion:2};
    for(const key of ['category','palette','code']) if(!Number.isFinite(prefs[key])) prefs[key] = key === 'category' ? 180 : 330;
    function save(){try{if(vscode?.setState) vscode.setState({...vscode.getState?.(),layout:prefs});else localStorage.setItem('zmrobo-blocks-layout',JSON.stringify(prefs));}catch{}}
    const toolbox = ws.getToolbox(), flyout = ws.getFlyout();
    const iconRoot=new URL('.',document.querySelector('link[rel=stylesheet]').href);
    function updateControlImages(){
        for(const icon of ws.zoomControls_?.svgGroup_?.querySelectorAll('image')||[]) {
            const href=icon.getAttributeNS('http://www.w3.org/1999/xlink','href')||icon.getAttribute('href')||'';
            const name=href.split('/').pop();if(!/^zoom-[\w-]+\.svg$/.test(name))continue;
            const target=new URL((prefs.dark?'controls-dark/':'vendor/robocode-media/')+name,iconRoot).href;
            if(href!==target)icon.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',target);
        }
    }
    if(ws.zoomControls_?.svgGroup_)new MutationObserver(updateControlImages).observe(ws.zoomControls_.svgGroup_,{attributes:true,subtree:true});
    let paletteExpanded=false,hovered=false,collapseTimer;
    function fullPaletteWidth(){
        const blocks=flyout.getWorkspace().getTopBlocks(false),scale=flyout.getWorkspace().scale;
        const natural=Math.max(prefs.palette,...blocks.map(b=>(b.getRelativeToSurfaceXY().x+b.getHeightWidth().width)*scale+38).filter(Number.isFinite));
        const rect=$('workspace').getBoundingClientRect();
        const available=Math.max(prefs.palette,(window.innerWidth||1600)-rect.left-prefs.category-12);
        return Math.min(natural,available);
    }
    flyout.getWidth = () => paletteExpanded ? fullPaletteWidth() : prefs.palette;
    function refreshFlyout(){flyout.position();flyout.setMetrics_?.({});}
    function expandPalette(value){paletteExpanded=!!value;document.body.classList.toggle('palette-expanded',paletteExpanded);refreshFlyout();}
    function collapseLater(){
        clearTimeout(collapseTimer);
        collapseTimer=setTimeout(()=>{
            if(hovered)return;
            if(ws.isDragging?.()||B.DropDownDiv.isVisible?.()||B.WidgetDiv.isVisible?.()){collapseLater();return;}
            expandPalette(false);
        },160);
    }
    flyout.svgGroup_.addEventListener('pointerenter',()=>{hovered=true;clearTimeout(collapseTimer);expandPalette(true);});
    flyout.svgGroup_.addEventListener('pointerleave',()=>{hovered=false;collapseLater();});
    flyout.getWorkspace().addChangeListener(()=>{if(paletteExpanded)refreshFlyout();});
    flyout.position = function() {
        if(!this.isVisible()) return;
        const m = this.targetWorkspace_.getMetrics(); if(!m) return;
        this.width_ = this.getWidth(); this.height_ = Math.max(0,m.viewHeight);
        this.setBackgroundPath_(this.width_,this.height_);
        this.svgGroup_.setAttribute('width',this.width_); this.svgGroup_.setAttribute('height',this.height_);
        B.utils.setCssTransform(this.svgGroup_,`translate(${prefs.category}px,0px)`);
        if(this.scrollbar_){this.scrollbar_.setOrigin(prefs.category,0);this.scrollbar_.resize();}
        this.svgGroup_.style.opacity=1;
    };
    function apply(){
        prefs.category=clamp(prefs.category,130,300); prefs.palette=clamp(prefs.palette,200,800);prefs.code=clamp(prefs.code,200,900);
        document.documentElement.style.setProperty('--category-width',prefs.category+'px');
        document.documentElement.style.setProperty('--palette-width',prefs.palette+'px');
        document.documentElement.style.setProperty('--code-width',prefs.code+'px');
        document.body.classList.toggle('python-hidden',!prefs.python);
        document.body.classList.toggle('dark',!!prefs.dark);
        updateControlImages();
        $('codePane').hidden=!prefs.python; $('codeResize').hidden=!prefs.python;
        $('toggleCode').classList.toggle('active',prefs.python);$('toggleCode').setAttribute('aria-pressed',String(prefs.python));
        $('toggleTheme').textContent=prefs.dark ? 'Светлая тема' : 'Тёмная тема';
        toolbox.width=prefs.category+prefs.palette;
        toolbox.HtmlDiv.style.width=prefs.category+'px';
        $('categoryResize').style.left=(prefs.category-3)+'px';
        $('paletteResize').style.left=(prefs.category+prefs.palette-3)+'px';
        const colours = prefs.dark ? {workspace:'#252735',flyout:'#2c2f3c',toolbox:'#222430',toolboxText:'#e3e4ed',scrollbar:'#62677e'} : {workspace:'#f5f6ff',flyout:'#ffffff',toolbox:'#ffffff',toolboxText:'#575e75',scrollbar:'#c6c4d2'};
        Object.assign(B.Colours,colours);
        const pattern=ws.grid_?.gridPattern_;
        if(pattern) for(const line of pattern.querySelectorAll('line'))line.setAttribute('stroke',prefs.dark?'#393d51':'#dce0fa');
        B.svgResize(ws); refreshFlyout(); ws.resizeContents?.();
        document.dispatchEvent(new Event('zmrobo-layout'));
    }
    function handle(id,key,direction=1){
        const el=$(id);let drag;
        el.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();ws.cancelCurrentGesture?.();drag={x:e.clientX,width:prefs[key]};el.setPointerCapture?.(e.pointerId);document.body.classList.add('resizing');};
        el.onpointermove=e=>{if(!drag)return;prefs[key]=drag.width+direction*(e.clientX-drag.x);apply();};
        function done(){if(!drag)return;drag=null;document.body.classList.remove('resizing');save();}
        el.onpointerup=done;el.onpointercancel=done;el.onlostpointercapture=done;
        el.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();prefs[key]+=(e.key==='ArrowRight'?16:-16)*direction;apply();save();};
    }
    handle('categoryResize','category');handle('paletteResize','palette');handle('codeResize','code',-1);
    function togglePython(){prefs.python=!prefs.python;apply();save();}
    $('toggleCode').onclick=togglePython;$('closeCode').onclick=()=>{prefs.python=false;apply();save();};
    $('toggleTheme').onclick=()=>{prefs.dark=!prefs.dark;apply();save();};
    apply();
    return {apply,prefs,expandPalette,get paletteExpanded(){return paletteExpanded;},fullPaletteWidth};
};
})(globalThis);
