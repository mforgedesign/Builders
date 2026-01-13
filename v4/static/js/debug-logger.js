
window.DebugLogger = {
    logs: [],
    log: function (msg) { this.logs.push(`[${new Date().toISOString()}] ${msg}`); },

    // Call this from windows.js right before 'zip.file("index.html"...)'
    generateReport: function (formData, menuConfig, finalHtml) {
        const report = [
            "========================================",
            "   AUTOBUILDER DIAGNOSTIC REPORT",
            `   Date: ${new Date().toLocaleString()}`,
            "========================================",
            "",
            "--- FORM DATA (Input Values) ---",
            JSON.stringify(formData, null, 2),
            "",
            "--- MENU CONFIG (Computed Buttons) ---",
            JSON.stringify(menuConfig, null, 2),
            "",
            "--- CRITICAL HTML SNIPPETS ---",
            "1. Button Color Variable:",
            (finalHtml.match(/:root\s*\{[^}]*--button-color[^}]*\}/i) || ["Not Found"])[0],
            "2. Date Replacement:",
            (finalHtml.match(/new Date\('[^']*'\)/i) || ["Not Found"])[0], // Matches new Date('...')
            "3. Buttons Offset:",
            (finalHtml.match(/bottom:\s*[^;]+;/i) || ["Not Found"])[0],
            "4. Menu Config Injection:",
            (finalHtml.match(/const menuConfig\s*=\s*\[[^\]]*\]/i) || ["Not Found"])[0],
            "",
            "--- CONSOLE LOGS ---",
            this.logs.join('\n'),
            "",
            "--- FULL GENERATED HTML ---",
            finalHtml
        ].join('\n');

        // Create Blob and Download
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug_report_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// Intercept console
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function (...args) {
    window.DebugLogger.log(args.join(' '));
    originalLog.apply(console, args);
};
console.warn = function (...args) {
    window.DebugLogger.log("WARN: " + args.join(' '));
    originalWarn.apply(console, args);
};
console.error = function (...args) {
    window.DebugLogger.log("ERROR: " + args.join(' '));
    originalError.apply(console, args);
};

console.log("[DebugLogger] Initialized and monitoring...");
