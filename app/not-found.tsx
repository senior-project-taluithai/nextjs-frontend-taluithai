import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <FileQuestion className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Page Not Found</h2>
                <p className="text-muted-foreground max-w-[400px]">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
            </div>
            <Button asChild>
                <Link href="/">
                    Go Back Home
                </Link>
            </Button>
        </div>
    )
}
