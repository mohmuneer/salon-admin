'use client'
export default function ReceiptPrintButton() {
  return (
    <div style={{ textAlign: 'center' }}>
      <button
        onClick={() => window.print()}
        style={{
          display: 'block', width: '100%', maxWidth: 400, margin: '16px auto 8px',
          padding: 12, background: '#1A1A2E', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
        className="no-print"
      >
        طباعة الفاتورة
      </button>
    </div>
  )
}
