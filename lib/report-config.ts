export interface ReportColumn {
  key: string
  labelAr: string
  labelEn: string
  type?: 'text' | 'number' | 'currency' | 'date' | 'time' | 'status'
  default?: boolean
}

export interface ReportType {
  id: string
  labelAr: string
  labelEn: string
  endpoint: string
  columns: ReportColumn[]
}

export const reportTypes: ReportType[] = [
  {
    id: 'appointments',
    labelAr: 'المواعيد',
    labelEn: 'Appointments',
    endpoint: '/api/appointments',
    columns: [
      { key: 'customer_name', labelAr: 'العميل', labelEn: 'Customer', default: true },
      { key: 'customer_phone', labelAr: 'الهاتف', labelEn: 'Phone', default: true },
      { key: 'service_name', labelAr: 'الخدمة', labelEn: 'Service', default: true },
      { key: 'staff_name', labelAr: 'الموظف', labelEn: 'Staff', default: true },
      { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', type: 'date', default: true },
      { key: 'start_time', labelAr: 'الوقت', labelEn: 'Time', type: 'time', default: true },
      { key: 'status', labelAr: 'الحالة', labelEn: 'Status', type: 'status', default: true },
      { key: 'service_price', labelAr: 'سعر الخدمة', labelEn: 'Service Price', type: 'currency', default: true },
      { key: 'products_price', labelAr: 'سعر المنتجات', labelEn: 'Products Price', type: 'currency', default: false },
      { key: 'total', labelAr: 'الإجمالي', labelEn: 'Total', type: 'currency', default: true },
      { key: 'notes', labelAr: 'ملاحظات', labelEn: 'Notes', default: false },
      { key: 'branch_name', labelAr: 'الفرع', labelEn: 'Branch', default: true },
    ],
  },
  {
    id: 'services',
    labelAr: 'الخدمات',
    labelEn: 'Services',
    endpoint: '/api/services',
    columns: [
      { key: 'name_ar', labelAr: 'اسم الخدمة', labelEn: 'Service Name', default: true },
      { key: 'category_name', labelAr: 'الفئة', labelEn: 'Category', default: true },
      { key: 'duration_min', labelAr: 'المدة (دقيقة)', labelEn: 'Duration (min)', type: 'number', default: true },
      { key: 'price', labelAr: 'السعر', labelEn: 'Price', type: 'currency', default: true },
      { key: 'gender_target', labelAr: 'الفئة المستهدفة', labelEn: 'Gender Target', default: true },
      { key: 'total_bookings', labelAr: 'إجمالي الحجوزات', labelEn: 'Total Bookings', type: 'number', default: true },
      { key: 'is_active', labelAr: 'نشط', labelEn: 'Active', type: 'status', default: false },
    ],
  },
  {
    id: 'products',
    labelAr: 'المنتجات',
    labelEn: 'Products',
    endpoint: '/api/products',
    columns: [
      { key: 'name_ar', labelAr: 'اسم المنتج', labelEn: 'Product Name', default: true },
      { key: 'department_name', labelAr: 'القسم', labelEn: 'Department', default: true },
      { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', default: true },
      { key: 'category', labelAr: 'الفئة', labelEn: 'Category', default: true },
      { key: 'price', labelAr: 'سعر البيع', labelEn: 'Selling Price', type: 'currency', default: true },
      { key: 'cost', labelAr: 'التكلفة', labelEn: 'Cost', type: 'currency', default: true },
      { key: 'stock_qty', labelAr: 'الكمية', labelEn: 'Stock Qty', type: 'number', default: true },
      { key: 'min_stock_alert', labelAr: 'حد التنبيه', labelEn: 'Min Stock Alert', type: 'number', default: false },
      { key: 'sold_in_store', labelAr: 'مباع في المتجر', labelEn: 'Sold in Store', default: false },
      { key: 'used_in_sessions', labelAr: 'مستخدم في الجلسات', labelEn: 'Used in Sessions', default: false },
    ],
  },
  {
    id: 'customers',
    labelAr: 'العملاء',
    labelEn: 'Customers',
    endpoint: '/api/customers',
    columns: [
      { key: 'name', labelAr: 'الاسم', labelEn: 'Name', default: true },
      { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', default: true },
      { key: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', default: true },
      { key: 'gender', labelAr: 'الجنس', labelEn: 'Gender', default: true },
      { key: 'total_appointments', labelAr: 'إجمالي الزيارات', labelEn: 'Total Visits', type: 'number', default: true },
      { key: 'total_spent', labelAr: 'إجمالي الإنفاق', labelEn: 'Total Spent', type: 'currency', default: true },
      { key: 'last_visit', labelAr: 'آخر زيارة', labelEn: 'Last Visit', type: 'date', default: true },
      { key: 'created_at', labelAr: 'تاريخ التسجيل', labelEn: 'Registered', type: 'date', default: false },
    ],
  },
  {
    id: 'staff',
    labelAr: 'الموظفون',
    labelEn: 'Staff',
    endpoint: '/api/staff',
    columns: [
      { key: 'name', labelAr: 'الاسم', labelEn: 'Name', default: true },
      { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', default: true },
      { key: 'email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', default: false },
      { key: 'specialty', labelAr: 'التخصص', labelEn: 'Specialty', default: true },
      { key: 'gender_served', labelAr: 'يخدم', labelEn: 'Serves', default: true },
      { key: 'rating', labelAr: 'التقييم', labelEn: 'Rating', type: 'number', default: true },
      { key: 'reviews_count', labelAr: 'عدد التقييمات', labelEn: 'Reviews Count', type: 'number', default: false },
      { key: 'is_active', labelAr: 'نشط', labelEn: 'Active', type: 'status', default: false },
    ],
  },
  {
    id: 'orders',
    labelAr: 'الطلبات',
    labelEn: 'Orders',
    endpoint: '/api/orders',
    columns: [
      { key: 'customer_name', labelAr: 'العميل', labelEn: 'Customer', default: true },
      { key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', default: true },
      { key: 'status', labelAr: 'الحالة', labelEn: 'Status', type: 'status', default: true },
      { key: 'subtotal', labelAr: 'المجموع الفرعي', labelEn: 'Subtotal', type: 'currency', default: false },
      { key: 'discount', labelAr: 'الخصم', labelEn: 'Discount', type: 'currency', default: false },
      { key: 'shipping_fee', labelAr: 'رسوم الشحن', labelEn: 'Shipping Fee', type: 'currency', default: false },
      { key: 'total', labelAr: 'الإجمالي', labelEn: 'Total', type: 'currency', default: true },
      { key: 'payment_status', labelAr: 'حالة الدفع', labelEn: 'Payment Status', type: 'status', default: true },
      { key: 'payment_method', labelAr: 'طريقة الدفع', labelEn: 'Payment Method', default: true },
      { key: 'items_count', labelAr: 'عدد المنتجات', labelEn: 'Items Count', type: 'number', default: true },
      { key: 'created_at', labelAr: 'تاريخ الطلب', labelEn: 'Order Date', type: 'date', default: true },
    ],
  },
  {
    id: 'departments',
    labelAr: 'الأقسام',
    labelEn: 'Departments',
    endpoint: '/api/reports/query',
    columns: [
      { key: 'department_name', labelAr: 'القسم', labelEn: 'Department', default: true },
      { key: 'product_count', labelAr: 'عدد المنتجات', labelEn: 'Products', type: 'number', default: true },
      { key: 'service_count', labelAr: 'عدد الخدمات', labelEn: 'Services', type: 'number', default: true },
      { key: 'stock_value', labelAr: 'قيمة المخزون', labelEn: 'Stock Value', type: 'currency', default: true },
      { key: 'revenue', labelAr: 'الإيرادات', labelEn: 'Revenue', type: 'currency', default: true },
      { key: 'sales_count', labelAr: 'عدد المبيعات', labelEn: 'Sales Count', type: 'number', default: true },
    ],
  },
  {
    id: 'financial',
    labelAr: 'مالي',
    labelEn: 'Financial',
    endpoint: '/api/reports/query',
    columns: [
      { key: 'date', labelAr: 'التاريخ', labelEn: 'Date', type: 'date', default: true },
      { key: 'revenue', labelAr: 'الإيرادات', labelEn: 'Revenue', type: 'currency', default: true },
      { key: 'costs', labelAr: 'التكاليف', labelEn: 'Costs', type: 'currency', default: true },
      { key: 'profit', labelAr: 'الربح', labelEn: 'Profit', type: 'currency', default: true },
      { key: 'completed_appointments', labelAr: 'المواعيد المكتملة', labelEn: 'Completed Appts', type: 'number', default: true },
      { key: 'new_customers', labelAr: 'عملاء جدد', labelEn: 'New Customers', type: 'number', default: true },
    ],
  },
]
