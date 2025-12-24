"use client";

import * as React from "react"
import { Search, History, GraduationCap, LayoutDashboard, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Training', href: '/training', icon: GraduationCap },
    { name: 'Archives', href: '/archives', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-[250px] flex-col bg-card border-r border-border">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    ✈️ ERNAM
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Digital Twin v1.0</p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                isActive ? 'bg-primary/20 text-white' : 'text-muted-foreground hover:bg-secondary hover:text-white',
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300',
                                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-400">AD</span>
                    </div>
                    <div className="text-sm">
                        <p className="text-white font-medium">Amadou Diallo</p>
                        <p className="text-xs text-muted-foreground">Trainee</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
