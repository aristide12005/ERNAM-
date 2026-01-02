/**
 * Auto-Accept Script for Browser Automation
 * 
 * Usage: Inject this script into the browser console or include it in your HTML 
 * to automatically handle blocking dialogs.
 */

(function () {
    console.log("🤖 Auto-Accept Agent Active: Overriding window dialogs...");

    // Auto-accept confirmation dialogs
    window.confirm = function (message) {
        console.log(`[Auto-Accept] confirm() called with: "${message}" -> Assuming TRUE`);
        return true;
    };

    // Auto-dismiss alerts
    window.alert = function (message) {
        console.log(`[Auto-Accept] alert() called with: "${message}" -> Dismissed`);
        return true;
    };

    // Auto-fill prompts
    window.prompt = function (message, defaultValue) {
        console.log(`[Auto-Accept] prompt() called with: "${message}" -> Returning default or empty string`);
        return defaultValue || "";
    };

    console.log("✅ Dialog overrides installed.");
})();
