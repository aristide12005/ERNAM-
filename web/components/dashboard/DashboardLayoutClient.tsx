"use client";

import React, { useState, useEffect } from "react";
import SidebarPro from "@/components/SidebarPro";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Initial check for screen size or persisted preference
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
            {/* Sidebar with controlled state */}
            <SidebarPro
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Content with dynamic margin */}
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[80px]' : 'ml-[270px]'
                    }`}
            >
                {children}
            </main>
        </div>
    );
}
