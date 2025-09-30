// Supabase 性能优化配置文件
// 使用方法：在主页面引入此文件，然后调用 initPerformanceOptimizations()

// 数据库索引建议
const RECOMMENDED_INDEXES = {
    'New_user': [
        'CREATE INDEX IF NOT EXISTS idx_new_user_created_at ON "New_user" (created_at DESC);',
        'CREATE INDEX IF NOT EXISTS idx_new_user_name ON "New_user" USING gin (name gin_trgm_ops);',
        'CREATE INDEX IF NOT EXISTS idx_new_user_phone ON "New_user" (phone);',
        'CREATE INDEX IF NOT EXISTS idx_new_user_direction ON "New_user" (direction);',
        'CREATE INDEX IF NOT EXISTS idx_new_user_composite ON "New_user" (direction, created_at DESC);'
    ],
    'user_profiles': [
        'CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);',
        'CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles (created_at DESC);'
    ]
};

// 查询优化配置
const QUERY_OPTIMIZATIONS = {
    // 分页查询优化
    pagination: {
        defaultPageSize: 8, // 减少默认分页大小以提高初始加载速度
        maxPageSize: 50,
        prefetchNextPage: false // 禁用预取以减少不必要的查询
    },
    
    // 字段选择优化
    fieldSelection: {
        'New_user': {
            list: 'id, name, gender, age, phone, direction, created_at',
            detail: 'id, name, gender, age, phone, direction, created_at', // 限制详情页字段
            search: 'id, name, phone, direction, created_at'
        },
        'user_profiles': {
            list: 'user_id, created_at, filler_name',
            detail: 'user_id, created_at, date_of_birth, address, diseases, medical_history, conditioning_reason, height, weight, medication_status, conditioning_content, systolic_pressure, diastolic_pressure, fasting_blood_sugar, glycated_hemoglobin, self_management_status, payment_status, estimated_time, other_notes, filler_name, client_source, scheduled_time' // 明确指定所有字段
        }
    },
    
    // 缓存配置
    cache: {
        defaultTTL: 60000, // 60秒 (增加一倍缓存时间)
        maxSize: 100,
        strategies: {
            'user_list': { ttl: 120000, priority: 'high' }, // 2分钟
            'user_profile': { ttl: 600000, priority: 'medium' }, // 10分钟
            'dashboard_stats': { ttl: 240000, priority: 'high' } // 4分钟
        }
    }
};

// 连接池优化配置
const CONNECTION_CONFIG = {
    // 连接池设置
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
    },
    
    // 请求重试配置
    retry: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 10000
    }
};

// 性能监控配置
const PERFORMANCE_CONFIG = {
    // 慢查询阈值
    slowQueryThreshold: 1000, // ms (提高到1秒，减少误报)
    
    // 监控指标
    metrics: {
        trackQueryTime: true,
        trackCacheHitRate: true,
        trackErrorRate: true,
        trackNetworkLatency: true
    },
    
    // 报告配置
    reporting: {
        enabled: true,
        interval: 120000, // 2分钟 (减少监控频率)
        endpoint: null // 可配置发送到监控服务
    }
};

// 批量操作优化
const BATCH_CONFIG = {
    // 批量插入配置
    insert: {
        batchSize: 100,
        timeout: 30000
    },
    
    // 批量更新配置
    update: {
        batchSize: 50,
        timeout: 30000
    },
    
    // 批量删除配置
    delete: {
        batchSize: 50,
        timeout: 30000
    }
};

// 网络优化配置
const NETWORK_CONFIG = {
    // 请求压缩
    compression: true,
    
    // 连接复用
    keepAlive: true,
    
    // 预连接
    preconnect: [
        'https://gxohpxiekmpsmkzkcxfc.supabase.co'
    ],
    
    // DNS预解析
    dnsPrefetch: [
        'gxohpxiekmpsmkzkcxfc.supabase.co'
    ]
};

// 初始化性能优化
function initPerformanceOptimizations() {
    // 生产环境日志控制
    const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const debugLog = IS_PRODUCTION ? () => {} : console.log;
    
    debugLog('🚀 初始化Supabase性能优化...');
    
    // 1. 设置DNS预解析和预连接
    setupNetworkOptimizations();
    
    // 2. 初始化智能缓存
    initSmartCache();
    
    // 3. 设置请求拦截器
    if (!IS_PRODUCTION) {
        setupRequestInterceptor();
    }
    
    // 4. 初始化性能监控
    if (!IS_PRODUCTION) {
        initPerformanceMonitoring();
    }
    
    // 5. 设置连接池监控
    if (!IS_PRODUCTION) {
        setupConnectionPoolMonitoring();
    }
    
    debugLog('✅ Supabase性能优化初始化完成');
}

// 设置网络优化
function setupNetworkOptimizations() {
    // DNS预解析
    NETWORK_CONFIG.dnsPrefetch.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = `//${domain}`;
        document.head.appendChild(link);
    });
    
    // 预连接
    NETWORK_CONFIG.preconnect.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
    });
}

// 智能缓存系统
class SmartCache {
    constructor(config) {
        this.cache = new Map();
        this.config = config;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return item.data;
    }
    
    set(key, data, ttl = this.config.defaultTTL) {
        // 检查缓存大小限制
        if (this.cache.size >= this.config.maxSize) {
            this.evictLRU();
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
            accessCount: 1
        });
    }
    
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
            size: this.cache.size
        };
    }
    
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, evictions: 0 };
    }
}

// 全局缓存实例
let smartCache;

function initSmartCache() {
    smartCache = new SmartCache(QUERY_OPTIMIZATIONS.cache);
    
    // 定期清理过期缓存
    setInterval(() => {
        const now = Date.now();
        for (const [key, item] of smartCache.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                smartCache.cache.delete(key);
            }
        }
    }, 60000); // 每分钟清理一次
}

// 请求拦截器
function setupRequestInterceptor() {
    // 这里可以添加请求拦截逻辑
    if (typeof console !== 'undefined' && console.log) {
        console.log('📡 请求拦截器已设置');
    }
}

// 性能监控
function initPerformanceMonitoring() {
    if (!PERFORMANCE_CONFIG.metrics.trackQueryTime) return;
    
    // 监控API请求性能
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const startTime = performance.now();
        const url = args[0];
        
        try {
            const response = await originalFetch.apply(this, args);
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 记录慢查询
            if (duration > PERFORMANCE_CONFIG.slowQueryThreshold) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn(`🐌 慢查询检测: ${url} (${duration.toFixed(2)}ms)`);
                }
            }
            
            return response;
        } catch (error) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (typeof console !== 'undefined' && console.error) {
                console.error(`❌ 请求失败: ${url} (${duration.toFixed(2)}ms)`, error);
            }
            throw error;
        }
    };
}

// 连接池监控
function setupConnectionPoolMonitoring() {
    // 定期报告缓存统计
    if (PERFORMANCE_CONFIG.reporting.enabled) {
        setInterval(() => {
            if (smartCache && typeof console !== 'undefined' && console.log) {
                const stats = smartCache.getStats();
                console.log('📊 缓存统计:', stats);
            }
        }, PERFORMANCE_CONFIG.reporting.interval);
    }
}

// 查询优化辅助函数
function getOptimizedFields(table, type = 'list') {
    return QUERY_OPTIMIZATIONS.fieldSelection[table]?.[type] || '*';
}

// 批量操作辅助函数
function createBatchProcessor(operation, config) {
    let batch = [];
    let timer = null;
    
    return function(item) {
        batch.push(item);
        
        if (timer) clearTimeout(timer);
        
        if (batch.length >= config.batchSize) {
            processBatch();
        } else {
            timer = setTimeout(processBatch, 100); // 100ms延迟批处理
        }
        
        function processBatch() {
            if (batch.length === 0) return;
            
            const currentBatch = [...batch];
            batch = [];
            
            if (typeof console !== 'undefined' && console.log) {
                console.log(`🔄 执行批量${operation}:`, currentBatch.length, '项');
            }
            // 这里执行实际的批量操作
        }
    };
}

// 导出配置和函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RECOMMENDED_INDEXES,
        QUERY_OPTIMIZATIONS,
        CONNECTION_CONFIG,
        PERFORMANCE_CONFIG,
        BATCH_CONFIG,
        NETWORK_CONFIG,
        initPerformanceOptimizations,
        SmartCache,
        getOptimizedFields,
        createBatchProcessor
    };
} else {
    // 浏览器环境
    window.PerformanceConfig = {
        RECOMMENDED_INDEXES,
        QUERY_OPTIMIZATIONS,
        CONNECTION_CONFIG,
        PERFORMANCE_CONFIG,
        BATCH_CONFIG,
        NETWORK_CONFIG,
        initPerformanceOptimizations,
        SmartCache,
        getOptimizedFields,
        createBatchProcessor
    };
}
