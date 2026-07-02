-- ============================================================
-- Glamour — post-install verification queries.
-- Run after migrations + seed:  psql "$DATABASE_URL" -f verify.sql
-- ============================================================

\echo '== Table count (expect 15) =='
SELECT count(*) AS tables FROM information_schema.tables
 WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo '== Sample appointment: end_time + total computed by triggers =='
-- expect end_time = 12:00 (11:00 + 60 min), total = 150.00
SELECT date, start_time, end_time, service_price, products_price, total, status
  FROM appointments
 WHERE id = 'f0000000-0000-0000-0000-000000000001';

\echo '== Available slots for Noor tomorrow, 60-min haircut =='
-- 11:00 should be ABSENT (booked); 10:00, 12:00, 13:00... present
SELECT slot_start, slot_end
  FROM get_available_slots(
        'b0000000-0000-0000-0000-000000000001',
        CURRENT_DATE + 1,
        'e0000000-0000-0000-0000-000000000001');

\echo '== Stock decrement + rating triggers (manual test) =='
-- Complete the appointment -> serum stock (8) should drop to 7
UPDATE appointments SET status = 'completed'
 WHERE id = 'f0000000-0000-0000-0000-000000000001';
SELECT name_ar, stock_qty FROM products
 WHERE id = 'd0000000-0000-0000-0000-000000000002';   -- expect 7

-- Add a review -> staff.rating recomputed
INSERT INTO reviews (appointment_id, customer_id, staff_id, rating, comment)
VALUES ('f0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001', 5, 'ممتازة!')
ON CONFLICT (appointment_id) DO NOTHING;
SELECT specialty, rating, reviews_count FROM staff
 WHERE id = 'b0000000-0000-0000-0000-000000000001';   -- expect 5.00 / 1
