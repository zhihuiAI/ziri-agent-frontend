import {
  JetBrains_Mono,
  Noto_Sans_SC,
  Plus_Jakarta_Sans,
} from 'next/font/google'

export const notoSansSc = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
})

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

/** Combined next/font CSS variable classes for the root `<html>` element. */
export const fontVariables = [
  notoSansSc.variable,
  plusJakartaSans.variable,
  jetbrainsMono.variable,
].join(' ')
