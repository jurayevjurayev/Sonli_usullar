const $=id=>document.getElementById(id), views=["home","methods","calculator"];
function show(id){views.forEach(v=>$(v).hidden=v!==id);scrollTo({top:0,behavior:"smooth"})}
$("topic").onclick=()=>show("methods");$("euler").onclick=()=>show("calculator");
document.querySelectorAll("[data-back]").forEach(b=>b.onclick=()=>show(b.dataset.back));
$("solve").onclick=solve;$("again").onclick=()=>{$("results").hidden=true;scrollTo({top:0,behavior:"smooth"})};
const fmt=v=>{if(Math.abs(v)<1e-13)v=0;return Number(v).toFixed(8).replace(/\.?0+$/,"")};
const sub=n=>String(n).replace(/\d/g,d=>"₀₁₂₃₄₅₆₇₈₉"[+d]);
function showSubstitution(fn,x,y){
 const expr=String(fn).trim().replace(/\^/g,"**");
 return expr.replace(/(^|[^A-Za-z0-9_])(x|y)(?=$|[^A-Za-z0-9_])/g,(m,prefix,name)=>prefix+(name==="x"?fmt(x):fmt(y)));
}
async function solve(){
 $("error").hidden=true;$("solve").disabled=true;$("solve").textContent="Hisoblanmoqda...";
 try{
  const body={function:$("func").value,x0:$("x0").value,y0:$("y0").value,a:$("a").value,b:$("b").value,h:$("h").value};
  if(!body.function.trim()||["x0","y0","a","b","h"].some(k=>$(k).value.trim()===""))throw Error("Iltimos, tenglama va barcha parametrlarni kiriting.");
  const r=await fetch("/api/euler",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||"Hisoblashda xatolik.");
  render(d);$("results").hidden=false;$("results").scrollIntoView({behavior:"smooth"});
 }catch(e){$("error").textContent=e.message;$("error").hidden=false}
 finally{$("solve").disabled=false;$("solve").innerHTML='Hisoblashni boshlash <span>↗</span>'}
}
function render(d){
 $("summary").innerHTML=[`y′ = ${d.function}`,`x₀ = ${fmt(d.x0)}`,`y₀ = ${fmt(d.y0)}`,`[${fmt(d.a)}; ${fmt(d.b)}]`,`h = ${fmt(d.h)}`,`n = ${d.n}`].map(v=>`<span>${v.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}</span>`).join("");
 $("ftext").textContent=`f(x,y) = ${d.function}`;$("initial").textContent=`y(${fmt(d.x0)}) = ${fmt(d.y0)}`;$("interval").textContent=`[a;b] = [${fmt(d.a)}; ${fmt(d.b)}], h = ${fmt(d.h)}, n = (${fmt(d.b)} − ${fmt(d.a)}) / ${fmt(d.h)} = ${d.n}`;$("ff").textContent=d.function;
 $("steps").innerHTML=d.rows.slice(0,-1).map(s=>`<article class="step"><div class="step-head">${s.i+1}-qadam <span>i = ${s.i}</span></div><div class="math">x${sub(s.i+1)} = x${sub(s.i)} + h = ${fmt(s.x)} + ${fmt(d.h)} = <b>${fmt(s.x+d.h)}</b><br>f(x${sub(s.i)},y${sub(s.i)}) = f(${fmt(s.x)}, ${fmt(s.y)}) = ${showSubstitution(d.function,s.x,s.y)} = ${fmt(s.f)}<br>y${sub(s.i+1)} = y${sub(s.i)} + h · f(x${sub(s.i)},y${sub(s.i)})<br>= ${fmt(s.y)} + ${fmt(d.h)} × ${fmt(s.f)} = <b>${fmt(s.next_y)}</b></div><p>Izoh: joriy nuqtadagi hosila qiymati qadam uzunligiga ko‘paytiriladi va joriy y qiymatiga qo‘shiladi.</p></article>`).join("");
 $("table").innerHTML=d.rows.map(r=>`<tr><td>${r.i}</td><td>${fmt(r.x)}</td><td>${fmt(r.y)}</td></tr>`).join("");$("final").textContent=`y(${fmt(d.b)}) ≈ ${fmt(d.result)}`;draw(d.rows);
}
function draw(rows){
 const c=$("graph"),w=Math.max(280,c.clientWidth),h=300,dpr=devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;const g=c.getContext("2d");g.setTransform(dpr,0,0,dpr,0,0);
 const p={l:49,r:15,t:18,b:35};let xmin=rows[0].x,xmax=rows.at(-1).x,ys=rows.map(r=>r.y),ymin=Math.min(...ys),ymax=Math.max(...ys);if(ymin===ymax){ymin-=1;ymax+=1}let pad=(ymax-ymin)*.12;ymin-=pad;ymax+=pad;
 const X=x=>p.l+(x-xmin)/(xmax-xmin||1)*(w-p.l-p.r),Y=y=>h-p.b-(y-ymin)/(ymax-ymin)*(h-p.t-p.b);
 g.clearRect(0,0,w,h);g.font="10px sans-serif";g.fillStyle="#8792a5";g.strokeStyle="#e9edf3";
 for(let i=0;i<=4;i++){let yy=p.t+i*(h-p.t-p.b)/4;g.beginPath();g.moveTo(p.l,yy);g.lineTo(w-p.r,yy);g.stroke();g.fillText((ymax-i*(ymax-ymin)/4).toFixed(3),3,yy+3);let xx=p.l+i*(w-p.l-p.r)/4;g.beginPath();g.moveTo(xx,p.t);g.lineTo(xx,h-p.b);g.stroke();g.fillText((xmin+i*(xmax-xmin)/4).toFixed(2),xx-10,h-12)}
 g.strokeStyle="#4368e8";g.lineWidth=2.5;g.beginPath();rows.forEach((r,i)=>i?g.lineTo(X(r.x),Y(r.y)):g.moveTo(X(r.x),Y(r.y)));g.stroke();
 rows.forEach(r=>{g.beginPath();g.arc(X(r.x),Y(r.y),4,0,2*Math.PI);g.fillStyle="#4368e8";g.fill()});
}
