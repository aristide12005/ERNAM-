import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "danger" | "neutral" | "primary";

interface StatusBadgeProps {
    status: string;
    type?: StatusType; // Optional manual override
    className?: string;
}

/**
 * Maps common ERNAM statuses to visual types enforced by the visual law.
 */
function mapStatusToType(status: string): StatusType {
    const s = status.toLowerCase();
    if (['approved', 'active', 'completed', 'verified', 'passed', 'valid'].includes(s)) return 'success';
    if (['pending', 'upcoming', 'planned', 'requested'].includes(s)) return 'warning';
    if (['rejected', 'failed', 'cancelled', 'expired', 'revoked'].includes(s)) return 'danger';
    if (['enrolled'].includes(s)) return 'primary'; // Blue for info/neutral active
    return 'neutral';
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
    const visualType = type || mapStatusToType(status);

    const variants: Record<StatusType, string> = {
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning-foreground border-warning/20", // Warning text usually needs contrast
        danger: "bg-destructive/10 text-destructive border-destructive/20",
        neutral: "bg-slate-100 text-slate-600 border-slate-200",
        primary: "bg-blue-50 text-blue-700 border-blue-200",
    };

    // Special handling for warning text color if it's too light on light bg
    // Warning color #F59E0B is readable on white but let's ensure.
    // Actually we use 'text-amber-700' equivalent often.
    // Let's use specific text colors for better contrast logic if needed.
    if (visualType === 'warning') {
        // override for better contrast because raw warning color might be bright
        // strictly following law: Warning (Pending / Action needed): #F59E0B
    }

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                variants[visualType],
                className
            )}
        >
            {status}
        </span>
    );
}
