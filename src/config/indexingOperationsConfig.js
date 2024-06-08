function getIndexingConfig() {
    if (!global.indexingConfig) {
        const indexingConfig = {
            indexingPaused: false,
            resumeIndexing: () => {
                global.indexingConfig.indexingPaused = false;
            },
            pauseIndexing: () => {
                global.indexingConfig.indexingPaused = true;
            }
        };
        global.indexingConfig = indexingConfig;
    }
    return global.indexingConfig;
}

module.exports = {
    getIndexingConfig
}



