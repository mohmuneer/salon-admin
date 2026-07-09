import SupplierInstallPrompt from '@/components/SupplierInstallPrompt'

export default function SupplierPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SupplierInstallPrompt />
    </>
  )
}
