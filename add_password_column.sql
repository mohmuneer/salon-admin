-- ============================================================
-- إضافة عمود كلمة المرور لجدول users
-- شغّل هذا في pgAdmin بعد migrations قاعدة البيانات
-- ============================================================

-- إضافة عمود password_hash
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- ملاحظة: كلمة المرور الافتراضية هي "admin123"
-- يتم التحقق منها في الكود مباشرة إذا كان password_hash فارغاً
-- لتغيير كلمة المرور، استخدم bcrypt hash وحدّث هذا العمود

-- تحقق من الإعداد
SELECT id, name, phone, role, password_hash IS NOT NULL as has_password
FROM users WHERE role = 'admin';
