// 初始化Supabase客户端 - 优化版本
const supabaseUrl = 'https://gxohpxiekmpsmkzkcxfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4b2hweGlla21wc21remtjeGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTg0NDQsImV4cCI6MjA2NTI5NDQ0NH0.sUleRxPQsEMxNqGPWUfZBDbjvDR5huZ7hGQkrHoahqk';
let supabase;

// 性能优化配置
const supabaseOptions = {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // 减少不必要的URL检查
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-client-info': 'health-management-system'
        }
    },
    // 连接池配置
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
};

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey, supabaseOptions);
        console.log('Supabase客户端初始化成功');
    } else {
        throw new Error('Supabase客户端库未正确加载');
    }
} catch (error) {
    console.error('Supabase初始化失败:', error);
    alert('系统初始化失败：' + error.message);
}

// 请求缓存机制
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30秒缓存

// 缓存辅助函数
function getCacheKey(table, params) {
    return `${table}_${JSON.stringify(params)}`;
}

function getCachedData(key) {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    requestCache.set(key, {
        data,
        timestamp: Date.now()
    });

    // 清理过期缓存
    if (requestCache.size > 50) {
        const now = Date.now();
        for (const [k, v] of requestCache.entries()) {
            if (now - v.timestamp > CACHE_DURATION) {
                requestCache.delete(k);
            }
        }
    }
}

// =================================
// 全局状态管理
// =================================
const state = {
    users: [],
    pagination: {
        currentPage: 1,
        pageSize: 10,
        totalUsers: 0,
    },
    dashboardStats: {
        totalUsers: 0,
        diabetesUsers: 0,
        subHealthUsers: 0,
        otherUsers: 0
    },
};

// =================================
// 数据获取与处理
// =================================

// 优化的用户数据加载函数
async function loadUsers() {
    try {
        if (!supabase) throw new Error('Supabase客户端未初始化');

        const { currentPage, pageSize } = state.pagination;
        const cacheKey = getCacheKey('New_user', { currentPage, pageSize });

        // 检查缓存
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            console.log('使用缓存数据');
            state.users = cachedData.data || [];
            state.pagination.totalUsers = cachedData.count || 0;
            updateDashboardStats(cachedData.count, cachedData.data);
            return { success: true, fromCache: true };
        }

        // 使用性能优化的查询
        // 分离计数查询和数据查询以提高性能
        const [countResult, dataResult] = await Promise.all([
            supabase
                .from('New_user')
                .select('*', { count: 'exact', head: true }),
            supabase
                .from('New_user')
                .select('id, name, gender, age, phone, direction, created_at')
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
        ]);

        console.log(`数据库查询完成`);

        if (countResult.error) throw countResult.error;
        if (dataResult.error) throw dataResult.error;

        const result = {
            data: dataResult.data || [],
            count: countResult.count || 0
        };

        // 缓存结果
        setCachedData(cacheKey, result);

        state.users = result.data;
        state.pagination.totalUsers = result.count;

        // 数据加载成功后，直接更新统计信息
        updateDashboardStats(result.count, result.data);

        return { success: true };
    } catch (error) {
        console.error('加载用户数据失败:', error.message);
        showToast('加载用户数据失败: ' + error.message);
        return { success: false, message: error.message };
    }
}

// 更新仪表盘统计数据
function updateDashboardStats(totalCount, userData) {
    state.dashboardStats = {
        totalUsers: totalCount || 0,
        diabetesUsers: userData?.filter(user => user.direction === '糖代谢').length || 0,
        subHealthUsers: userData?.filter(user => user.direction === '亚健康').length || 0,
        otherUsers: userData?.filter(user => user.direction === '其他').length || 0
    };
    renderDashboard();
}

// =================================
// UI渲染
// =================================

// 渲染仪表盘
function renderDashboard() {
    const { totalUsers, diabetesUsers, subHealthUsers, otherUsers } = state.dashboardStats;
    const dashboardHtml = `
        <div class="dashboard-stats">
            <div class="stat-card total">
                <i class="fas fa-users"></i>
                <div class="stat-info">
                    <span class="stat-value">${totalUsers}</span>
                    <span class="stat-label">总用户数</span>
                </div>
            </div>
            <div class="stat-card diabetes">
                <i class="fas fa-heartbeat"></i>
                <div class="stat-info">
                    <span class="stat-value">${diabetesUsers}</span>
                    <span class="stat-label">糖代谢用户</span>
                </div>
            </div>
            <div class="stat-card sub-health">
                <i class="fas fa-stethoscope"></i>
                <div class="stat-info">
                    <span class="stat-value">${subHealthUsers}</span>
                    <span class="stat-label">亚健康用户</span>
                </div>
            </div>
            <div class="stat-card other">
                <i class="fas fa-user-md"></i>
                <div class="stat-info">
                    <span class="stat-value">${otherUsers}</span>
                    <span class="stat-label">其他用户</span>
                </div>
            </div>
        </div>
    `;

    // 渲染到指定的容器
    const container = document.querySelector('.dashboard-stats-container');
    if (container) {
        container.innerHTML = dashboardHtml;
    }
}

// 渲染表格
function renderTable() {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">暂无数据</td></tr>';
        return;
    }
    
    state.users.forEach(user => {
        const row = document.createElement('tr');
        row.dataset.id = user.id;
        
        row.innerHTML = `
            <td><input type="checkbox" class="user-select" data-id="${user.id}"></td>
            <td>${user.name || ''}</td>
            <td>${user.gender || ''}</td>
            <td>${user.age || ''}</td>
            <td>${user.phone || ''}</td>
            <td><span class="direction-tag direction-${user.direction}">${user.direction || ''}</span></td>
            <td class="action-cell">
                <button class="action-btn" onclick="completeProfile(${user.id})"><i class="fas fa-id-card"></i><span>用户档案</span></button>
                <button class="action-btn" onclick="openNavigationReportModal(${user.id})"><i class="fas fa-chart-bar"></i><span>导航报告</span></button>
            </td>
            <td class="action-cell-single">
                <button class="icon-btn" onclick="editUser(${user.id})"><i class="fas fa-edit"></i></button>
                <button class="icon-btn danger" onclick="deleteUser(${user.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    updateSelectedCount();
}

// 更新分页控件
function updatePagination() {
    const { currentPage, totalUsers, pageSize } = state.pagination;
    const totalPages = Math.ceil(totalUsers / pageSize);
    const paginationContainer = document.querySelector('.page-buttons');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.classList.add('page-btn', 'prev');
    prevBtn.disabled = currentPage === 1;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    paginationContainer.appendChild(prevBtn);
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.classList.add('page-btn');
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => changePage(i));
        paginationContainer.appendChild(pageBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.classList.add('page-btn', 'next');
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
    
    const totalRecordsSpan = document.querySelector('.pagination-container > span');
    if (totalRecordsSpan) {
        totalRecordsSpan.textContent = `共 ${totalUsers} 条`;
    }

    const pageJumpInput = document.querySelector('.page-jump input');
    if (pageJumpInput) {
        pageJumpInput.value = currentPage;
        pageJumpInput.max = totalPages;
        
        pageJumpInput.onchange = function() {
            const page = parseInt(this.value, 10);
            if (page >= 1 && page <= totalPages) {
                changePage(page);
            }
        };
    }
}

// 更新选中项计数
function updateSelectedCount() {
    const selectedCheckboxes = document.querySelectorAll('.user-select:checked');
    const selectedCountSpan = document.querySelector('.selected-count');
    if (selectedCountSpan) {
        selectedCountSpan.textContent = `已选择 ${selectedCheckboxes.length} 项`;
    }
}

// =================================
// 事件处理与逻辑
// =================================

// 初始化事件监听
function initUserListEventListeners() {
    document.querySelector('.btn-add')?.addEventListener('click', openAddUserModal);
    document.querySelector('.btn-search')?.addEventListener('click', debounce(filterData, 300));
    document.querySelector('.btn-reset')?.addEventListener('click', resetFilter);
    document.querySelector('.btn-export')?.addEventListener('click', exportData);
    document.querySelector('.page-size')?.addEventListener('change', (e) => changePageSize(parseInt(e.target.value, 10)));
    document.querySelector('.select-all')?.addEventListener('change', function() {
        document.querySelectorAll('.user-select').forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateSelectedCount();
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 切换页码
async function changePage(page) {
    state.pagination.currentPage = page;
    await loadAndRenderUsers();
}

// 切换每页显示数量
async function changePageSize(size) {
    state.pagination.pageSize = size;
    state.pagination.currentPage = 1;
    await loadAndRenderUsers();
}

// 优化的过滤数据函数
async function filterData() {
    try {
        if (!supabase) throw new Error('Supabase客户端未初始化');

        const nameFilter = document.querySelector('.search-inputs input[placeholder="姓名"]')?.value?.trim();
        const phoneFilter = document.querySelector('.search-inputs input[placeholder="手机号"]')?.value?.trim();
        const directionFilter = document.querySelector('.filter-select')?.value;

        // 创建过滤器缓存键
        const filterParams = { nameFilter, phoneFilter, directionFilter, page: 1 };
        const cacheKey = getCacheKey('New_user_filter', filterParams);

        // 检查缓存
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            console.log('使用过滤缓存数据');
            state.users = cachedData.data || [];
            state.pagination.totalUsers = cachedData.count || 0;
            state.pagination.currentPage = 1;
            renderTable();
            updatePagination();
            showToast(`找到 ${state.pagination.totalUsers} 条记录 (缓存)`);
            return;
        }

        state.pagination.currentPage = 1;
        const { currentPage, pageSize } = state.pagination;

        // 优化查询：只选择必要字段，使用索引友好的查询
        let query = supabase
            .from('New_user')
            .select('id, name, gender, age, phone, direction, created_at', { count: 'exact' });

        // 构建查询条件
        const conditions = [];
        if (nameFilter) {
            query = query.ilike('name', `%${nameFilter}%`);
            conditions.push(`name ilike %${nameFilter}%`);
        }
        if (phoneFilter) {
            query = query.ilike('phone', `%${phoneFilter}%`);
            conditions.push(`phone ilike %${phoneFilter}%`);
        }
        if (directionFilter) {
            query = query.eq('direction', directionFilter);
            conditions.push(`direction = ${directionFilter}`);
        }

        query = query
            .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
            .order('created_at', { ascending: false });

        console.log('执行过滤查询:', conditions.join(' AND '));

        const { data, error, count } = await query;

        if (error) throw error;

        console.log(`过滤查询已完成`);

        const result = { data: data || [], count: count || 0 };

        // 缓存过滤结果
        setCachedData(cacheKey, result);

        state.users = result.data;
        state.pagination.totalUsers = result.count;

        renderTable();
        updatePagination();

        showToast(`找到 ${state.pagination.totalUsers} 条记录`);
    } catch (error) {
        console.error('过滤数据失败:', error.message);
        showToast('过滤数据失败: ' + error.message);
    }
}

// 重置过滤器
async function resetFilter() {
    const nameInput = document.querySelector('.search-inputs input[placeholder="姓名"]');
    const phoneInput = document.querySelector('.search-inputs input[placeholder="手机号"]');
    const directionSelect = document.querySelector('.filter-select');
    
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (directionSelect) directionSelect.value = '';
    
    state.pagination.currentPage = 1;
    await loadAndRenderUsers();
}

// 导出数据
async function exportData() {
    try {
        showToast('正在导出所有数据...');
        const { data, error } = await supabase
            .from('New_user')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            showToast('没有数据可导出');
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '用户数据');
        
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `用户数据_${date}.xlsx`);
        
        showToast('数据导出成功');
    } catch (error) {
        console.error('导出数据失败:', error.message);
        showToast('导出数据失败: ' + error.message);
    }
}

// =================================
// 用户模态框 (新增/编辑)
// =================================

// 预创建用户模态框
function createUserModal() {
    if (document.getElementById('userModal')) return;

    const modal = document.createElement('div');
    modal.id = 'userModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="userModalTitle">新增用户</h3>
                <button class="close-btn" onclick="closeUserModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="userForm">
                    <input type="hidden" id="userId">
                    <div class="form-group">
                        <label for="userName">姓名</label>
                        <input type="text" id="userName" required>
                    </div>
                    <div class="form-group">
                        <label for="userGender">性别</label>
                        <select id="userGender" required>
                            <option value="">请选择</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="userAge">年龄</label>
                        <input type="number" id="userAge" min="1" max="120" required>
                    </div>
                    <div class="form-group">
                        <label for="userPhone">手机号</label>
                        <input type="tel" id="userPhone" pattern="[0-9]{11}" required>
                    </div>
                    <div class="form-group">
                        <label for="userDirection">调理方向</label>
                        <select id="userDirection" required>
                            <option value="">请选择</option>
                            <option value="糖代谢">糖代谢</option>
                            <option value="亚健康">亚健康</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="closeUserModal()">取消</button>
                        <button type="submit" class="btn-save">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('userForm').addEventListener('submit', saveUser);
}

// 打开新增用户模态框
function openAddUserModal() {
    const form = document.getElementById('userForm');
    if (!form) {
        createUserModal(); // 如果模态框不存在，先创建
    }
    
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = '新增用户';
    document.getElementById('userModal').style.display = 'flex';
    setTimeout(() => document.getElementById('userName').focus(), 100);
}

// 关闭用户模态框
function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.style.display = 'none';
}

// 保存用户信息
async function saveUser(e) {
    e.preventDefault();
    if (!supabase) throw new Error('Supabase客户端未初始化');
    
    const userId = document.getElementById('userId').value;
    const userData = {
        name: document.getElementById('userName').value,
        gender: document.getElementById('userGender').value,
        age: parseInt(document.getElementById('userAge').value, 10),
        phone: document.getElementById('userPhone').value,
        direction: document.getElementById('userDirection').value
    };
    
    if (!userData.name || !userData.phone) {
        showToast('姓名和电话不能为空');
        return;
    }
    
    showToast('保存中...');
    
    try {
        let query;
        if (userId) {
            // 更新用户
            query = supabase.from('New_user').update(userData).eq('id', userId);
        } else {
            // 添加用户
            query = supabase.from('New_user').insert([userData]);
        }
        
        const { error } = await query;
        if (error) throw error;
        
        closeUserModal();
        showToast(userId ? '用户更新成功' : '添加用户成功');
        await loadAndRenderUsers();
        // 仪表盘数据也需要更新
        const { count, data } = await supabase.from('New_user').select('*', { count: 'exact' });
        updateDashboardStats(count, data);
        
    } catch (error) {
        console.error('保存用户失败:', error.message);
        showToast('保存用户失败: ' + error.message);
    }
}

// 编辑用户
function editUser(userId) {
    try {
        const userToEdit = state.users.find(user => user.id === userId);
        if (!userToEdit) {
            showToast('未找到用户信息，可能数据未同步');
            return;
        }

        openAddUserModal();

        document.getElementById('userId').value = userToEdit.id;
        document.getElementById('userName').value = userToEdit.name || '';
        document.getElementById('userGender').value = userToEdit.gender || '';
        document.getElementById('userAge').value = userToEdit.age || '';
        document.getElementById('userPhone').value = userToEdit.phone || '';
        document.getElementById('userDirection').value = userToEdit.direction || '';
        document.getElementById('userModalTitle').textContent = '编辑用户';

    } catch (error) {
        console.error('打开编辑模态框失败:', error);
        showToast('打开编辑窗口时出错: ' + error.message);
    }
}

// 删除用户
async function deleteUser(userId) {
    showCustomConfirm('确定要删除该用户吗？此操作不可恢复。', async (confirmed) => {
        if (!confirmed) return;
        
        try {
            const { error } = await supabase.from('New_user').delete().eq('id', userId);
            if (error) throw error;
            
            showToast('用户删除成功');
            await loadAndRenderUsers();
            const { count, data } = await supabase.from('New_user').select('*', { count: 'exact' });
            updateDashboardStats(count, data);

        } catch (error) {
            console.error('删除用户失败:', error.message);
            showToast('删除用户失败: ' + error.message);
        }
    });
}

// =================================
// 客户档案模态框
// =================================
// 优化的用户档案加载函数
async function openProfileModal(userId) {
    const modal = document.getElementById('profileModal');
    const form = document.getElementById('profileForm');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('profileUserId').value = userId;

    // 从本地状态获取用户基本信息，避免额外查询
    const user = state.users.find(u => u.id === userId);
    document.getElementById('profileName').textContent = user?.name || 'N/A';
    document.getElementById('profileGender').textContent = user?.gender || 'N/A';
    document.getElementById('profilePhone').textContent = user?.phone || 'N/A';
    document.getElementById('profileFilingDate').textContent = '建档日期: -';

    modal.style.display = 'flex';

    const saveButton = form.querySelector('.btn-save');
    saveButton.disabled = true;
    saveButton.textContent = '加载中...';

    try {
        // 检查缓存
        const cacheKey = getCacheKey('user_profile', { userId });
        const cachedProfile = getCachedData(cacheKey);

        let profile;

        if (cachedProfile) {
            console.log('使用缓存的用户档案数据');
            profile = cachedProfile;
        } else {
            // 性能优化：只选择需要的字段
            const { data, error } = await supabase
                .from('user_profiles')
                .select(`
                    user_id, created_at, date_of_birth, address, diseases,
                    medical_history, conditioning_reason, height, weight,
                    medication_status, conditioning_content, systolic_pressure,
                    diastolic_pressure, fasting_blood_sugar, glycated_hemoglobin,
                    self_management_status, payment_status, estimated_time,
                    other_notes, filler_name, client_source, scheduled_time
                `)
                .eq('user_id', userId)
                .limit(1);

            console.log(`档案加载完成`);

            if (error) throw error;

            profile = data && data.length > 0 ? data[0] : null;

            // 缓存结果
            if (profile) {
                setCachedData(cacheKey, profile);
            }
        }

        if (profile) {
            document.getElementById('profileFilingDate').textContent = `建档日期: ${new Date(profile.created_at).toLocaleDateString()}`;

            // 使用批量赋值优化DOM操作
            const formFields = {
                'profileDob': profile.date_of_birth,
                'profileAddress': profile.address,
                'profileDiseases': profile.diseases,
                'profileMedicalHistory': profile.medical_history,
                'profileConditioningReason': profile.conditioning_reason,
                'profileHeight': profile.height,
                'profileWeight': profile.weight,
                'profileMedicationStatus': profile.medication_status,
                'profileSystolic': profile.systolic_pressure,
                'profileDiastolic': profile.diastolic_pressure,
                'profileFastingSugar': profile.fasting_blood_sugar,
                'profileGlycatedHemoglobin': profile.glycated_hemoglobin,
                'profileSelf_management_status': profile.self_management_status,
                'profilePaymentStatus': profile.payment_status,
                'profileEstimatedTime': profile.estimated_time,
                'profileOtherNotes': profile.other_notes,
                'profileFiller': profile.filler_name,
                'profileClientSource': profile.client_source
            };

            // 批量更新表单值
            Object.entries(formFields).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.value = value || '';
            });

            if (profile.scheduled_time) {
                const d = new Date(profile.scheduled_time);
                const pad = (num) => num.toString().padStart(2, '0');
                const localDatetime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                document.getElementById('profileScheduledTime').value = localDatetime;
            } else {
                document.getElementById('profileScheduledTime').value = '';
            }

            // 优化复选框处理
            if (profile.conditioning_content?.length > 0) {
                const checkboxes = form.querySelectorAll('[name="conditioningContent"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = profile.conditioning_content.includes(checkbox.value);
                });
            }
        }
    } catch (error) {
        console.error('加载档案失败:', error);
        showToast(`加载档案失败: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = '保存档案';
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
}

async function saveProfile(event) {
    event.preventDefault();
    const userId = document.getElementById('profileUserId').value;
    
    const conditioningContent = Array.from(document.querySelectorAll('[name="conditioningContent"]:checked')).map(el => el.value);

    const profileData = {
        user_id: parseInt(userId, 10),
        date_of_birth: document.getElementById('profileDob').value || null,
        address: document.getElementById('profileAddress').value || null,
        diseases: document.getElementById('profileDiseases').value || null,
        medical_history: document.getElementById('profileMedicalHistory').value || null,
        conditioning_reason: document.getElementById('profileConditioningReason').value || null,
        height: document.getElementById('profileHeight').value ? Number(document.getElementById('profileHeight').value) : null,
        weight: document.getElementById('profileWeight').value ? Number(document.getElementById('profileWeight').value) : null,
        medication_status: document.getElementById('profileMedicationStatus').value || null,
        conditioning_content: conditioningContent,
        systolic_pressure: document.getElementById('profileSystolic').value ? parseInt(document.getElementById('profileSystolic').value) : null,
        diastolic_pressure: document.getElementById('profileDiastolic').value ? parseInt(document.getElementById('profileDiastolic').value) : null,
        fasting_blood_sugar: document.getElementById('profileFastingSugar').value ? Number(document.getElementById('profileFastingSugar').value) : null,
        glycated_hemoglobin: document.getElementById('profileGlycatedHemoglobin').value ? Number(document.getElementById('profileGlycatedHemoglobin').value) : null,
        self_management_status: document.getElementById('profileSelf_management_status').value || null,
        payment_status: document.getElementById('profilePaymentStatus').value || null,
        estimated_time: document.getElementById('profileEstimatedTime').value || null,
        other_notes: document.getElementById('profileOtherNotes').value || null,
        filler_name: document.getElementById('profileFiller').value || null,
        client_source: document.getElementById('profileClientSource').value || null,
        scheduled_time: document.getElementById('profileScheduledTime').value ? new Date(document.getElementById('profileScheduledTime').value).toISOString() : null
    };

    console.log('准备保存的档案数据: ', JSON.stringify(profileData, null, 2));

    showToast('正在保存档案...');
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profileData, { onConflict: 'user_id' })
            .select();

        if (error) {
            console.error('Supabase 保存错误:', error);
            throw error;
        }

        console.log('保存成功，返回数据:', data);
        showToast('档案保存成功!');
        closeProfileModal();
    } catch (error) {
        console.error('保存档案失败:', error);
        showToast(`保存档案失败: ${error.message}`);
    }
}

function completeProfile(userId) {
    openProfileModal(userId);
}

// =================================
// 其他模态框与通用函数
// =================================

// 优化的提示消息函数
function showToast(message, autoHide = true) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = 'show';

    if (autoHide) {
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    }

    return toast; // 返回toast元素以便外部控制
}

// 自定义确认框函数
function showCustomConfirm(message, callback) {
    let confirmOverlay = document.querySelector('.custom-confirm-overlay');
    if (confirmOverlay) confirmOverlay.remove();
    
    confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'custom-confirm-overlay';
    
    const confirmBox = document.createElement('div');
    confirmBox.className = 'custom-confirm-box';
    confirmBox.innerHTML = `
        <div class="confirm-header"><h3>确认操作</h3></div>
        <div class="confirm-body"><p>${message}</p></div>
        <div class="confirm-footer">
            <button class="btn-confirm cancel">取消</button>
            <button class="btn-confirm confirm">确定</button>
        </div>
    `;
    
    confirmOverlay.appendChild(confirmBox);
    document.body.appendChild(confirmOverlay);
    
    const cancelBtn = confirmBox.querySelector('.btn-confirm.cancel');
    const confirmBtn = confirmBox.querySelector('.btn-confirm.confirm');
    
    cancelBtn.addEventListener('click', () => {
        confirmOverlay.remove();
        if (callback) callback(false);
    });
    
    confirmBtn.addEventListener('click', () => {
        confirmOverlay.remove();
        if (callback) callback(true);
    });
    
    confirmBtn.focus();
}

function openNavigationReportModal(userId) {
    const modal = document.getElementById('navigationReportModal');
    const reportList = document.getElementById('navigationReportList');

    const reports = [
        { date: '2025-02-13 14:56:19', status: '已完成', type: '常规检查' },
        { date: '2025-02-13 11:52:32', status: '已完成', type: '血糖监测' },
        { date: '2025-02-12 09:41:27', status: '已完成', type: '常规检查' },
    ];

    reportList.innerHTML = reports.map(report => `
        <tr>
            <td>${report.date}</td>
            <td><span class="report-type">${report.type}</span></td>
            <td><span class="status-badge 已完成">${report.status}</span></td>
            <td><button class="btn-view" onclick="viewNavigationReport('${report.date}')">查看</button></td>
        </tr>
    `).join('');
    
    modal.style.display = 'flex';
}

function closeNavigationReportModal() {
    const modal = document.getElementById('navigationReportModal');
    if(modal) modal.style.display = 'none';
}

function viewNavigationReport(date) {
    const pdfUrl = "https://lifetide.oss-cn-beijing.aliyuncs.com/upload/room/data/2025/2/12/601-2405294827-20250212141706891-2104240009.pdf";
    window.open(pdfUrl, '_blank');
}

function logout() {
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}

// =================================
// SPA 页面加载逻辑
// =================================
async function loadContent(url, clickedElement) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div></div>'; // 使用全屏 loading 动画

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`加载失败: ${response.status}`);
        
        const html = await response.text();
        
        // 1. 插入 HTML
        mainContent.innerHTML = html;
        
        // 2. 查找并执行脚本
        const scripts = mainContent.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            // 如果有 src 属性, 也一并复制
            if (script.src) {
                newScript.src = script.src;
            }
            document.head.appendChild(newScript).parentNode.removeChild(newScript);
            script.remove(); // 移除页面中已经存在的 script 标签，避免重复
        });
        
        // 3. 用户列表页面需要特殊初始化
        if (url.includes('user_list.html')) {
            await initUserListPage();
        }

        // 4. 更新侧边栏状态
        if (clickedElement) {
            document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
            clickedElement.classList.add('active');
        }

    } catch (error) {
        console.error('加载内容时出错:', error);
        mainContent.innerHTML = `<div class="error-message">页面加载失败。</div>`;
    }
}

// 页面初始化函数
async function initUserListPage() {
    initUserListEventListeners();
    createUserModal(); // 预创建模态框
    await loadAndRenderUsers();
    renderDashboard(); // 在用户列表页面加载完成后渲染仪表盘
}

// 优化的统一加载和渲染函数
async function loadAndRenderUsers() {
    const loadingToast = showToast('正在加载数据...', false);

    // 使用性能标记
    performance.mark('loadStart');

    // 先渲染表格骨架屏以提高感知性能
    renderTableSkeleton();

    const result = await loadUsers();

    if(result.success) {
        // 使用requestAnimationFrame确保在下一帧渲染，避免阻塞主线程
        window.requestAnimationFrame(() => {
            renderTable();
            updatePagination();

            // 清除性能标记
            performance.clearMarks();
            performance.clearMeasures();

            console.log(`数据加载和渲染完成`);

            if (loadingToast) {
                loadingToast.textContent = `数据加载完成`;
                setTimeout(() => {
                    loadingToast.className = loadingToast.className.replace('show', '');
                }, 2000);
            } else {
                showToast(`数据加载完成`);
            }
        });
    } else {
        if (loadingToast) {
            loadingToast.className = loadingToast.className.replace('show', '');
        }
    }
}

// 渲染表格骨架屏
function renderTableSkeleton() {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // 创建骨架行
    for (let i = 0; i < state.pagination.pageSize; i++) {
        const row = document.createElement('tr');
        row.className = 'skeleton-row';

        row.innerHTML = `
            <td><div class="skeleton-checkbox"></div></td>
            <td><div class="skeleton-text"></div></td>
            <td><div class="skeleton-text short"></div></td>
            <td><div class="skeleton-text short"></div></td>
            <td><div class="skeleton-text"></div></td>
            <td><div class="skeleton-tag"></div></td>
            <td><div class="skeleton-buttons"></div></td>
            <td><div class="skeleton-icons"></div></td>
        `;

        tbody.appendChild(row);
    }

    // 添加骨架屏样式
    if (!document.getElementById('skeleton-styles')) {
        const style = document.createElement('style');
        style.id = 'skeleton-styles';
        style.textContent = `
            .skeleton-row td div {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 4px;
                height: 20px;
            }
            .skeleton-text { width: 80%; }
            .skeleton-text.short { width: 40%; }
            .skeleton-checkbox { width: 16px; height: 16px; border-radius: 3px; }
            .skeleton-tag { width: 60%; height: 24px; border-radius: 12px; }
            .skeleton-buttons { width: 90%; height: 32px; border-radius: 4px; }
            .skeleton-icons { width: 60px; }
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// 性能监控函数
function monitorPerformance() {
    // 监控网络请求性能
    if (window.PerformanceObserver) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    // 只关注Supabase API请求
                    if (entry.name.includes('supabase.co') && entry.initiatorType === 'fetch') {
                        console.log(`API请求: ${entry.name.split('?')[0]}`);
                        console.log(`  耗时: ${entry.duration.toFixed(2)}ms`);
                        console.log(`  开始时间: ${entry.startTime.toFixed(2)}ms`);
                        console.log(`  传输大小: ${(entry.transferSize / 1024).toFixed(2)}KB`);

                        // 记录慢请求
                        if (entry.duration > 500) {
                            console.warn(`⚠️ 慢请求检测: ${entry.name.split('?')[0]} (${entry.duration.toFixed(0)}ms)`);
                        }
                    }
                });
            });

            observer.observe({ entryTypes: ['resource'] });
            console.log('性能监控已启用');
        } catch (e) {
            console.error('性能监控初始化失败:', e);
        }
    }

    // 监控长任务
    if (window.PerformanceObserver) {
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.warn(`⚠️ 检测到长任务: ${entry.duration.toFixed(2)}ms`);
                });
            });

            longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (e) {
            console.error('长任务监控初始化失败:', e);
        }
    }
}

// 页面首次加载时执行
document.addEventListener('DOMContentLoaded', () => {
    console.time('页面初始化');

    // 启用性能监控
    monitorPerformance();

    // 预热连接到Supabase
    const linkPreconnect = document.createElement('link');
    linkPreconnect.rel = 'preconnect';
    linkPreconnect.href = 'https://gxohpxiekmpsmkzkcxfc.supabase.co';
    document.head.appendChild(linkPreconnect);

    const initialElement = document.querySelector('.sidebar li.active');
    if (initialElement) {
        loadContent('partials/user_list.html', initialElement);
    }

    // 全局ESC关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeUserModal();
            closeProfileModal();
            closeNavigationReportModal();
        }
    });

    console.timeEnd('页面初始化');

    // 添加网络状态监控
    window.addEventListener('online', () => {
        showToast('网络已连接', true);
        // 网络恢复后可以刷新数据
        if (document.querySelector('.data-table')) {
            loadAndRenderUsers();
        }
    });

    window.addEventListener('offline', () => {
        showToast('网络已断开，部分功能可能不可用', true);
    });
});
