# Sonli usullar — Eyler usuli

## Lokal ishga tushirish
```bash
python -m venv venv
# Windows: venv\\Scripts\\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Brauzer: http://127.0.0.1:5000

## Render
GitHub repository'ga yuklang va Render > New > Web Service orqali ulang.
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app`
- Health Check Path: `/health`

`render.yaml` orqali Blueprint sifatida ham joylashtirish mumkin.

## Funksiya yozish
O‘zgaruvchilar: `x`, `y`; amallar: `+ - * / ^ ** %`; funksiyalar: `sin cos tan asin acos atan exp log log10 sqrt abs`; konstantalar: `pi`, `e`.
Misol: `x+y`, `x^2-y`, `sin(x)+y`.

Hisoblash tarixi va ma'lumotlar bazasi yo‘q. Hozirgi modul birinchi tartibli `y'=f(x,y)` masalalari uchun. `x0=a`, `b>a`, `h>0`, `(b-x0)/h` butun son bo‘lishi va qadamlar 500 tadan oshmasligi kerak. Grafik Eyler nuqtalarini tutashtiradi.
