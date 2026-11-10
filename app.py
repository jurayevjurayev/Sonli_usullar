from flask import Flask, render_template, request, jsonify
import ast, math, os

app = Flask(__name__)
FUNCS = {k:getattr(math,k) for k in ("sin","cos","tan","asin","acos","atan","exp","log","log10","sqrt")}
FUNCS["abs"] = abs
CONSTS = {"pi":math.pi,"e":math.e}

class Expr:
    def __init__(self,s):
        s=s.strip().replace("^","**")
        if not s or len(s)>160: raise ValueError("Funksiya 1–160 belgidan iborat bo‘lishi kerak.")
        try: self.tree=ast.parse(s,mode="eval")
        except SyntaxError: raise ValueError("Funksiya noto‘g‘ri yozilgan. Masalan: x+y yoki x**2-y.")
        self.check(self.tree)
    def check(self,n):
        allowed=(ast.Expression,ast.Constant,ast.Name,ast.BinOp,ast.UnaryOp,ast.Add,ast.Sub,ast.Mult,ast.Div,ast.Pow,ast.Mod,ast.UAdd,ast.USub,ast.Call,ast.Load)
        if not isinstance(n,allowed): raise ValueError("Ruxsat etilmagan amal yoki belgi.")
        if isinstance(n,ast.Name) and n.id not in {"x","y",*FUNCS,*CONSTS}: raise ValueError("Noma’lum belgi: "+n.id)
        if isinstance(n,ast.Constant) and (not isinstance(n.value,(int,float)) or isinstance(n.value,bool)): raise ValueError("Faqat sonlardan foydalaning.")
        if isinstance(n,ast.Call) and (not isinstance(n.func,ast.Name) or n.func.id not in FUNCS or len(n.args)!=1 or n.keywords): raise ValueError("Funksiya nomi yoki argumenti noto‘g‘ri.")
        for c in ast.iter_child_nodes(n): self.check(c)
    def ev(self,n,x,y):
        if isinstance(n,ast.Expression): return self.ev(n.body,x,y)
        if isinstance(n,ast.Constant): return float(n.value)
        if isinstance(n,ast.Name):
            if n.id=="x": return x
            if n.id=="y": return y
            if n.id in CONSTS: return CONSTS[n.id]
            return FUNCS[n.id]
        if isinstance(n,ast.UnaryOp):
            v=self.ev(n.operand,x,y); return v if isinstance(n.op,ast.UAdd) else -v
        if isinstance(n,ast.BinOp):
            a,b=self.ev(n.left,x,y),self.ev(n.right,x,y)
            if isinstance(n.op,ast.Add): v=a+b
            elif isinstance(n.op,ast.Sub): v=a-b
            elif isinstance(n.op,ast.Mult): v=a*b
            elif isinstance(n.op,ast.Div): v=a/b
            elif isinstance(n.op,ast.Mod): v=a%b
            elif isinstance(n.op,ast.Pow):
                if abs(b)>100: raise ValueError("Daraja juda katta.")
                v=a**b
            else: raise ValueError("Noma’lum amal.")
            return v
        if isinstance(n,ast.Call): return FUNCS[n.func.id](self.ev(n.args[0],x,y))
    def __call__(self,x,y):
        v=self.ev(self.tree,x,y)
        if isinstance(v,complex) or not math.isfinite(float(v)): raise ValueError("Funksiya qiymati haqiqiy va chekli son bo‘lishi kerak.")
        return float(v)

@app.get("/")
def home(): return render_template("index.html")

@app.get("/health")
def health(): return jsonify(status="ok")

@app.post("/api/euler")
def euler():
    d=request.get_json(silent=True) or {}
    try:
        raw=str(d.get("function","x+y")).strip()
        f=Expr(raw)
        x0,y0,a,b,h=map(float,(d.get("x0"),d.get("y0"),d.get("a"),d.get("b"),d.get("h")))
        if not all(map(math.isfinite,(x0,y0,a,b,h))): raise ValueError("Barcha qiymatlar chekli son bo‘lishi kerak.")
        if h<=0: raise ValueError("Qadam h noldan katta bo‘lishi kerak.")
        if abs(x0-a)>1e-9: raise ValueError("Ushbu Eyler hisobida boshlang‘ich nuqta x₀ oraliq boshi a bilan teng bo‘lishi kerak.")
        if b<=a: raise ValueError("Oraliq oxiri b oraliq boshi a dan katta bo‘lishi kerak.")
        q=(b-a)/h; n=round(q)
        if abs(q-n)>1e-8: raise ValueError("(b − x₀) / h butun son bo‘lishi kerak.")
        if n<1 or n>500: raise ValueError("Qadamlar soni 1 dan 500 gacha bo‘lishi kerak.")
        rows=[]; x=x0; y=y0
        for i in range(n+1):
            try: slope=f(x,y)
            except (ValueError,ZeroDivisionError,OverflowError) as e: raise ValueError(f"{i}-nuqtada funksiya hisoblanmadi: {e}")
            yn=y+h*slope if i<n else None
            rows.append(dict(i=i,x=x,y=y,f=slope,hf=h*slope,next_y=yn))
            if i<n: x=x0+(i+1)*h; y=yn
        return jsonify(ok=True,function=raw,x0=x0,y0=y0,a=a,b=b,h=h,n=n,rows=rows,result=rows[-1]["y"])
    except (ValueError,TypeError,OverflowError) as e:
        return jsonify(ok=False,error=str(e)),400

if __name__=="__main__": app.run(host="0.0.0.0",port=int(os.environ.get("PORT",5000)))
