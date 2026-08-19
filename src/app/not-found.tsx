import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-4 text-lg">页面未找到</p>
        <Link
          href="/chat"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
