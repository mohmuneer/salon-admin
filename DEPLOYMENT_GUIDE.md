# دليل النشر الكامل — مشروع صالون جلامور
## Glamour Salon — Full Deployment Guide

---

## 📋 نظرة عامة على المشروع

مشروع إدارة صالون تجميل متكامل يتكون من تطبيقين:

| التطبيق | الوصف | المنفذ المحلي | رابط الإنتاج |
|---------|-------|---------------|--------------|
| `glamour-admin` | لوحة تحكم الإدارة + الصفحة العامة | 3001 | https://salon-admin-tau-rose.vercel.app |
| `glamour-customer` | تطبيق العملاء | 3002 | https://salon-customer-three.vercel.app |

---

## 🛠️ البرامج والتقنيات المستخدمة

### إطارات العمل والمكتبات
| البرنامج | الإصدار | الاستخدام |
|---------|---------|-----------|
| **Next.js** | 16.2.9 | إطار عمل React للتطبيقين |
| **TypeScript** | - | لغة البرمجة |
| **NextAuth.js** | v5 | المصادقة في لوحة الإدارة |
| **PostgreSQL (pg)** | - | التواصل مع قاعدة البيانات |
| **Sharp** | - | معالجة الصور وضغطها |
| **bcryptjs** | - | تشفير كلمات المرور |
| **Recharts** | - | الرسوم البيانية في لوحة التحكم |
| **Lucide React** | - | الأيقونات |

### خدمات الاستضافة
| الخدمة | الاستخدام | الخطة |
|--------|-----------|-------|
| **Vercel** | استضافة التطبيقين | Hobby (مجاني) |
| **Neon** | قاعدة بيانات PostgreSQL السحابية | Free (0.5 GB) |
| **GitHub** | مستودع الكود المصدري | Free |

### أدوات التطوير
| الأداة | الاستخدام |
|--------|-----------|
| **Git + Git Bash** | إدارة الكود وإرساله |
| **VS Code** | محرر الكود |
| **pgAdmin / psql** | إدارة قاعدة البيانات محلياً |
| **XAMPP** | خادم محلي (PostgreSQL 17) |

---

## 🗄️ قاعدة البيانات

### محلياً (Development)
```
Host:     localhost
Port:     5432
Database: glamour
User:     postgres
Password: 716324425
```

### إنتاج (Production) — Neon
```
Host:     ep-silent-sky-atogq7vh.c-9.us-east-1.aws.neon.tech
Database: neondb
User:     neondb_owner
SSL:      require
```

**Connection String:**
```
postgresql://neondb_owner:[PASSWORD]@ep-silent-sky-atogq7vh.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## 🔧 إعداد البيئة المحلية

### 1. تثبيت المتطلبات
```bash
# Node.js 18+
# PostgreSQL 17
# Git
```

### 2. استنساخ المشروع
```bash
git clone https://github.com/mohmuneer/salon-admin.git
git clone https://github.com/mohmuneer/salon-customer.git
```

### 3. تثبيت الحزم
```bash
# لوحة الإدارة
cd glamour-admin
npm install

# تطبيق العملاء
cd glamour-customer
npm install
```

### 4. ملفات البيئة

**glamour-admin/.env.local:**
```env
DATABASE_URL=postgresql://postgres:716324425@localhost:5432/glamour
NEXTAUTH_SECRET=glamour-secret-change-in-production
AUTH_SECRET=glamour-super-secret-jwt-key-2025-change-this
AUTH_TRUST_HOST=true
```

**glamour-customer/.env.local:**
```env
DATABASE_URL=postgresql://postgres:716324425@localhost:5432/glamour
JWT_SECRET=glamour-customer-jwt-secret-2025
NEXT_PUBLIC_APP_NAME=جلامور
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

### 5. استيراد قاعدة البيانات محلياً
```bash
psql -U postgres -d glamour -f glamour.sql
```

### 6. تشغيل التطبيقين
```bash
# لوحة الإدارة (terminal 1)
cd glamour-admin
npm run dev
# يعمل على http://localhost:3001

# تطبيق العملاء (terminal 2)
cd glamour-customer
npm run dev
# يعمل على http://localhost:3002
```

---

## 🚀 خطوات النشر على الإنترنت

### الخطوة 1: إنشاء قاعدة بيانات Neon

1. اذهب لـ [neon.tech](https://neon.tech) وأنشئ حساباً
2. أنشئ مشروعاً جديداً
3. انسخ Connection String
4. افتح **SQL Editor** في Neon
5. الصق محتوى `glamour.sql` (بعد حذف سطري `\restrict` و`\unrestrict`)
6. اضغط **Run**

> **ملاحظة:** ملف `glamour.sql` يحتوي على سطرين غير صالحين يجب حذفهما:
> - السطر الأول: `\restrict XMtH...`
> - السطر الأخير: `\unrestrict XMtH...`

### الخطوة 2: رفع الكود على GitHub

```bash
# إنشاء Repository على github.com أولاً

# لوحة الإدارة
cd glamour-admin
git init
git add -A
git commit -m "initial deploy"
git branch -M main
git remote add origin https://github.com/mohmuneer/salon-admin.git
git push -u origin main

# تطبيق العملاء
cd glamour-customer
git init
git add -A
git commit -m "initial deploy"
git branch -M main
git remote add origin https://github.com/mohmuneer/salon-customer.git
git push -u origin main
```

> **للمصادقة:** استخدم Personal Access Token من [github.com/settings/tokens](https://github.com/settings/tokens)
> - اختر صلاحية `repo`
> - استخدم التوكن كلمة مرور عند الـ push
> - **لا تشارك التوكن مع أحد**

### الخطوة 3: النشر على Vercel

#### نشر glamour-admin:

1. اذهب لـ [vercel.com](https://vercel.com) وسجل دخولك بـ GitHub
2. اضغط **Add New Project** ← اختر `salon-admin`
3. اضغط **Import .env** والصق:

```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-silent-sky-atogq7vh.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=glamour-secret-2025-production
AUTH_SECRET=glamour-auth-secret-2025-production
AUTH_TRUST_HOST=true
```

4. اضغط **Deploy**

#### نشر glamour-customer:

1. اضغط **Add New Project** ← اختر `salon-customer`
2. اضغط **Import .env** والصق:

```env
DATABASE_URL=postgresql://neondb_owner:[PASSWORD]@ep-silent-sky-atogq7vh.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=glamour-customer-jwt-secret-2025
NEXT_PUBLIC_APP_NAME=جلامور
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
NEXT_PUBLIC_ADMIN_URL=https://salon-admin-tau-rose.vercel.app
```

3. اضغط **Deploy**

---

## 🔐 بيانات الدخول الافتراضية

### لوحة الإدارة
| الدور | الجوال | كلمة المرور |
|-------|--------|-------------|
| مدير | +966500000004 | admin123 |
| موظف | +966500000002 | admin123 |

### تطبيق العملاء
- يتم التسجيل بالجوال وكلمة مرور

---

## 🔄 تحديث الكود بعد النشر

```bash
# بعد أي تعديل في الكود
git add .
git commit -m "وصف التغيير"
git push

# Vercel سيعيد النشر تلقائياً خلال دقيقة
```

---

## 📁 هيكل المشروع

```
SalonApp/
├── glamour-admin/          # لوحة التحكم
│   ├── app/
│   │   ├── api/           # API Routes
│   │   ├── public/        # الصفحة العامة للصالون
│   │   ├── appointments/  # المواعيد
│   │   ├── payments/      # المدفوعات
│   │   ├── customers/     # العملاء
│   │   ├── staff/         # الموظفون
│   │   ├── services/      # الخدمات
│   │   ├── products/      # المنتجات
│   │   └── login/         # تسجيل الدخول
│   ├── components/        # مكونات مشتركة
│   ├── lib/               # المكتبات المساعدة
│   └── proxy.ts           # Middleware للمصادقة
│
├── glamour-customer/       # تطبيق العملاء
│   ├── app/
│   │   ├── (app)/         # صفحات التطبيق
│   │   ├── (auth)/        # تسجيل الدخول والتسجيل
│   │   └── api/           # API Routes
│   ├── components/        # مكونات مشتركة
│   └── lib/               # المكتبات المساعدة
│
├── glamour.sql            # نسخة احتياطية من قاعدة البيانات
└── DEPLOYMENT_GUIDE.md    # هذا الملف
```

---

## 🌐 الروابط المهمة

| الخدمة | الرابط |
|--------|--------|
| لوحة الإدارة (إنتاج) | https://salon-admin-tau-rose.vercel.app |
| الصفحة العامة | https://salon-admin-tau-rose.vercel.app/public |
| تطبيق العملاء | https://salon-customer-three.vercel.app |
| Vercel Dashboard | https://vercel.com/dashboard |
| Neon Dashboard | https://console.neon.tech |
| GitHub - Admin | https://github.com/mohmuneer/salon-admin |
| GitHub - Customer | https://github.com/mohmuneer/salon-customer |

---

## ⚠️ ملاحظات أمنية مهمة

1. **لا تشارك** ملفات `.env` أو `.env.local` في GitHub
2. **لا تشارك** Personal Access Tokens — احذفها بعد الاستخدام
3. **لا تشارك** Connection String لقاعدة البيانات
4. غيّر كلمات المرور الافتراضية (`admin123`) في الإنتاج
5. تأكد من وجود `.env.local` في ملف `.gitignore`

---

## 🆘 حل المشاكل الشائعة

### خطأ: Permission denied (publickey)
```bash
# استخدم HTTPS بدل SSH
git remote set-url origin https://USERNAME:TOKEN@github.com/USERNAME/repo.git
```

### خطأ: src refspec main does not match
```bash
git branch -M main
git push -u origin main
```

### خطأ: Database connection failed
- تحقق من صحة `DATABASE_URL` في متغيرات Vercel
- تأكد من إضافة `?sslmode=require` في نهاية الرابط

### الصفحة تظهر فارغة بعد النشر
- افتح Vercel Dashboard → Functions → اقرأ سجلات الأخطاء
- تحقق من وجود جميع متغيرات البيئة

---

*تم إعداد هذا الدليل بتاريخ 29 يونيو 2026*
