"use client";
// Renaming the main component file to page_content.tsx to be imported by layout.tsx
// This is a common pattern to ensure client-side rendering is handled correctly within nextjs app router layouts
// However, since we are using nextjs app router, the layout.tsx usually wraps page.tsx.
// Let's stick to the standard: layout.tsx wraps page.tsx.
// I mistakenly tried to import page.tsx into layout.tsx above. 
// Correct approach: layout.tsx simply renders children. page.tsx has the content.

// RE-WRITING page.tsx content here just to be safe and clear, but actually I will just fix the layout file in the next step.
// For now, I'll rename the previous `page.tsx` content to be consistent if I were to use this pattern,
// but to avoid confusion, I will just correct the `layout.tsx` logically in the next turn if needed.
// Actually, `page.tsx` is the ROUTE. `layout.tsx` wraps it.
// The previous `app/training/page.tsx` I wrote is correct.
// The `app/training/layout.tsx` I wrote tries to import `PageContent` from `./page_content` which doesnt exist.
// I should just delete `app/training/layout.tsx` or make it standard.

export default function TrainingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <section className="h-full">
            {children}
        </section>
    )
}
