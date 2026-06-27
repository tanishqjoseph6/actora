import { NextRequest, NextResponse } from "next/server";
import { currencyFromCountry } from "@/lib/billing/currency";

function detectCountry(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country") ||
    request.headers.get("x-nf-country") ||
    "US"
  );
}

export async function GET(request: NextRequest) {
  const country = detectCountry(request);
  const currency = currencyFromCountry(country);

  return NextResponse.json({
    country,
    currency,
    detected: true,
  });
}
