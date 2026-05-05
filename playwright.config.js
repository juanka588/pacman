const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 10000,
    use: {
        headless: true,
        baseURL: 'http://localhost:8765',
    },
    webServer: {
        command: 'python3 -m http.server 8765',
        url: 'http://localhost:8765',
        reuseExistingServer: true,
    },
    reporter: 'list',
});
