# EduJournal frontend (Next.js 16 + Tailwind 4)

    npm install
    npm run dev        # http://localhost:3000
    npm run build && npm start

Sozlamalar `.env.local` faylida (namuna: `.env.example`):

    NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
    NEXT_PUBLIC_TIMEZONE=Asia/Tashkent

Backend `.env` dagi `CORS_ORIGINS` ga frontend manzili (http://localhost:3000) kiritilgan bo'lishi kerak.

## Windows'da `lightningcss.win32-x64-msvc.node` xatosi chiqsa

`node_modules`, `.next` va `package-lock.json` ni o'chirib, `npm install` ni qayta bajaring.
Shu arxivda `package-lock.json` ataylab yo'q: npm uni sizning tizimingiz uchun yaratadi.
