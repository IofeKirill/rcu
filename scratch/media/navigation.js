/* Read-only SVG overview: the real workspace is never serialized/reloaded. */
(function(root){
'use strict';
root.RoboNavigation=function(ws,B){
    const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
    const button=$('toggleMap'),panel=$('projectMap'),svg=$('mapSvg');let open=false,queued=false,drag=false,view,watchId,lastViewport='',lastWatch=0;
    function position(){
        const zoom=ws.zoomControls_,width=$('workspace').clientWidth||1000,height=$('workspace').clientHeight||650;
        const left=Math.max(6,Math.min(width-42,(zoom?.left_||0)+Math.max(zoom?.WIDTH_||180,zoom?.svgGroup_?.getBBox?.().width||0)+9));
        button.style.left=left+'px';button.style.top=Math.max(6,Math.min(height-42,zoom?.top_??height-48))+'px';
        panel.style.left=Math.max(6,Math.min(width-286,left-242))+'px';
        panel.style.bottom=(height-parseFloat(button.style.top)+8)+'px';
    }
    function update(){
        queued=false;position();if(!open)return;
        lastViewport=[ws.scrollX,ws.scrollY,ws.scale,$('workspace').clientWidth,$('workspace').clientHeight].join(',');
        const bbox=ws.getBlocksBoundingBox(),m=ws.getMetrics(),scale=ws.scale;
        const visible={x:m.viewLeft/scale,y:m.viewTop/scale,width:Math.max(1,m.viewWidth/scale),height:Math.max(1,m.viewHeight/scale)};
        const x=Math.min(bbox.x,visible.x)-14,y=Math.min(bbox.y,visible.y)-14;
        const right=Math.max(bbox.x+bbox.width,visible.x+visible.width)+14,bottom=Math.max(bbox.y+bbox.height,visible.y+visible.height)+14;
        view={x,y,width:Math.max(40,right-x),height:Math.max(40,bottom-y)};
        svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);
        svg.replaceChildren();
        const clone=ws.getCanvas().cloneNode(true);clone.removeAttribute('transform');clone.setAttribute('pointer-events','none');
        // Remove DOM ids in the preview so fields keep addressing the real blocks.
        clone.removeAttribute('id');for(const el of clone.querySelectorAll('[id]'))el.removeAttribute('id');
        svg.appendChild(clone);
        const frame=document.createElementNS(ns,'rect');
        for(const [key,value]of Object.entries(visible))frame.setAttribute(key,value);
        frame.setAttribute('class','mapViewport');frame.setAttribute('vector-effect','non-scaling-stroke');frame.setAttribute('pointer-events','none');svg.appendChild(frame);
    }
    function request(){if(queued)return;queued=true;requestAnimationFrame(update);}
    function watch(now){
        if(!open)return;
        if(now-lastWatch>80){lastWatch=now;const stamp=[ws.scrollX,ws.scrollY,ws.scale,$('workspace').clientWidth,$('workspace').clientHeight].join(',');if(stamp!==lastViewport)update();}
        watchId=requestAnimationFrame(watch);
    }
    function toggle(value=!open){open=!!value;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));button.classList.toggle('active',open);cancelAnimationFrame(watchId);if(open){update();watchId=requestAnimationFrame(watch);}}

    function center(x,y){const m=ws.getMetrics();B.hideChaff();ws.scrollbar.set(x*ws.scale-m.contentLeft-m.viewWidth/2,y*ws.scale-m.contentTop-m.viewHeight/2);request();}
    function locate(e){
        if(!view)return;const r=svg.getBoundingClientRect();
        const scale=Math.min(r.width/view.width,r.height/view.height);if(!scale)return;
        center(view.x+(e.clientX-r.left-(r.width-view.width*scale)/2)/scale,view.y+(e.clientY-r.top-(r.height-view.height*scale)/2)/scale);
    }
    svg.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();drag=true;svg.setPointerCapture?.(e.pointerId);locate(e);};
    svg.onpointermove=e=>{if(drag)locate(e);};svg.onpointerup=()=>drag=false;svg.onpointercancel=()=>drag=false;
    button.onclick=()=>toggle();$('closeMap').onclick=()=>toggle(false);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)toggle(false);});
    document.addEventListener('zmrobo-layout',request);ws.addChangeListener(request);
    new ResizeObserver(request).observe($('workspace'));
    position();return {toggle,update,center,get open(){return open;}};
};
})(globalThis);
