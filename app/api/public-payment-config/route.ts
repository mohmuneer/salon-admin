import { NextResponse } from 'next/server'
import { isMoyasarEnabled, getPublishableKey } from '@/lib/moyasar'

export async function GET() {
  const enabled = isMoyasarEnabled()
  return NextResponse.json({
    enabled,
    publishableKey: enabled ? getPublishableKey() : null,
  })
}
