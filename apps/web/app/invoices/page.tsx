import { redirect } from 'next/navigation'

export default function InvoicesRouteRedirect() {
  redirect('/dashboard/invoices')
}
