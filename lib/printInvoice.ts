export function printInvoice(appt: any) {
  window.open(`/api/print-receipt/${appt.id}`, '_blank', 'width=420,height=700')
}
