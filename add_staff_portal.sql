-- ============================================================
-- بوابة الموظف: إشعارات الحجوزات المسندة
-- شغّل هذا في pgAdmin بعد migrations قاعدة البيانات
-- ============================================================

-- عمود لتتبع ما إذا كان الموظف قد شاهد الحجز (لإظهار إشعار "حجز جديد")
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_seen boolean NOT NULL DEFAULT false;

-- الحجوزات الحالية لا تُعتبر إشعارات جديدة
UPDATE appointments SET staff_seen = true WHERE staff_seen = false;
