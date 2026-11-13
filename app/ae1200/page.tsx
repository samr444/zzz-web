'use client';

import { useRef, useState, useEffect, useCallback, type ChangeEvent } from 'react';
import './ae1200.css';

/* ── Canvas size ─────────────────────────────────────────────────────── */
const W = 1000;
const H = 918;

/* ── SVG → canvas scaling ────────────────────────────────────────────── */
const SVG_W = 32.627518;
const SVG_H = 29.950005;
const sx = (x: number) => x * (W / SVG_W);
const sy = (y: number) => y * (H / SVG_H);

/* ── Faceplate canvas bounds ─────────────────────────────────────────── */
const FP_LEFT   = sx(1.0);
const FP_RIGHT  = sx(31.627518);
const FP_TOP    = sy(1.0);
const FP_BOTTOM = sy(28.950005);
const FP_W      = FP_RIGHT  - FP_LEFT;
const FP_H      = FP_BOTTOM - FP_TOP;
const FP_CX     = (FP_LEFT + FP_RIGHT)  / 2;
const FP_CY     = (FP_TOP  + FP_BOTTOM) / 2;

/* ── Faceplate SVG paths (from casio-royale-faceplate-outline.svg) ───── */

const OUTER: [number,number][] = [
  [31.205124,23.085320],[30.903824,22.784019],[31.141205,20.745964],[31.513611,20.498848],
  [31.627518,14.975075],[31.523376,9.451103],[31.141205,9.222237],[30.951202,7.158096],
  [31.218933,6.890366],[31.053970,5.370781],[30.784134,5.285660],[30.592285,5.077682],
  [30.529190,4.801865],[30.611511,4.531166],[30.817505,4.337189],[30.247803,2.994507],
  [29.369370,1.830170],[28.369186,1.000000],[4.258331,1.000000],[3.258148,1.830170],
  [2.379707,2.994507],[1.810005,4.337189],[1.573540,5.370781],[1.408577,6.890366],
  [1.676315,7.158096],[1.486305,9.222237],[1.104141,9.451103],[1.000000,14.975075],
  [1.113892,20.498848],[1.486305,20.745964],[1.723686,22.784019],[1.422394,23.085320],
  [1.744232,25.048149],[2.104164,26.310890],[2.742859,27.458107],[3.626587,28.429207],
  [4.324554,28.950005],[28.302963,28.950005],[29.000916,28.429207],[29.884644,27.458107],
  [30.523346,26.310890],[30.883286,25.048149],
];
const DISP1: [number,number][] = [          // large lower display  → Time
  [4.663757,19.090004],[5.163757,18.590004],[13.638535,18.590004],[14.067467,18.493340],
  [14.413475,18.222038],[16.202904,16.027977],[16.548920,15.756676],[16.977844,15.659996],
  [27.943756,15.659996],[28.443756,16.160011],[28.443756,24.459999],[27.443756,25.459999],
  [5.663757,25.459999],[4.663757,24.459999],
];
const DISP2: [number,number][] = [          // right middle rect    → Map
  [28.443756,13.990005],[28.443756,9.030006],[27.943756,8.530006],[17.763763,8.530006],
  [17.263763,9.030006],[17.263763,13.990005],[17.763763,14.490005],[27.943756,14.490005],
];
const DISP3: [number,number][] = [          // analog dial polygon  → Circle
  [9.713760,5.550003],[11.540154,5.749924],[12.748695,6.331932],[13.732002,7.244301],
  [14.402687,8.405968],[14.701172,9.713715],[14.600937,11.051346],[14.110870,12.300003],
  [13.274536,13.348740],[12.166237,14.104362],[10.884445,14.499741],[9.713760,14.550003],
  [9.043068,14.499741],[7.761276,14.104362],[6.652977,13.348740],[5.816643,12.300003],
  [5.326584,11.051346],[5.226341,9.713715],[5.524826,8.405968],[6.195511,7.244301],
  [7.178818,6.331932],[8.387360,5.749924],
];
const DISP4: [number,number][] = [          // top right thin bar   → Thin
  [17.263763,6.850006],[17.263763,5.270004],[17.763763,4.770004],[27.943756,4.770004],
  [28.443756,5.270004],[28.443756,6.850006],[27.943756,7.350006],[17.763763,7.350006],
];

/* ── Window definitions ──────────────────────────────────────────────── */

type WindowId = 'circle' | 'thin' | 'map' | 'time';

const WINDOWS: { id: WindowId; num: number; label: string; pts: [number,number][] }[] = [
  { id: 'circle', num: 1, label: 'Circle', pts: DISP3 },
  { id: 'thin',   num: 2, label: 'Thin',   pts: DISP4 },
  { id: 'map',    num: 3, label: 'Map',     pts: DISP2 },
  { id: 'time',   num: 4, label: 'Time',    pts: DISP1 },
];

const WIN_COLORS: Record<WindowId, string> = {
  circle: '#f59e0b',
  thin:   '#10b981',
  map:    '#3b82f6',
  time:   '#a855f7',
};

/** Compute bounding box (in canvas px) from a polygon point list. */
function computeBounds(pts: [number,number][]) {
  const xs = pts.map(p => sx(p[0]));
  const ys = pts.map(p => sy(p[1]));
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs)-x, h: Math.max(...ys)-y };
}

const WIN_BOUNDS: Record<WindowId, {x:number;y:number;w:number;h:number}> = {
  circle: computeBounds(DISP3),
  thin:   computeBounds(DISP4),
  map:    computeBounds(DISP2),
  time:   computeBounds(DISP1),
};

/* ── Canvas path helpers ─────────────────────────────────────────────── */

function addPoly(ctx: CanvasRenderingContext2D, pts: [number,number][]) {
  if (!pts.length) return;
  ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
  for (let i=1; i<pts.length; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
  ctx.closePath();
}

function beginOuter(ctx: CanvasRenderingContext2D) {
  ctx.beginPath(); addPoly(ctx, OUTER);
}

function drawBezelMask(ctx: CanvasRenderingContext2D, showOutline: boolean) {
  ctx.beginPath();
  addPoly(ctx,OUTER); addPoly(ctx,DISP1); addPoly(ctx,DISP2); addPoly(ctx,DISP3); addPoly(ctx,DISP4);
  ctx.fillStyle = '#1c1c1e';
  ctx.fill('evenodd');

  if (!showOutline) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.8; ctx.lineJoin='round'; ctx.lineCap='round';
  for (const pts of [OUTER,DISP1,DISP2,DISP3,DISP4]) {
    ctx.beginPath(); addPoly(ctx, pts); ctx.stroke();
  }
  const corners:[number,number,number,number][]=[
    [sx(OUTER[17][0]),sy(OUTER[17][1]),-1,-1],
    [sx(OUTER[18][0]),sy(OUTER[18][1]), 1,-1],
    [sx(OUTER[36][0]),sy(OUTER[36][1]),-1, 1],
    [sx(OUTER[37][0]),sy(OUTER[37][1]), 1, 1],
  ];
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5;
  const g=6, m=22;
  for (const [cx,cy,dx,dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx+dx*g,cy); ctx.lineTo(cx+dx*(g+m),cy);
    ctx.moveTo(cx,cy+dy*g); ctx.lineTo(cx,cy+dy*(g+m));
    ctx.stroke();
  }
  ctx.restore();
}

/* ── Gradient helpers ────────────────────────────────────────────────── */

const FACEPLATE_MM = 32.627518;
const BG_COLOR     = '#ede9e2';

type GradStyle = 'mesh'|'linear'|'radial';

function hexRgb(hex:string):[number,number,number]{
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
}
function drawMeshGradient(
  ctx:CanvasRenderingContext2D,
  colors:[string,string,string,string],
  positions:[[number,number],[number,number],[number,number],[number,number]],
){
  ctx.save();
  ctx.fillStyle='#000'; ctx.globalCompositeOperation='source-over'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){
    const[cx,cy]=positions[i],[r,g,b]=hexRgb(colors[i]);
    const grad=ctx.createRadialGradient(cx*W,cy*H,0,cx*W,cy*H,Math.hypot(W,H));
    grad.addColorStop(0,`rgb(${r},${g},${b})`);
    grad.addColorStop(0.4,`rgba(${r},${g},${b},0.4)`);
    grad.addColorStop(1,`rgba(${r},${g},${b},0)`);
    ctx.globalCompositeOperation=i===0?'source-over':'screen';
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  }
  ctx.restore();
}
function drawLinearGradient(ctx:CanvasRenderingContext2D,start:string,end:string,angle:number,blend:number){
  const rad=(angle*Math.PI)/180,cx=W/2,cy=H/2;
  const len=(Math.abs(Math.cos(rad))*W+Math.abs(Math.sin(rad))*H)/2;
  const g=ctx.createLinearGradient(cx-Math.cos(rad)*len,cy-Math.sin(rad)*len,cx+Math.cos(rad)*len,cy+Math.sin(rad)*len);
  g.addColorStop(0,start); g.addColorStop(blend/100,end); g.addColorStop(1,end);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function drawRadialGradient(ctx:CanvasRenderingContext2D,start:string,end:string,blend:number){
  const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.hypot(W,H)/2);
  g.addColorStop(0,start); g.addColorStop(blend/100,end); g.addColorStop(1,end);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}

/* ── Types ───────────────────────────────────────────────────────────── */

// --- Method 1: Canvas layers ---
interface ImageLayer {
  id:string; kind:'image'; name:string;
  img:HTMLImageElement;
  x:number; y:number; scale:number; opacity:number;
  imageFit:'fill'|'fit';
}
interface GradientLayer {
  id:string; kind:'gradient'; name:string;
  x:number; y:number; scale:number; opacity:number;
  style:GradStyle;
  meshColors:[string,string,string,string];
  meshPos:[[number,number],[number,number],[number,number],[number,number]];
  startColor:string; endColor:string; angle:number; blend:number;
}
type Layer = ImageLayer | GradientLayer;

function drawCanvasLayer(ctx:CanvasRenderingContext2D, layer:Layer){
  ctx.save(); ctx.globalAlpha=layer.opacity;
  if(layer.kind==='image'){
    const{img,imageFit,scale,x,y}=layer;
    let iw:number,ih:number;
    if(imageFit==='fill'){
      const base=Math.max(FP_W/img.naturalWidth,FP_H/img.naturalHeight);
      iw=img.naturalWidth*base*scale; ih=img.naturalHeight*base*scale;
    } else {
      iw=img.naturalWidth*scale; ih=img.naturalHeight*scale;
    }
    ctx.drawImage(img,x-iw/2,y-ih/2,iw,ih);
  } else if(layer.style==='mesh'){
    drawMeshGradient(ctx,layer.meshColors,layer.meshPos);
  } else if(layer.style==='linear'){
    drawLinearGradient(ctx,layer.startColor,layer.endColor,layer.angle,layer.blend);
  } else {
    drawRadialGradient(ctx,layer.startColor,layer.endColor,layer.blend);
  }
  ctx.restore();
}

// --- Method 2: Per-window ---
interface WinLayer {
  img: HTMLImageElement|null;
  fit: 'fill'|'fit';
  scale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
}
type WinLayers = Record<WindowId, WinLayer>;

function defaultWin(): WinLayer {
  return { img:null, fit:'fill', scale:1, opacity:1, offsetX:0, offsetY:0 };
}

function drawWindowLayer(
  ctx: CanvasRenderingContext2D,
  winId: WindowId,
  wl: WinLayer,
  pts: [number,number][],
) {
  if (!wl.img) return;
  const b = WIN_BOUNDS[winId];
  ctx.save();
  ctx.globalAlpha = wl.opacity;
  ctx.beginPath(); addPoly(ctx, pts); ctx.clip();

  const imgW = wl.img.naturalWidth;
  const imgH = wl.img.naturalHeight;
  let baseScale: number;
  if (wl.fit === 'fill') {
    baseScale = Math.max(b.w / imgW, b.h / imgH) * wl.scale;
  } else {
    baseScale = Math.min(b.w / imgW, b.h / imgH) * wl.scale;
  }
  const iw = imgW * baseScale;
  const ih = imgH * baseScale;
  // centre in bounding box, then apply offset as fraction of bounding box size
  const ix = b.x + (b.w - iw) / 2 + wl.offsetX * b.w;
  const iy = b.y + (b.h - ih) / 2 + wl.offsetY * b.h;
  ctx.drawImage(wl.img, ix, iy, iw, ih);
  ctx.restore();
}

/* ── Component ───────────────────────────────────────────────────────── */

let _uid = 1;
const uid = () => String(_uid++);

export default function AE1200Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Method tab
  const [method, setMethod] = useState<'canvas'|'perwindow'>('canvas');

  // Method 1 state
  const [layers,       setLayers]       = useState<Layer[]>([]);
  const [selectedId,   setSelectedId]   = useState<string|null>(null);
  const [gradPanelOpen,setGradPanelOpen]= useState(false);
  const [gradStyle,  setGradStyle]  = useState<GradStyle>('mesh');
  const [meshColors, setMeshColors] = useState<[string,string,string,string]>(['#4e56cf','#54c792','#ee5946','#f4ce55']);
  const [meshPos] = useState<[[number,number],[number,number],[number,number],[number,number]]>([
    [0.1,0.1],[0.9,0.1],[0.1,0.9],[0.9,0.9],
  ]);
  const [linStart,setLinStart]=useState('#165b66');
  const [linEnd,  setLinEnd]  =useState('#e2b66f');
  const [angle,   setAngle]   =useState(45);
  const [blend,   setBlend]   =useState(70);

  // Method 2 state
  const [winLayers, setWinLayers] = useState<WinLayers>({
    circle: defaultWin(), thin: defaultWin(), map: defaultWin(), time: defaultWin(),
  });
  const [activeWin, setActiveWin] = useState<WindowId>('circle');

  // Shared state
  const [showOutline,      setShowOutline]      = useState(true);
  const [highlightedWindow,setHighlightedWindow]= useState<WindowId|null>(null);
  const [measuredMm,       setMeasuredMm]       = useState(28.73);

  const dragRef = useRef<{id:string;sx:number;sy:number;ox:number;oy:number}|null>(null);

  const selected      = layers.find(l => l.id===selectedId)??null;
  const selectedImage = selected?.kind==='image' ? selected : null;

  /* ── Render ─────────────────────────────────────────────────────────── */

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = BG_COLOR; ctx.fillRect(0,0,W,H);

    ctx.save();
    beginOuter(ctx); ctx.clip();

    if (method === 'canvas') {
      // Method 1 — global layers
      for (const layer of layers) drawCanvasLayer(ctx, layer);
    } else {
      // Method 2 — per-window
      for (const win of WINDOWS) {
        drawWindowLayer(ctx, win.id, winLayers[win.id], win.pts);
      }
    }

    ctx.restore();

    // Bezel always on top
    drawBezelMask(ctx, showOutline);

    // Window highlight
    if (highlightedWindow) {
      const win = WINDOWS.find(w => w.id===highlightedWindow)!;
      ctx.save();
      ctx.beginPath(); addPoly(ctx, win.pts);
      ctx.strokeStyle = WIN_COLORS[highlightedWindow];
      ctx.lineWidth=3; ctx.setLineDash([]); ctx.stroke();
      const xs=win.pts.map(p=>sx(p[0])), ys=win.pts.map(p=>sy(p[1]));
      const cx=(Math.min(...xs)+Math.max(...xs))/2;
      const cy=(Math.min(...ys)+Math.max(...ys))/2;
      ctx.fillStyle=WIN_COLORS[highlightedWindow];
      ctx.font='bold 22px Manrope,Inter,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(`${win.num} · ${win.label}`,cx,cy);
      ctx.restore();
    }

    // Selection box (Method 1)
    if (method==='canvas' && selectedImage) {
      const{img,imageFit,scale,x,y}=selectedImage;
      let iw:number,ih:number;
      if(imageFit==='fill'){const base=Math.max(FP_W/img.naturalWidth,FP_H/img.naturalHeight);iw=img.naturalWidth*base*scale;ih=img.naturalHeight*base*scale;}
      else{iw=img.naturalWidth*scale;ih=img.naturalHeight*scale;}
      ctx.save(); ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2; ctx.setLineDash([8,4]);
      ctx.strokeRect(x-iw/2,y-ih/2,iw,ih); ctx.restore();
    }

    // Active window bounding box (Method 2)
    if (method==='perwindow') {
      const b = WIN_BOUNDS[activeWin];
      const win = WINDOWS.find(w=>w.id===activeWin)!;
      ctx.save();
      ctx.strokeStyle=WIN_COLORS[activeWin]; ctx.lineWidth=2.5; ctx.setLineDash([6,3]);
      ctx.beginPath(); addPoly(ctx, win.pts); ctx.stroke();
      ctx.restore();
    }
  }, [method, layers, winLayers, selectedImage, showOutline, highlightedWindow, activeWin]);

  useEffect(()=>{ render(); },[render]);

  // Sync gradient controls
  useEffect(()=>{
    const layer=layers.find(l=>l.id===selectedId);
    if(layer?.kind==='gradient'){
      setGradStyle(layer.style);
      setMeshColors([...layer.meshColors] as [string,string,string,string]);
      setLinStart(layer.startColor); setLinEnd(layer.endColor);
      setAngle(layer.angle); setBlend(layer.blend);
      setGradPanelOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedId]);

  const patchGrad = useCallback((patch:Partial<GradientLayer>)=>{
    setLayers(prev=>prev.map(l=>l.id===selectedId&&l.kind==='gradient'?{...l,...patch}as Layer:l));
  },[selectedId]);

  /* ── Method 1: handlers ──────────────────────────────────────────────── */

  const handleUpload = (e:ChangeEvent<HTMLInputElement>)=>{
    Array.from(e.target.files??[]).forEach(file=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        const scale=Math.min(1,FP_W/img.naturalWidth,FP_H/img.naturalHeight);
        const layer:ImageLayer={id:uid(),kind:'image',name:file.name,img,x:FP_CX,y:FP_CY,scale,opacity:1,imageFit:'fit'};
        setLayers(prev=>[...prev,layer]); setSelectedId(layer.id);
      };
      img.src=url;
    });
    e.target.value='';
  };

  const addGradient=()=>{
    const layer:GradientLayer={
      id:uid(),kind:'gradient',name:`Gradient ${_uid}`,
      x:FP_CX,y:FP_CY,scale:1,opacity:1,
      style:gradStyle,
      meshColors:[...meshColors] as [string,string,string,string],
      meshPos:meshPos.map(p=>[...p]) as [[number,number],[number,number],[number,number],[number,number]],
      startColor:linStart,endColor:linEnd,angle,blend,
    };
    setLayers(prev=>[...prev,layer]); setSelectedId(layer.id); setGradPanelOpen(true);
  };

  const setImageFit=(fit:'fill'|'fit')=>{
    if(!selectedImage) return;
    const scale=fit==='fill'?1:Math.min(1,FP_W/selectedImage.img.naturalWidth,FP_H/selectedImage.img.naturalHeight);
    setLayers(prev=>prev.map(l=>l.id===selectedId?{...l,imageFit:fit,scale,x:FP_CX,y:FP_CY}as Layer:l));
  };

  const resetTexture=()=>{
    if(!selectedImage) return;
    const scale=Math.min(1,FP_W/selectedImage.img.naturalWidth,FP_H/selectedImage.img.naturalHeight);
    setLayers(prev=>prev.map(l=>l.id===selectedId?{...l,imageFit:'fit',scale,opacity:1,x:FP_CX,y:FP_CY}as Layer:l));
  };

  const toCanvas=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const r=canvasRef.current!.getBoundingClientRect();
    return{x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
  };

  const onMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(method!=='canvas') return;
    const{x,y}=toCanvas(e);
    for(let i=layers.length-1;i>=0;i--){
      const l=layers[i]; if(l.kind!=='image') continue;
      let iw:number,ih:number;
      if(l.imageFit==='fill'){const base=Math.max(FP_W/l.img.naturalWidth,FP_H/l.img.naturalHeight);iw=l.img.naturalWidth*base*l.scale;ih=l.img.naturalHeight*base*l.scale;}
      else{iw=l.img.naturalWidth*l.scale;ih=l.img.naturalHeight*l.scale;}
      if(x>=l.x-iw/2&&x<=l.x+iw/2&&y>=l.y-ih/2&&y<=l.y+ih/2){
        setSelectedId(l.id); dragRef.current={id:l.id,sx:x,sy:y,ox:l.x,oy:l.y}; e.preventDefault(); return;
      }
    }
    setSelectedId(null);
  };

  const onMouseMove=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!dragRef.current) return;
    const{x,y}=toCanvas(e); const d=dragRef.current;
    setLayers(prev=>prev.map(l=>l.id===d.id?{...l,x:d.ox+(x-d.sx),y:d.oy+(y-d.sy)}:l));
  };

  const onMouseUp=()=>{ dragRef.current=null; };

  const deleteSelected=()=>{ if(!selectedId) return; setLayers(prev=>prev.filter(l=>l.id!==selectedId)); setSelectedId(null); };
  const moveLayer=(dir:1|-1)=>{
    if(!selectedId) return;
    setLayers(prev=>{
      const i=prev.findIndex(l=>l.id===selectedId);
      if(i+dir<0||i+dir>=prev.length) return prev;
      const next=[...prev]; [next[i],next[i+dir]]=[next[i+dir],next[i]]; return next;
    });
  };
  const centerLayer=()=>{ if(!selectedId) return; setLayers(prev=>prev.map(l=>l.id===selectedId?{...l,x:FP_CX,y:FP_CY}:l)); };
  const resetView=()=>{
    if(!selectedImage) return;
    const scale=Math.min(1,FP_W/selectedImage.img.naturalWidth,FP_H/selectedImage.img.naturalHeight);
    setLayers(prev=>prev.map(l=>l.id===selectedId?{...l,scale,x:FP_CX,y:FP_CY}as Layer:l));
  };
  const patch=(updates:Partial<Layer>)=>{ if(!selectedId) return; setLayers(prev=>prev.map(l=>l.id===selectedId?{...l,...updates}as Layer:l)); };

  /* ── Method 2: handlers ──────────────────────────────────────────────── */

  const handleWinUpload=(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      setWinLayers(prev=>({...prev,[activeWin]:{...prev[activeWin],img}}));
    };
    img.src=url;
    e.target.value='';
  };

  const patchWin=(id:WindowId, patch:Partial<WinLayer>)=>{
    setWinLayers(prev=>({...prev,[id]:{...prev[id],...patch}}));
  };

  const resetWin=(id:WindowId)=>{
    setWinLayers(prev=>({...prev,[id]:defaultWin()}));
  };

  /* ── Export ──────────────────────────────────────────────────────────── */

  const renderClean=useCallback((withOutline:boolean):string=>{
    const off=document.createElement('canvas'); off.width=W; off.height=H;
    const ctx=off.getContext('2d')!;
    ctx.fillStyle=BG_COLOR; ctx.fillRect(0,0,W,H);
    ctx.save(); beginOuter(ctx); ctx.clip();
    if(method==='canvas'){
      for(const layer of layers) drawCanvasLayer(ctx,layer);
    } else {
      for(const win of WINDOWS) drawWindowLayer(ctx,win.id,winLayers[win.id],win.pts);
    }
    ctx.restore();
    if(withOutline){
      ctx.save(); ctx.strokeStyle='#000'; ctx.lineWidth=1.8; ctx.lineJoin='round'; ctx.lineCap='round';
      for(const pts of [OUTER,DISP1,DISP2,DISP3,DISP4]){ctx.beginPath();addPoly(ctx,pts);ctx.stroke();}
      ctx.restore();
    }
    return off.toDataURL('image/png');
  },[method,layers,winLayers]);

  const downloadPng=()=>{ const a=document.createElement('a'); a.href=renderClean(showOutline); a.download='ae1200-faceplate.png'; a.click(); };

  const printDesign=()=>{
    const dataUrl=renderClean(showOutline);
    const scaleFactor=20/measuredMm;
    const widthMm=(FACEPLATE_MM*scaleFactor).toFixed(2);
    const win=window.open('','_blank'); if(!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>AE-1200 Faceplate</title>
<style>@page{margin:10mm}body{margin:0}img{width:${widthMm}mm;height:auto;display:block}</style>
</head><body><img src="${dataUrl}">
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);
    win.document.close();
  };

  const printCalibration=()=>{
    const lineMm=(20*20/measuredMm).toFixed(2);
    const win=window.open('','_blank'); if(!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Calibration</title>
<style>@page{margin:15mm}body{font-family:sans-serif;font-size:10pt}
.line{width:${lineMm}mm;height:1px;background:#000;margin:6mm 0}p{color:#555}</style></head><body>
<p style="color:#000">AE-1200 calibration — this line should measure <strong>20 mm</strong>.</p>
<div class="line"></div>
<p>Measure it, then enter the result under Print sizing.</p>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);
    win.document.close();
  };

  /* ── Derived values ──────────────────────────────────────────────────── */

  const scaleVal   = selected?.scale   ?? 1;
  const opacityVal = selected?.opacity ?? 1;
  const currentFit = selectedImage?.imageFit ?? 'fit';
  const aw = winLayers[activeWin];

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="ae-page">
      <header className="ae-header">
        <h1 className="ae-title">AE-1200 Faceplate Customizer</h1>
        <span className="ae-badge">Private tool</span>
      </header>

      <div className="ae-designer">

        {/* ── Stage ── */}
        <div className="ae-stage-col">
          <div className="ae-watch-stage">
            <canvas
              ref={canvasRef} width={W} height={H} className="ae-canvas"
              style={{ cursor: dragRef.current?'grabbing':'default' }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            />
          </div>
          <div className="ae-stage-actions">
            <label className="ae-outline-toggle">
              <input type="checkbox" checked={showOutline} onChange={e=>setShowOutline(e.target.checked)}/>
              Include faceplate outline
            </label>
            <button className="ae-btn" onClick={printDesign}>Print faceplate</button>
            <button className="ae-btn ae-btn--ghost" onClick={downloadPng}>Download PNG</button>
            <button className="ae-btn ae-btn--ghost" onClick={printCalibration}>Print calibration test</button>
          </div>
        </div>

        {/* ── Controls ── */}
        <aside className="ae-controls">

          {/* Method tabs */}
          <div className="ae-tab-bar">
            <button
              className={`ae-tab${method==='canvas'?' ae-tab--active':''}`}
              onClick={()=>setMethod('canvas')}
            >Canvas Layers</button>
            <button
              className={`ae-tab${method==='perwindow'?' ae-tab--active':''}`}
              onClick={()=>setMethod('perwindow')}
            >Per Window</button>
          </div>

          {/* ══════════════ METHOD 1: CANVAS ══════════════ */}
          {method==='canvas' && (<>

            {/* Add artwork */}
            <div className="ae-section">
              <div className="ae-section-head">
                <h2>Add artwork</h2>
                <button className="ae-text-btn" onClick={resetView}>Reset view</button>
              </div>
              <label className="ae-upload-btn" htmlFor="img-upload">＋ Choose image files</label>
              <input id="img-upload" type="file" accept="image/*,.svg" multiple onChange={handleUpload}/>
              <p className="ae-helper">PNG, JPG, WebP, GIF or SVG. Files stay in your browser.</p>
            </div>

            {/* Add gradient */}
            <div className="ae-section">
              <h2>Add Gradient</h2>
              <button className="ae-small-btn ae-full" onClick={addGradient}>＋ Add gradient</button>
              {gradPanelOpen&&(
                <div className="ae-grad-controls">
                  <label htmlFor="grad-type">Style</label>
                  <select id="grad-type" value={gradStyle} onChange={e=>{const s=e.target.value as GradStyle;setGradStyle(s);patchGrad({style:s});}}>
                    <option value="mesh">Four-corner colour blend</option>
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                  {gradStyle==='mesh'&&(
                    <div className="ae-grad-colors">
                      {(['Color 1','Color 2','Color 3','Color 4'] as const).map((label,i)=>(
                        <label key={i} className="ae-color-label">{label}
                          <input type="color" value={meshColors[i]} onChange={e=>{const next=[...meshColors] as [string,string,string,string];next[i]=e.target.value;setMeshColors(next);patchGrad({meshColors:next});}}/>
                        </label>
                      ))}
                    </div>
                  )}
                  {(gradStyle==='linear'||gradStyle==='radial')&&(
                    <div className="ae-grad-colors">
                      <label className="ae-color-label">Start<input type="color" value={linStart} onChange={e=>{setLinStart(e.target.value);patchGrad({startColor:e.target.value});}}/></label>
                      <label className="ae-color-label">End<input type="color" value={linEnd} onChange={e=>{setLinEnd(e.target.value);patchGrad({endColor:e.target.value});}}/></label>
                    </div>
                  )}
                  {gradStyle==='linear'&&(
                    <div className="ae-range-group">
                      <label>Angle <output>{angle}°</output></label>
                      <input type="range" min={0} max={360} value={angle} onChange={e=>{setAngle(+e.target.value);patchGrad({angle:+e.target.value});}}/>
                    </div>
                  )}
                  {(gradStyle==='linear'||gradStyle==='radial')&&(
                    <div className="ae-range-group">
                      <label>Blend <output>{blend}%</output></label>
                      <input type="range" min={10} max={100} value={blend} onChange={e=>{setBlend(+e.target.value);patchGrad({blend:+e.target.value});}}/>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Layers */}
            <div className="ae-section">
              <div className="ae-section-head">
                <h2>Layers</h2>
                <button className="ae-text-btn ae-danger" onClick={deleteSelected} disabled={!selectedId}>Remove</button>
              </div>
              {layers.length===0
                ?<p className="ae-empty">Add an image to start building your faceplate.</p>
                :<ul className="ae-layers">
                  {[...layers].reverse().map(layer=>(
                    <li key={layer.id} className={`ae-layer-item${layer.id===selectedId?' ae-layer-item--sel':''}`} onClick={()=>setSelectedId(layer.id)}>
                      <span className="ae-layer-icon">{layer.kind==='image'?'▣':'◈'}</span>
                      <span className="ae-layer-name">{layer.name}</span>
                    </li>
                  ))}
                </ul>
              }
              <div className="ae-layer-btns">
                <button className="ae-small-btn" onClick={()=>moveLayer(1)}  disabled={!selectedId}>↑ Bring forward</button>
                <button className="ae-small-btn" onClick={()=>moveLayer(-1)} disabled={!selectedId}>↓ Send back</button>
              </div>
            </div>

            {/* Texture settings */}
            <div className="ae-section">
              <div className="ae-section-head">
                <h2>Texture Settings</h2>
                <button className="ae-text-btn" onClick={resetTexture} disabled={!selectedImage}>Reset all</button>
              </div>
              <div className="ae-fit-row">
                <span className="ae-fit-label">Image fit</span>
                <div className="ae-fit-toggle">
                  <button className={`ae-fit-btn${currentFit==='fill'?' ae-fit-btn--active':''}`} disabled={!selectedImage} onClick={()=>setImageFit('fill')}>Fill</button>
                  <button className={`ae-fit-btn${currentFit==='fit'?' ae-fit-btn--active':''}`}  disabled={!selectedImage} onClick={()=>setImageFit('fit')}>Fit</button>
                </div>
              </div>
              <div className="ae-range-group">
                <label>Size <output>{Math.round(scaleVal*100)}%</output></label>
                <input type="range" min={15} max={250} value={Math.round(scaleVal*100)} disabled={!selected} onChange={e=>patch({scale:+e.target.value/100})}/>
              </div>
              <div className="ae-range-group">
                <label>Opacity <output>{Math.round(opacityVal*100)}%</output></label>
                <input type="range" min={10} max={100} value={Math.round(opacityVal*100)} disabled={!selected} onChange={e=>patch({opacity:+e.target.value/100})}/>
              </div>
              <button className="ae-small-btn ae-full" onClick={centerLayer} disabled={!selected}>Center image</button>
            </div>

          </>)}

          {/* ══════════════ METHOD 2: PER WINDOW ══════════════ */}
          {method==='perwindow' && (<>

            {/* Window selector */}
            <div className="ae-section">
              <h2>Windows</h2>
              <p className="ae-windows-price">₹500 a window · ₹1,000 for all four in one colour</p>
              <ul className="ae-windows-list">
                {WINDOWS.map(w=>(
                  <li
                    key={w.id}
                    className={`ae-window-item${activeWin===w.id?' ae-window-item--active':''}`}
                    style={{'--win-color':WIN_COLORS[w.id]} as React.CSSProperties}
                    onClick={()=>setActiveWin(w.id)}
                  >
                    <span className="ae-win-num">{w.num}</span>
                    <span className="ae-win-dot">·</span>
                    <span className="ae-win-label">{w.label}</span>
                    {winLayers[w.id].img && <span className="ae-win-check">✓</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Per-window texture settings */}
            <div className="ae-section">
              <div className="ae-section-head">
                <h2 style={{color: WIN_COLORS[activeWin]}}>
                  {WINDOWS.find(w=>w.id===activeWin)?.num} · {WINDOWS.find(w=>w.id===activeWin)?.label}
                </h2>
                <button className="ae-text-btn ae-danger" onClick={()=>resetWin(activeWin)}>Reset</button>
              </div>

              {/* Upload for this window */}
              <label
                className={`ae-upload-btn${aw.img?' ae-upload-btn--has-image':''}`}
                htmlFor="win-upload"
              >
                {aw.img ? '⟳ Replace image' : '＋ Upload image'}
              </label>
              <input id="win-upload" type="file" accept="image/*,.svg" onChange={handleWinUpload}/>

              {/* Image fit */}
              <div className="ae-fit-row">
                <span className="ae-fit-label">Image fit</span>
                <div className="ae-fit-toggle">
                  <button className={`ae-fit-btn${aw.fit==='fill'?' ae-fit-btn--active':''}`} onClick={()=>patchWin(activeWin,{fit:'fill'})}>Fill</button>
                  <button className={`ae-fit-btn${aw.fit==='fit'?' ae-fit-btn--active':''}`}  onClick={()=>patchWin(activeWin,{fit:'fit'})}>Fit</button>
                </div>
              </div>

              {/* Scale */}
              <div className="ae-range-group">
                <label>Scale <output>{Math.round(aw.scale*100)}%</output></label>
                <input type="range" min={50} max={300} value={Math.round(aw.scale*100)} onChange={e=>patchWin(activeWin,{scale:+e.target.value/100})}/>
              </div>

              {/* Offset X */}
              <div className="ae-range-group">
                <label>Offset X <output>{aw.offsetX > 0 ? '+' : ''}{Math.round(aw.offsetX*100)}%</output></label>
                <input type="range" min={-50} max={50} value={Math.round(aw.offsetX*100)} onChange={e=>patchWin(activeWin,{offsetX:+e.target.value/100})}/>
              </div>

              {/* Offset Y */}
              <div className="ae-range-group">
                <label>Offset Y <output>{aw.offsetY > 0 ? '+' : ''}{Math.round(aw.offsetY*100)}%</output></label>
                <input type="range" min={-50} max={50} value={Math.round(aw.offsetY*100)} onChange={e=>patchWin(activeWin,{offsetY:+e.target.value/100})}/>
              </div>

              {/* Opacity */}
              <div className="ae-range-group">
                <label>Opacity <output>{Math.round(aw.opacity*100)}%</output></label>
                <input type="range" min={10} max={100} value={Math.round(aw.opacity*100)} onChange={e=>patchWin(activeWin,{opacity:+e.target.value/100})}/>
              </div>
            </div>

            {/* All windows overview */}
            <div className="ae-section">
              <h2>All windows</h2>
              <div className="ae-win-overview">
                {WINDOWS.map(w=>(
                  <div
                    key={w.id}
                    className={`ae-win-thumb${winLayers[w.id].img?' ae-win-thumb--has':''}`}
                    style={{'--win-color':WIN_COLORS[w.id]} as React.CSSProperties}
                    onClick={()=>setActiveWin(w.id)}
                  >
                    <span className="ae-win-thumb-num">{w.num}</span>
                    <span className="ae-win-thumb-label">{w.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </>)}

          {/* ── WINDOWS highlight (both methods) ── */}
          {method==='canvas' && (
            <div className="ae-section">
              <div className="ae-section-head">
                <h2>Windows</h2>
                {highlightedWindow&&<button className="ae-text-btn" onClick={()=>setHighlightedWindow(null)}>Clear</button>}
              </div>
              <p className="ae-windows-price">₹500 a window · ₹1,000 for all four in one colour</p>
              <ul className="ae-windows-list">
                {WINDOWS.map(w=>(
                  <li
                    key={w.id}
                    className={`ae-window-item${highlightedWindow===w.id?' ae-window-item--active':''}`}
                    style={{'--win-color':WIN_COLORS[w.id]} as React.CSSProperties}
                    onClick={()=>setHighlightedWindow(prev=>prev===w.id?null:w.id)}
                  >
                    <span className="ae-win-num">{w.num}</span>
                    <span className="ae-win-dot">·</span>
                    <span className="ae-win-label">{w.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Print sizing */}
          <details className="ae-section ae-details">
            <summary>Print sizing</summary>
            <div className="ae-print-sizing">
              <label htmlFor="measured-mm">Printed length of the 20 mm line</label>
              <div className="ae-mm-row">
                <input id="measured-mm" type="number" min={10} max={50} step={0.01} value={measuredMm} onChange={e=>setMeasuredMm(+e.target.value)}/>
                <span>mm</span>
              </div>
              <p className="ae-helper">Enter what the 20 mm line measured on a test print.</p>
            </div>
          </details>

        </aside>
      </div>
    </div>
  );
}
