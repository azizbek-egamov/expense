import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Qurilish Chiqimlari - Boshqaruv Paneli",
  description: "Qurilish loyihalarining chiqimlarini boshqarish tizimi",
  generator: "ardentsoft.uz",
  // icons: {
  //   icon: [
  //     {
  //       url: "",
  //       media: "(prefers-color-scheme: light)",
  //     },
  //     {
  //       url: "",
  //       media: "(prefers-color-scheme: dark)",
  //     },
  //     {
  //       url: "",
  //       type: "image/svg+xml",
  //     },
  //   ],
  //   apple: "",
  // },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uz" className="dark">
      <body className={`font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
