export const AVATAR_COLORS = ['#C9A55F', '#4F8A63', '#2563EB', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6']

export const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', confirmed: '#3B82F6', pending: '#F59E0B',
  cancelled: '#EF4444', in_progress: '#8B5CF6', no_show: '#6B7280',
}

export const STATUS_MAP: Record<string, { ar: string; en: string; color: string }> = {
  completed:   { ar: 'مكتمل',    en: 'Completed',   color: '#10B981' },
  confirmed:   { ar: 'مؤكد',     en: 'Confirmed',   color: '#3B82F6' },
  pending:     { ar: 'معلق',     en: 'Pending',     color: '#F59E0B' },
  cancelled:   { ar: 'ملغى',     en: 'Cancelled',   color: '#EF4444' },
  in_progress: { ar: 'جارٍ',     en: 'In Progress', color: '#8B5CF6' },
  no_show:     { ar: 'لم يحضر', en: 'No Show',     color: '#6B7280' },
}

export const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ─── Mock Data (fallbacks whenever the API returns an empty array) ───────

export const MOCK_REVENUE = [
  { month: 'يناير', monthEn: 'Jan', revenue: 28500, appointments: 142, target: 25000 },
  { month: 'فبراير', monthEn: 'Feb', revenue: 32000, appointments: 158, target: 26000 },
  { month: 'مارس', monthEn: 'Mar', revenue: 29800, appointments: 151, target: 27000 },
  { month: 'أبريل', monthEn: 'Apr', revenue: 35600, appointments: 175, target: 28000 },
  { month: 'مايو', monthEn: 'May', revenue: 38900, appointments: 192, target: 30000 },
  { month: 'يونيو', monthEn: 'Jun', revenue: 42300, appointments: 210, target: 32000 },
  { month: 'يوليو', monthEn: 'Jul', revenue: 45800, appointments: 228, target: 35000 },
  { month: 'أغسطس', monthEn: 'Aug', revenue: 47200, appointments: 235, target: 36000 },
]

export const MOCK_STATUS = [
  { name: 'مكتمل', nameEn: 'Completed', value: 185, color: '#10B981' },
  { name: 'مؤكد', nameEn: 'Confirmed', value: 95, color: '#3B82F6' },
  { name: 'معلق', nameEn: 'Pending', value: 42, color: '#F59E0B' },
  { name: 'ملغى', nameEn: 'Cancelled', value: 18, color: '#EF4444' },
  { name: 'جارٍ', nameEn: 'In Progress', value: 28, color: '#8B5CF6' },
]

export const MOCK_SERVICES = [
  { name: 'قص شعر رجالي', nameEn: 'Men\'s Haircut', bookings: 245, revenue: 36750 },
  { name: 'صبغ شعر', nameEn: 'Hair Coloring', bookings: 189, revenue: 47250 },
  { name: 'عناية بالبشرة', nameEn: 'Facial', bookings: 156, revenue: 23400 },
  { name: 'مانيكير', nameEn: 'Manicure', bookings: 134, revenue: 13400 },
  { name: 'حلاقة كاملة', nameEn: 'Full Shave', bookings: 112, revenue: 11200 },
  { name: 'مكياج', nameEn: 'Makeup', bookings: 98, revenue: 19600 },
]

export const MOCK_GROWTH = [
  { month: 'يناير', monthEn: 'Jan', new: 45, returning: 120, total: 165 },
  { month: 'فبراير', monthEn: 'Feb', new: 52, returning: 138, total: 190 },
  { month: 'مارس', monthEn: 'Mar', new: 48, returning: 145, total: 193 },
  { month: 'أبريل', monthEn: 'Apr', new: 63, returning: 162, total: 225 },
  { month: 'مايو', monthEn: 'May', new: 58, returning: 178, total: 236 },
  { month: 'يونيو', monthEn: 'Jun', new: 72, returning: 195, total: 267 },
  { month: 'يوليو', monthEn: 'Jul', new: 81, returning: 210, total: 291 },
  { month: 'أغسطس', monthEn: 'Aug', new: 68, returning: 225, total: 293 },
]

export const MOCK_BRANCHES = [
  { name: 'الفرع الرئيسي', nameEn: 'Main', revenue: 142000, customers: 856, rating: 4.8 },
  { name: 'فرع النخيل', nameEn: 'Nakheel', revenue: 98000, customers: 623, rating: 4.6 },
  { name: 'فرع الروضة', nameEn: 'Rawdah', revenue: 76500, customers: 498, rating: 4.7 },
  { name: 'فرع العليا', nameEn: 'Olaya', revenue: 124000, customers: 745, rating: 4.9 },
]

export const MOCK_PEAK_HOURS = [
  { hour: '9ص', hourEn: '9AM', bookings: 8 },
  { hour: '10ص', hourEn: '10AM', bookings: 15 },
  { hour: '11ص', hourEn: '11AM', bookings: 22 },
  { hour: '12م', hourEn: '12PM', bookings: 28 },
  { hour: '1م', hourEn: '1PM', bookings: 18 },
  { hour: '2م', hourEn: '2PM', bookings: 12 },
  { hour: '3م', hourEn: '3PM', bookings: 20 },
  { hour: '4م', hourEn: '4PM', bookings: 32 },
  { hour: '5م', hourEn: '5PM', bookings: 38 },
  { hour: '6م', hourEn: '6PM', bookings: 42 },
  { hour: '7م', hourEn: '7PM', bookings: 35 },
  { hour: '8م', hourEn: '8PM', bookings: 25 },
  { hour: '9م', hourEn: '9PM', bookings: 14 },
]

export const MOCK_STAFF = [
  { id: 1, name: 'أحمد محمد', nameEn: 'Ahmed Mohammed', role: 'حلاق', roleEn: 'Barber', rating: 4.9, completed: 182, attendance: 98, commission: 12400, image: null },
  { id: 2, name: 'سارة علي', nameEn: 'Sara Ali', role: 'أخصائية تجميل', roleEn: 'Beautician', rating: 4.8, completed: 156, attendance: 96, commission: 11200, image: null },
  { id: 3, name: 'خالد عمر', nameEn: 'Khaled Omar', role: 'حلاق', roleEn: 'Barber', rating: 4.7, completed: 145, attendance: 95, commission: 9800, image: null },
  { id: 4, name: 'نورة عبدالله', nameEn: 'Noura Abdullah', role: 'أخصائية بشرة', roleEn: 'Skin Specialist', rating: 4.9, completed: 134, attendance: 99, commission: 15600, image: null },
  { id: 5, name: 'فيصل حسن', nameEn: 'Faisal Hassan', role: 'حلاق', roleEn: 'Barber', rating: 4.6, completed: 128, attendance: 93, commission: 8700, image: null },
]

export const MOCK_APPOINTMENTS_TODAY = [
  { id: 1, time: '09:00', customer: 'أحمد الشمري', customerEn: 'Ahmed Al-Shammari', service: 'قص شعر', serviceEn: 'Haircut', status: 'completed', staff: 'أحمد محمد', staffEn: 'Ahmed M.' },
  { id: 2, time: '10:30', customer: 'نورة القحطاني', customerEn: 'Noura Al-Qahtani', service: 'صبغ شعر', serviceEn: 'Hair Coloring', status: 'in_progress', staff: 'سارة علي', staffEn: 'Sara A.' },
  { id: 3, time: '11:00', customer: 'فهد العتيبي', customerEn: 'Fahad Al-Otaibi', service: 'حلاقة كاملة', serviceEn: 'Full Shave', status: 'confirmed', staff: 'خالد عمر', staffEn: 'Khaled O.' },
  { id: 4, time: '12:30', customer: 'هند الدوسري', customerEn: 'Hind Al-Dosari', service: 'عناية بالبشرة', serviceEn: 'Facial', status: 'confirmed', staff: 'نورة عبدالله', staffEn: 'Noura A.' },
  { id: 5, time: '14:00', customer: 'سعود الرشيد', customerEn: 'Saud Al-Rashid', service: 'قص شعر', serviceEn: 'Haircut', status: 'pending', staff: 'فيصل حسن', staffEn: 'Faisal H.' },
  { id: 6, time: '15:30', customer: 'لينا الحربي', customerEn: 'Lina Al-Harbi', service: 'مكياج', serviceEn: 'Makeup', status: 'pending', staff: 'سارة علي', staffEn: 'Sara A.' },
  { id: 7, time: '16:00', customer: 'عبدالله السالم', customerEn: 'Abdullah Al-Salem', service: 'قص شعر', serviceEn: 'Haircut', status: 'confirmed', staff: 'أحمد محمد', staffEn: 'Ahmed M.' },
]

export const MOCK_VIP = [
  { id: 1, name: 'هند الدوسري', nameEn: 'Hind Al-Dosari', visits: 48, spent: 28500, points: 2850, tier: 'بلاتينيوم', tierEn: 'Platinum' },
  { id: 2, name: 'نورة القحطاني', nameEn: 'Noura Al-Qahtani', visits: 36, spent: 22100, points: 2210, tier: 'ذهب', tierEn: 'Gold' },
  { id: 3, name: 'أحمد الشمري', nameEn: 'Ahmed Al-Shammari', visits: 42, spent: 19300, points: 1930, tier: 'ذهب', tierEn: 'Gold' },
  { id: 4, name: 'فهد العتيبي', nameEn: 'Fahad Al-Otaibi', visits: 28, spent: 14200, points: 1420, tier: 'فضة', tierEn: 'Silver' },
  { id: 5, name: 'سعد المطيري', nameEn: 'Saad Al-Mutairi', visits: 31, spent: 16800, points: 1680, tier: 'ذهب', tierEn: 'Gold' },
]

export const MOCK_RECENT_CUSTOMERS = [
  { id: 1, name: 'مها الشمري', nameEn: 'Maha Al-Shammari', lastVisit: '2026-06-30', visits: 12 },
  { id: 2, name: 'ريم القحطاني', nameEn: 'Reem Al-Qahtani', lastVisit: '2026-06-29', visits: 7 },
  { id: 3, name: 'عبير العتيبي', nameEn: 'Abeer Al-Otaibi', lastVisit: '2026-06-28', visits: 19 },
  { id: 4, name: 'سلطان الدوسري', nameEn: 'Sultan Al-Dosari', lastVisit: '2026-06-27', visits: 4 },
  { id: 5, name: 'لطيفة الرشيد', nameEn: 'Latifa Al-Rashid', lastVisit: '2026-06-25', visits: 9 },
]

export const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'booking', messageAr: 'حجز جديد من أحمد الشمري - قص شعر', messageEn: 'New booking from Ahmed Al-Shammari - Haircut', time: '5 دقائق', timeEn: '5 min ago', read: false },
  { id: 2, type: 'reminder', messageAr: 'تذكير: موعد نورة القحطاني بعد 30 دقيقة', messageEn: 'Reminder: Noura Al-Qahtani in 30 min', time: '15 دقيقة', timeEn: '15 min ago', read: false },
  { id: 3, type: 'staff', messageAr: 'تسجيل دخول - خالد عمر الساعة 8:45 ص', messageEn: 'Check-in - Khaled Omar at 8:45 AM', time: 'ساعة', timeEn: '1 hour ago', read: false },
  { id: 4, type: 'system', messageAr: 'تم تحديث النظام إلى الإصدار 2.5.0', messageEn: 'System updated to v2.5.0', time: 'ساعتين', timeEn: '2 hours ago', read: true },
  { id: 5, type: 'booking', messageAr: 'إلغاء حجز - سعود الرشيد الساعة 2:00 م', messageEn: 'Cancellation - Saud Al-Rashid at 2:00 PM', time: '3 ساعات', timeEn: '3 hours ago', read: true },
]

export const MOCK_SECURITY = {
  loginActivity: [
    { date: 'الاثنين', dateEn: 'Mon', success: 12, failed: 2 },
    { date: 'الثلاثاء', dateEn: 'Tue', success: 15, failed: 1 },
    { date: 'الأربعاء', dateEn: 'Wed', success: 10, failed: 3 },
    { date: 'الخميس', dateEn: 'Thu', success: 18, failed: 0 },
    { date: 'الجمعة', dateEn: 'Fri', success: 8, failed: 1 },
    { date: 'السبت', dateEn: 'Sat', success: 14, failed: 2 },
    { date: 'الأحد', dateEn: 'Sun', success: 20, failed: 4 },
  ],
  activeSessions: 12,
  totalUsers: 18,
  failedToday: 4,
}
