import { Loader2 } from "lucide-react";

interface LoaderProps {
    text?: string;
    className?: string;
}

export function Loader({ text, className = "" }: LoaderProps) {
    return (
        <div className={`flex items-center gap-2 text-primary ${className}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            {text && <span className="text-sm font-medium">{text}</span>}
        </div>
    );
}
