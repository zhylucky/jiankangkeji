/**
 * ECharts 统一加载器
 * 避免重复加载，提供统一的ECharts初始化方法
 */

window.EChartsLoader = (function() {
    let echartsPromise = null;
    const CDN_URL = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    
    /**
     * 加载ECharts库
     * @returns {Promise} 返回加载Promise
     */
    function loadECharts() {
        // 如果已经加载过，直接返回
        if (typeof echarts !== 'undefined') {
            return Promise.resolve();
        }
        
        // 如果正在加载中，返回现有的Promise
        if (echartsPromise) {
            return echartsPromise;
        }
        
        // 创建新的加载Promise
        echartsPromise = new Promise((resolve, reject) => {
            console.time('ECharts加载时间');
            const script = document.createElement('script');
            script.src = CDN_URL;
            script.onload = () => {
                console.timeEnd('ECharts加载时间');
                console.log('✨ ECharts库加载成功');
                resolve();
            };
            script.onerror = (error) => {
                console.error('❌ ECharts库加载失败:', error);
                echartsPromise = null; // 重置，允许重试
                reject(error);
            };
            document.head.appendChild(script);
        });
        
        return echartsPromise;
    }
    
    /**
     * 初始化图表
     * @param {string} elementId - 图表容器ID
     * @param {Object} option - 图表配置选项
     * @param {boolean} autoResize - 是否自动调整大小（默认true）
     * @returns {Promise<Object>} 返回图表实例
     */
    async function initChart(elementId, option, autoResize = true) {
        try {
            // 确保ECharts已加载
            await loadECharts();
            
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`找不到图表容器: ${elementId}`);
            }
            
            // 初始化图表
            const chart = echarts.init(element);
            chart.setOption(option);
            
            // 自动调整大小
            if (autoResize) {
                const resizeHandler = () => chart.resize();
                window.addEventListener('resize', resizeHandler);
                
                // 返回销毁方法
                const originalDispose = chart.dispose;
                chart.dispose = function() {
                    window.removeEventListener('resize', resizeHandler);
                    originalDispose.call(this);
                };
            }
            
            return chart;
        } catch (error) {
            console.error('图表初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 批量初始化多个图表
     * @param {Array} chartsConfig - 图表配置数组 [{id, option}, ...]
     * @returns {Promise<Array>} 返回图表实例数组
     */
    async function initCharts(chartsConfig) {
        try {
            await loadECharts();
            
            const charts = [];
            for (const config of chartsConfig) {
                const chart = await initChart(config.id, config.option, true);
                charts.push(chart);
            }
            
            return charts;
        } catch (error) {
            console.error('批量初始化图表失败:', error);
            throw error;
        }
    }
    
    // 公开API
    return {
        loadECharts,
        initChart,
        initCharts,
        
        // 检查是否已加载
        isLoaded: () => typeof echarts !== 'undefined',
        
        // 检查是否正在加载
        isLoading: () => echartsPromise !== null && typeof echarts === 'undefined',
        
        // 获取加载状态
        getStatus: () => {
            if (typeof echarts !== 'undefined') return 'loaded';
            if (echartsPromise) return 'loading';
            return 'not-loaded';
        }
    };
})();