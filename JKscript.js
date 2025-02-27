// 用户数据
const userData = [
    {
        id: 1,
        name: '张明',
        gender: '男',
        age: 37,
        phone: '13812345671',
        direction: '糖代谢'
    },
    {
        id: 2,
        name: '李芳',
        gender: '女',
        age: 42,
        phone: '13912345672',
        direction: '亚健康'
    },
    {
        id: 3,
        name: '王强',
        gender: '男',
        age: 45,
        phone: '13712345673',
        direction: '其他'
    },
    {
        id: 4,
        name: '刘静',
        gender: '女',
        age: 28,
        phone: '13612345674',
        direction: '糖代谢'
    },
    {
        id: 5,
        name: '陈勇',
        gender: '男',
        age: 52,
        phone: '13512345675',
        direction: '亚健康'
    },
    {
        id: 6,
        name: '周娜',
        gender: '女',
        age: 33,
        phone: '13412345676',
        direction: '其他'
    },
    {
        id: 7,
        name: '杨光',
        gender: '男',
        age: 41,
        phone: '13312345677',
        direction: '糖代谢'
    },
    {
        id: 8,
        name: '赵雪',
        gender: '女',
        age: 29,
        phone: '13212345678',
        direction: '亚健康'
    },
    {
        id: 9,
        name: '孙伟',
        gender: '男',
        age: 47,
        phone: '13112345679',
        direction: '其他'
    },
    {
        id: 10,
        name: '林萍',
        gender: '女',
        age: 35,
        phone: '13012345680',
        direction: '糖代谢'
    },
    {
        id: 11,
        name: '朱峰',
        gender: '男',
        age: 39,
        phone: '13912345681',
        direction: '亚健康'
    },
    {
        id: 12,
        name: '郑洁',
        gender: '女',
        age: 31,
        phone: '13812345682',
        direction: '其他'
    },
    {
        id: 13,
        name: '黄博',
        gender: '男',
        age: 44,
        phone: '13712345683',
        direction: '糖代谢'
    },
    {
        id: 14,
        name: '马丽',
        gender: '女',
        age: 38,
        phone: '13612345684',
        direction: '亚健康'
    },
    {
        id: 15,
        name: '徐涛',
        gender: '男',
        age: 49,
        phone: '13512345685',
        direction: '其他'
    },
    {
        id: 16,
        name: '胡婷',
        gender: '女',
        age: 34,
        phone: '13412345686',
        direction: '糖代谢'
    },
    {
        id: 17,
        name: '曾刚',
        gender: '男',
        age: 43,
        phone: '13312345687',
        direction: '亚健康'
    },
    {
        id: 18,
        name: '彭燕',
        gender: '女',
        age: 36,
        phone: '13212345688',
        direction: '其他'
    },
    {
        id: 19,
        name: '邓强',
        gender: '男',
        age: 46,
        phone: '13112345689',
        direction: '糖代谢'
    },
    {
        id: 20,
        name: '谢琳',
        gender: '女',
        age: 32,
        phone: '13012345690',
        direction: '亚健康'
    },
    {
        id: 21,
        name: '罗军',
        gender: '男',
        age: 51,
        phone: '13912345691',
        direction: '其他'
    },
    {
        id: 22,
        name: '韩丽',
        gender: '女',
        age: 32,
        phone: '13812345692',
        direction: '糖代谢'
    },
    {
        id: 23,
        name: '唐波',
        gender: '男',
        age: 48,
        phone: '13712345693',
        direction: '亚健康'
    },
    {
        id: 24,
        name: '曾玲',
        gender: '女',
        age: 30,
        phone: '13612345694',
        direction: '其他'
    }
];

// 分页相关变量
let currentPage = 1;
let pageSize = 10;

// 添加数据统计信息
const dashboardStats = {
    totalUsers: userData.length,
    diabetesUsers: userData.filter(u => u.direction === '糖代谢').length,
    subHealthUsers: userData.filter(u => u.direction === '亚健康').length,
    otherUsers: userData.filter(u => u.direction === '其他').length
};

// 添加仪表盘渲染函数
function renderDashboard() {
    const dashboardHtml = `
        <div class="dashboard-stats">
            <div class="stat-card total">
                <i class="fas fa-users"></i>
                <div class="stat-info">
                    <span class="stat-value">${dashboardStats.totalUsers}</span>
                    <span class="stat-label">总用户数</span>
                </div>
            </div>
            <div class="stat-card diabetes">
                <i class="fas fa-heartbeat"></i>
                <div class="stat-info">
                    <span class="stat-value">${dashboardStats.diabetesUsers}</span>
                    <span class="stat-label">糖代谢用户</span>
                </div>
            </div>
            <div class="stat-card sub-health">
                <i class="fas fa-stethoscope"></i>
                <div class="stat-info">
                    <span class="stat-value">${dashboardStats.subHealthUsers}</span>
                    <span class="stat-label">亚健康用户</span>
                </div>
            </div>
            <div class="stat-card other">
                <i class="fas fa-user-md"></i>
                <div class="stat-info">
                    <span class="stat-value">${dashboardStats.otherUsers}</span>
                    <span class="stat-label">其他用户</span>
                </div>
            </div>
        </div>
    `;

    const mainContent = document.querySelector('.main-content');
    mainContent.insertAdjacentHTML('afterbegin', dashboardHtml);
}

// 修改表格渲染函数，保持原有数据结构
function renderTable() {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, userData.length);
    const pageData = userData.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" value="${user.id}"></td>
            <td>${user.name}</td>
            <td>${user.gender}</td>
            <td>${user.age}</td>
            <td>${user.phone}</td>
            <td><span class="direction-tag ${user.direction}">${user.direction}</span></td>
            <td>
                <button class="btn-complete" onclick="completeProfile(${user.id})">用户档案</button>
            </td>
            <td><button class="btn-view-log">查看日志</button></td>
            <td>
                <div class="report-dropdown">
                    <button class="btn-report" onclick="toggleDropdown(event)">查看报告</button>
                    <div class="dropdown-content" style="display: none;">
                        <a href="#" data-type="navigation" onclick="viewReport('navigation')">导航报告</a>
                        <a href="#" data-type="sleep" onclick="viewReport('sleep')">睡眠报告</a>
                        <a href="#" data-type="assessment" onclick="viewReport('assessment')">健康测评报告</a>
                    </div>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view">查看</button>
                    <button class="btn-edit">编辑</button>
                    <button class="btn-delete">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination();
}

// 初始化函数
window.onload = function() {
    renderDashboard();
    renderTable();
    loadUserProfile();
};

// 更新分页控件
function updatePagination() {
    const totalPages = Math.ceil(userData.length / pageSize);
    const paginationDiv = document.querySelector('.pagination');
    
    // 更新总条数显示
    const totalCount = paginationDiv.querySelector('span');
    totalCount.textContent = `共 ${userData.length} 条`;

    // 更新页码按钮
    const pageButtons = paginationDiv.querySelector('.page-buttons');
    pageButtons.innerHTML = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-angle-left"></i>
        </button>
    `;

    // 生成页码按钮
    for (let i = 1; i <= totalPages; i++) {
        pageButtons.innerHTML += `
            <button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    pageButtons.innerHTML += `
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-angle-right"></i>
        </button>
    `;

    // 更新页码跳转输入框
    const pageJump = paginationDiv.querySelector('.page-jump input');
    if (pageJump) {
        pageJump.value = currentPage;
        pageJump.max = totalPages;
    }
}

// 切换页码
function changePage(page) {
    const totalPages = Math.ceil(userData.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// 切换每页显示数量
function changePageSize(size) {
    pageSize = parseInt(size);
    currentPage = 1; // 重置到第一页
    renderTable();
}

// 修改筛选和渲染相关函数
function filterData() {
    const direction = document.querySelector('.filter-select').value;
    const nameInput = document.querySelector('input[placeholder="姓名"]').value;
    const phoneInput = document.querySelector('input[placeholder="手机号"]').value;

    // 筛选数据
    const filteredData = userData.filter(user => {
        const directionMatch = direction ? user.direction === direction : true;
        const nameMatch = nameInput ? user.name.includes(nameInput) : true;
        const phoneMatch = phoneInput ? user.phone.includes(phoneInput) : true;
        return directionMatch && nameMatch && phoneMatch;
    });

    // 重置页码并渲染
    currentPage = 1;
    renderFilteredTable(filteredData);
}

function renderFilteredTable(filteredData) {
    const tbody = document.querySelector('.data-table tbody');
    if (!tbody) return;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageData.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" value="${user.id}"></td>
            <td>${user.name}</td>
            <td>${user.gender}</td>
            <td>${user.age}</td>
            <td>${user.phone}</td>
            <td><span class="direction-tag ${user.direction}">${user.direction}</span></td>
            <td>
                <button class="btn-complete" onclick="completeProfile(${user.id})">用户档案</button>
            </td>
            <td><button class="btn-view-log">查看日志</button></td>
            <td>
                <div class="report-dropdown">
                    <button class="btn-report" onclick="toggleDropdown(event)">查看报告</button>
                    <div class="dropdown-content" style="display: none;">
                        <a href="#" data-type="navigation" onclick="viewReport('navigation')">导航报告</a>
                        <a href="#" data-type="sleep" onclick="viewReport('sleep')">睡眠报告</a>
                        <a href="#" data-type="assessment" onclick="viewReport('assessment')">健康测评报告</a>
                    </div>
                </div>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view">查看</button>
                    <button class="btn-edit">编辑</button>
                    <button class="btn-delete">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updatePagination(filteredData.length);
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 渲染初始表格
    renderTable();

    // 每页显示数量切换
    const pageSizeSelect = document.querySelector('.page-size');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            changePageSize(e.target.value);
        });
    }

    // 页码跳转
    const pageJumpInput = document.querySelector('.page-jump input');
    if (pageJumpInput) {
        pageJumpInput.addEventListener('change', (e) => {
            const page = parseInt(e.target.value);
            changePage(page);
        });
    }

    // 全选功能
    const selectAll = document.querySelector('.select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.data-table tbody input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = this.checked);
        });
    }

    // 添加筛选事件监听
    const filterSelect = document.querySelector('.filter-select');
    const searchBtn = document.querySelector('.btn-search');
    const resetBtn = document.querySelector('.btn-reset');

    if (filterSelect) {
        filterSelect.addEventListener('change', filterData);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', filterData);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 重置筛选条件
            document.querySelector('.filter-select').value = '';
            document.querySelector('input[placeholder="姓名"]').value = '';
            document.querySelector('input[placeholder="手机号"]').value = '';
            // 重新渲染原始数据
            currentPage = 1;
            renderTable();
        });
    }
});

// 添加显示提示信息的函数
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 修改完善档案函数
function completeProfile(userId) {
    const user = userData.find(u => u.id === userId);
    if (!user) return;

    // 先移除可能存在的旧模态框
    const oldModal = document.getElementById('profileModal');
    if (oldModal) {
        oldModal.remove();
    }

    const modalHtml = `
        <div class="modal-overlay" id="profileModal">
            <div class="modal-content" style="width: 95%; max-width: 1200px;">
                <div class="modal-header">
                    <h3>完善用户档案 - ${user.name}</h3>
                    <button type="button" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="profileForm" class="profile-form">
                        <!-- 第一行：基本信息 -->
                        <div class="form-section">
                            <h4 class="section-title">基本信息</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>姓名</label>
                                    <input type="text" name="name" value="${user.name}" required>
                                </div>
                                <div class="form-group">
                                    <label>性别</label>
                                    <select name="gender" required>
                                        <option value="男" ${user.gender === '男' ? 'selected' : ''}>男</option>
                                        <option value="女" ${user.gender === '女' ? 'selected' : ''}>女</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>出生日期</label>
                                    <input type="date" name="birthDate" required>
                                </div>
                                <div class="form-group">
                                    <label>电话</label>
                                    <input type="tel" name="phone" value="${user.phone}" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="width: 100%;">
                                    <label>住址</label>
                                    <input type="text" name="address" placeholder="请输入住址">
                                </div>
                            </div>
                        </div>

                        <!-- 第二行：健康状况 -->
                        <div class="form-section">
                            <h4 class="section-title">健康状况</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>有何种疾病</label>
                                    <input type="text" name="disease" placeholder="请输入疾病">
                                </div>
                                <div class="form-group">
                                    <label>病史</label>
                                    <input type="text" name="medicalHistory" placeholder="请输入病史">
                                </div>
                                <div class="form-group">
                                    <label>调理原因</label>
                                    <input type="text" name="treatmentReason" placeholder="请输入调理原因">
                                </div>
                            </div>
                        </div>

                        <!-- 第三行：身体指标 -->
                        <div class="form-section">
                            <h4 class="section-title">身体指标</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>身高 (cm)</label>
                                    <input type="number" name="height" placeholder="请输入身高">
                                </div>
                                <div class="form-group">
                                    <label>体重 (kg)</label>
                                    <input type="number" name="weight" placeholder="请输入体重">
                                </div>
                                <div class="form-group">
                                    <label>BMI</label>
                                    <input type="text" name="bmi" readonly>
                                </div>
                                <div class="form-group double-width">
                                    <label>血压</label>
                                    <div class="blood-pressure-inputs">
                                        <input type="text" name="systolicPressure" placeholder="收缩压">
                                        <span>/</span>
                                        <input type="text" name="diastolicPressure" placeholder="舒张压">
                                    </div>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>空腹血糖</label>
                                    <input type="text" name="bloodSugar" placeholder="请输入空腹血糖">
                                </div>
                                <div class="form-group">
                                    <label>糖化血红蛋白</label>
                                    <input type="text" name="glycatedHemoglobin" placeholder="请输入糖化血红蛋白">
                                </div>
                            </div>
                        </div>

                        <!-- 第四行：管理信息 -->
                        <div class="form-section">
                            <h4 class="section-title">管理信息</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>自我管理情况</label>
                                    <textarea name="selfManagement" rows="3" placeholder="请输入自我管理情况"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>用药情况</label>
                                    <textarea name="medication" rows="3" placeholder="请输入用药情况"></textarea>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>交费情况</label>
                                    <textarea name="paymentStatus" rows="3" placeholder="请输入交费情况"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>预计时间</label>
                                    <input type="datetime-local" name="scheduledTime">
                                </div>
                            </div>
                        </div>

                        <!-- 第五行：其他信息 -->
                        <div class="form-section">
                            <h4 class="section-title">其他信息</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>其他</label>
                                    <textarea name="otherInfo" rows="3" placeholder="请输入其他信息"></textarea>
                                </div>
                                <div class="form-group">
                                    <label>填表人</label>
                                    <input type="text" name="filler" placeholder="请输入填表人">
                                </div>
                                <div class="form-group">
                                    <label>客户来源</label>
                                    <input type="text" name="source" placeholder="请输入客户来源">
                                </div>
                                <div class="form-group">
                                    <label>安排时间</label>
                                    <input type="datetime-local" name="scheduleDate">
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn-save">保存档案</button>
                            <button type="button" class="btn-preview">预览打印</button>
                            <button type="button" class="btn-cancel">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 获取新创建的模态框和相关按钮
    const modal = document.getElementById('profileModal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const previewBtn = modal.querySelector('.btn-preview');
    const form = modal.querySelector('form');

    // 绑定关闭按钮事件
    closeBtn.addEventListener('click', closeProfileModal);
    
    // 绑定取消按钮事件
    cancelBtn.addEventListener('click', closeProfileModal);
    
    // 修改预览按钮事件绑定
    previewBtn.addEventListener('click', function() {
        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());
        previewProfile(profileData);
    });

    // 绑定表单提交事件
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfile(this);
    });

    // 自动计算BMI
    const heightInput = modal.querySelector('input[name="height"]');
    const weightInput = modal.querySelector('input[name="weight"]');
    const bmiInput = modal.querySelector('input[name="bmi"]');

    const calculateBMI = () => {
        const height = parseFloat(heightInput.value) / 100;
        const weight = parseFloat(weightInput.value);
        if (height && weight) {
            const bmi = (weight / (height * height)).toFixed(1);
            bmiInput.value = bmi;
        } else {
            bmiInput.value = '';
        }
    };

    heightInput.addEventListener('input', calculateBMI);
    weightInput.addEventListener('input', calculateBMI);

    // 加载用户信息
    loadProfile(user);
}

// 修改保存档案函数
function saveProfile(form) {
    const formData = new FormData(form);
    const profileData = Object.fromEntries(formData.entries());
    
    // 计算BMI
    const height = parseFloat(profileData.height) / 100;
    const weight = parseFloat(profileData.weight);
    if (height && weight) {
        profileData.bmi = (weight / (height * height)).toFixed(1);
    }
    
    // 保存用户信息到 localStorage
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    
    // 关闭模态框并显示成功提示
    closeProfileModal();
    showToast(`档案保存成功！用户：${profileData.name}`);
}

// 修改关闭模态框函数
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.remove();
    }
}

// 修改 loadProfile 函数以匹配新的表单字段
function loadProfile(user) {
    // 获取当前模态框
    const modal = document.getElementById('profileModal');
    
    // 基本信息
    modal.querySelector('input[name="name"]').value = user.name || '';
    modal.querySelector('select[name="gender"]').value = user.gender || '男';
    modal.querySelector('input[name="birthDate"]').value = user.birthDate || '';
    modal.querySelector('input[name="phone"]').value = user.phone || '';
    modal.querySelector('input[name="address"]').value = user.address || '';

    // 健康信息
    modal.querySelector('input[name="disease"]').value = user.disease || '';
    modal.querySelector('input[name="medicalHistory"]').value = user.medicalHistory || '';
    modal.querySelector('input[name="treatmentReason"]').value = user.treatmentReason || '';

    // 身体指标
    modal.querySelector('input[name="height"]').value = user.height || '';
    modal.querySelector('input[name="weight"]').value = user.weight || '';
    modal.querySelector('input[name="bmi"]').value = user.bmi || '';

    // 血压和血糖
    modal.querySelector('input[name="systolicPressure"]').value = user.systolicPressure || '';
    modal.querySelector('input[name="diastolicPressure"]').value = user.diastolicPressure || '';
    modal.querySelector('input[name="bloodSugar"]').value = user.bloodSugar || '';
    modal.querySelector('input[name="glycatedHemoglobin"]').value = user.glycatedHemoglobin || '';

    // 管理信息
    modal.querySelector('textarea[name="selfManagement"]').value = user.selfManagement || '';
    modal.querySelector('textarea[name="medication"]').value = user.medication || '';
    modal.querySelector('textarea[name="paymentStatus"]').value = user.paymentStatus || '';
    modal.querySelector('input[name="scheduledTime"]').value = user.scheduledTime || '';

    // 其他信息
    modal.querySelector('textarea[name="otherInfo"]').value = user.otherInfo || '';
    modal.querySelector('input[name="filler"]').value = user.filler || '';
    modal.querySelector('input[name="source"]').value = user.source || '';
    modal.querySelector('input[name="scheduleDate"]').value = user.scheduleDate || '';

    // 如果有身高和体重，自动计算 BMI
    if (user.height && user.weight) {
        const height = parseFloat(user.height) / 100;
        const weight = parseFloat(user.weight);
        const bmiInput = modal.querySelector('input[name="bmi"]');
        if (bmiInput && height && weight) {
            bmiInput.value = (weight / (height * height)).toFixed(1);
        }
    }
}

// 修改 previewProfile 函数
function previewProfile(profileData) {
    const printWindow = window.open('', '_blank');
    
    // 计算 BMI
    let bmi = '';
    if (profileData.height && profileData.weight) {
        const height = parseFloat(profileData.height) / 100;
        const weight = parseFloat(profileData.weight);
        bmi = (weight / (height * height)).toFixed(1);
    }

    printWindow.document.write(`
        <html>
        <head>
            <title>生命潮健康管理中心 - 用户档案</title>
            <style>
                @page {
                    size: A4;
                    margin: 2.5cm 3cm;
                }
                body {
                    font-family: '微软雅黑', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .report-container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid #2196F3;
                }
                .header h1 {
                    font-size: 22px;
                    color: #2196F3;
                    margin: 0 0 8px 0;
                }
                .header p {
                    font-size: 14px;
                    color: #666;
                    margin: 4px 0;
                }
                .info-section {
                    margin-bottom: 20px;
                }
                .section-title {
                    font-size: 15px;
                    color: #2196F3;
                    margin-bottom: 12px;
                    padding-left: 10px;
                    border-left: 3px solid #2196F3;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .info-item {
                    display: flex;
                    align-items: baseline;
                    padding: 4px 0;
                }
                .info-label {
                    min-width: 90px;
                    color: #666;
                    font-weight: 500;
                }
                .info-value {
                    flex: 1;
                }
                .health-tag {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 12px;
                    margin-left: 6px;
                }
                .normal { background: #e8f5e9; color: #2e7d32; }
                .warning { background: #fff3e0; color: #ef6c00; }
                .danger { background: #ffebee; color: #c62828; }
                .signature-area {
                    margin-top: 25px;
                    display: flex;
                    justify-content: space-between;
                    padding-top: 15px;
                }
                .sign-box {
                    text-align: center;
                    margin-top: 15px;
                }
                .sign-line {
                    border-top: 1px solid #999;
                    width: 180px;
                    margin: 8px auto;
                    padding-top: 5px;
                }
                @media print {
                    .no-print { display: none; }
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="header">
                    <h1>生命潮健康管理中心</h1>
                    <p>用户健康档案报告</p>
                    <p>报告编号：HC${new Date().getTime().toString().slice(-8)}</p>
                </div>

                <div class="info-section">
                    <div class="section-title">基本信息</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">姓名：</span>
                            <span class="info-value">${profileData.name || '--'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">性别：</span>
                            <span class="info-value">${profileData.gender || '--'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">出生日期：</span>
                            <span class="info-value">${profileData.birthDate || '--'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">联系电话：</span>
                            <span class="info-value">${profileData.phone || '--'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">住址：</span>
                            <span class="info-value">${profileData.address || '--'}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="section-title">健康指标</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">身高/体重：</span>
                            <span class="info-value">
                                ${profileData.height || '--'} cm / ${profileData.weight || '--'} kg
                                ${bmi ? `<span class="health-tag ${getBMIStatus(bmi)}">BMI: ${bmi}</span>` : ''}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">血压：</span>
                            <span class="info-value">
                                ${profileData.systolicPressure || '--'}/${profileData.diastolicPressure || '--'} mmHg
                                ${profileData.systolicPressure ? 
                                    `<span class="health-tag ${getBloodPressureStatus(profileData.systolicPressure, profileData.diastolicPressure)}">
                                        ${getPressureLevel(profileData.systolicPressure, profileData.diastolicPressure)}
                                    </span>` : ''}
                            </span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">空腹血糖：</span>
                            <span class="info-value">${profileData.bloodSugar || '--'} mmol/L</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">糖化血红蛋白：</span>
                            <span class="info-value">${profileData.glycatedHemoglobin || '--'} %</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="section-title">健康状况</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">现有疾病：</span>
                            <span class="info-value">${profileData.disease || '无'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">既往病史：</span>
                            <span class="info-value">${profileData.medicalHistory || '无'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">用药情况：</span>
                            <span class="info-value">${profileData.medication || '无'}</span>
                        </div>
                    </div>
                </div>

                <div class="info-section">
                    <div class="section-title">健康建议</div>
                    <div style="padding: 0 10px;">
                        ${generateHealthAdvice(bmi, profileData.systolicPressure, profileData.diastolicPressure)}
                    </div>
                </div>

                <div class="signature-area">
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <div>健康管理师签名</div>
                        <div>日期：${new Date().toLocaleDateString()}</div>
                    </div>
                    <div class="sign-box">
                        <div class="sign-line"></div>
                        <div>用户签名</div>
                        <div>日期：${new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                <button onclick="window.print()" class="no-print" style="
                    position: fixed;
                    right: 30px;
                    bottom: 30px;
                    padding: 10px 20px;
                    background: #2196F3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                ">打印档案</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// 辅助函数
function calculateAge(birthDate) {
    if (!birthDate) return '--';
    const today = new Date();
    const birth = new Date(birthDate);
    return today.getFullYear() - birth.getFullYear();
}

function formatPhone(phone) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}

function getBMIStatus(bmi) {
    bmi = parseFloat(bmi);
    if (bmi < 18.5) return 'status-warning';
    if (bmi >= 18.5 && bmi < 24) return 'status-normal';
    return 'status-danger';
}

function getBloodPressureStatus(systolic, diastolic) {
    if (systolic < 120 && diastolic < 80) return 'status-normal';
    if (systolic >= 140 || diastolic >= 90) return 'status-danger';
    return 'status-warning';
}

function getPressureLevel(systolic, diastolic) {
    if (systolic < 120 && diastolic < 80) return '正常血压';
    if (systolic >= 140 || diastolic >= 90) return '高血压';
    return '临界高血压';
}

function generateHealthAdvice(bmi, systolic, diastolic) {
    let advice = [];
    if (bmi >= 24) advice.push('建议进行体重管理，适量增加运动');
    if (systolic >= 130) advice.push('注意监测血压，减少钠盐摄入');
    if (!advice.length) advice.push('当前健康状况良好，保持规律作息和均衡饮食');
    return advice.join('；') + '。';
}

// 加载用户信息并填充到报告中
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        document.getElementById('userName').innerText = profileData.name || '';
        document.getElementById('userGenderAge').innerText = `${profileData.gender} ∙ ${profileData.age}岁`;
        document.getElementById('userPhone').innerText = profileData.phone || '';
        document.getElementById('userHeightWeight').innerText = `${profileData.height} cm / ${profileData.weight} kg`;
        document.getElementById('userBMI').innerText = profileData.bmi || '待测算';
        document.getElementById('userBloodPressure').innerText = profileData.bloodPressure || '待测量';
        document.getElementById('userBloodSugar').innerText = profileData.bloodSugar || '待检测';
        document.getElementById('userDirection').innerText = profileData.treatmentReason || '待补充';
        document.getElementById('reportDate').innerText = new Date().toLocaleDateString();
    }
}

// 在JKscript.js中添加报告查看逻辑
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-view-survey')) { // 确保是查看报告按钮
        const reportType = e.target.closest('tr').querySelector('.report-dropdown .dropdown-content a').dataset.type;
        const userId = e.target.closest('tr').querySelector('input[type="checkbox"]').value;
        showReport(userId, reportType);
    }
});

function showReport(userId, type) {
    const user = userData.find(u => u.id === parseInt(userId));
    if (!user) return;

    const reportTitles = {
        navigation: '健康导航报告',
        sleep: '睡眠质量报告',
        assessment: '健康评估报告'
    };

    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${user.name} - ${reportTitles[type]}</h3>
                    <button class="close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="report-preview" id="${type}-report">
                        ${generateReportContent(type, user)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function generateReportContent(type, user) {
    // 这里根据不同类型生成报告内容
    const templates = {
        navigation: `...导航报告HTML内容...`,
        sleep: `...睡眠报告HTML内容...`,
        assessment: `...健康评估HTML内容...`
    };
    return templates[type];
}

function openReportModal(reportType) {
    const modal = document.getElementById('reportModal');
    const title = document.getElementById('modalTitle');
    const reportList = document.getElementById('reportList');

    title.innerText = '报告列表';
    reportList.innerHTML = '';

    // 添加报告类型选项
    const reports = [
        { date: '2025-02-13 14:56:19', type: '导航报告' },
        { date: '2025-02-13 11:52:32', type: '睡眠报告' }
    ];

    reports.forEach(report => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${report.date}</td>
            <td>${report.type}</td>
            <td>
                <button class="btn-view" onclick="viewReport('${report.date}', '${report.type}')">查看</button>
            </td>
        `;
        reportList.appendChild(tr);
    });

    modal.style.display = 'flex';
}

function viewReport(date, type) {
    const detailedModal = document.getElementById('detailedReportModal');
    
    // 根据报告类型显示不同的内容
    if (type === '睡眠报告') {
        detailedModal.querySelector('.modal-body').innerHTML = `
            <div class="report-details" style="padding: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">睡眠报告详细信息</h3>
                <div class="report-content" style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0 0 12px 0;">测评日期：${date}</p>
                    <p style="margin: 0;">
                        报告下载地址：
                        <a href="https://lifetide.oss-cn-beijing.aliyuncs.com/report/2025/1/3/60b2fcef-cf6c-48ef-bb71-287e5876acef.pdf" 
                           target="_blank"
                           style="color: #2196F3; text-decoration: none; font-weight: 500;">
                            点击查看报告
                        </a>
                    </p>
                </div>
            </div>
        `;
    } else {
        // 导航报告的显示内容
        detailedModal.querySelector('.modal-body').innerHTML = `
            <div class="report-details" style="padding: 20px;">
                <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">导航报告详细信息</h3>
                <div class="report-content" style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <p style="margin: 0 0 12px 0;">测评日期：${date}</p>
                    <p style="margin: 0;">
                        报告下载地址：
                        <a href="https://lifetide.oss-cn-beijing.aliyuncs.com/upload/room/data/2025/2/12/601-2405294827-20250212141706891-2104240009.pdf" 
                           target="_blank"
                           style="color: #2196F3; text-decoration: none; font-weight: 500;">
                            点击查看报告
                        </a>
                    </p>
                </div>
            </div>
        `;
    }

    detailedModal.style.display = 'flex';
}

/* 全局函数定义 */
window.toggleDropdown = function(event) {
    event.stopPropagation();
    const dropdown = event.target.closest('.report-dropdown').querySelector('.dropdown-content');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

window.viewReport = function(type, event) {
    event.preventDefault();
    const userId = event.target.closest('tr').querySelector('input[type="checkbox"]').value;
    const user = userData.find(u => u.id == userId);
    
    // 关闭下拉菜单
    event.target.closest('.report-dropdown').querySelector('.dropdown-content').style.display = 'none';
    
    showReport(user.id, type);
}

// 修改全局点击监听
document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-report')) {
        const dropdown = e.target.closest('.report-dropdown').querySelector('.dropdown-content');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    } else if (e.target.closest('.dropdown-content a')) {
        e.preventDefault();
        const type = e.target.dataset.type;
        const userId = e.target.closest('tr').querySelector('input[type="checkbox"]').value;
        if (type === 'navigation') {
            openNavigationReportModal(userId);
        } else {
            showReport(userId, type);
        }
    } else {
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
});

// 修改导航报告列表模态框
function openNavigationReportModal(userId) {
    const modal = document.getElementById('navigationReportModal');
    const reportList = document.getElementById('navigationReportList');

    // 设置内容容器样式
    modal.querySelector('.modal-content').style.cssText = `
        background: white;
        border-radius: 8px;
        width: 580px;  /* 减小宽度 */
        max-height: 600px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;

    // 添加表格样式
    const tableStyle = `
        <style>
            .report-table {
                width: 100%;
                border-collapse: collapse;
            }
            .report-table th {
                background: #f8f9fa;
                padding: 10px 15px;  /* 调整内边距 */
                text-align: left;
                font-weight: 500;
                color: #666;
                border-bottom: 2px solid #eee;
            }
            .report-table td {
                padding: 10px 15px;  /* 调整内边距 */
                border-bottom: 1px solid #eee;
            }
            .report-table tr:hover {
                background: #f8f9fa;
            }
            .btn-view {
                padding: 4px 12px;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-view:hover {
                background: #1976D2;
            }
            .status-tag {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                background: #e8f5e9;
                color: #2e7d32;
            }
            .report-type {
                color: #666;
                font-size: 13px;
            }
            .modal-body {
                padding: 0;
                overflow-y: auto;
                max-height: calc(600px - 60px);
            }
            /* 调整列宽 */
            .report-table th:nth-child(1),
            .report-table td:nth-child(1) {
                width: 35%;
            }
            .report-table th:nth-child(2),
            .report-table td:nth-child(2) {
                width: 25%;
            }
            .report-table th:nth-child(3),
            .report-table td:nth-child(3) {
                width: 20%;
            }
            .report-table th:nth-child(4),
            .report-table td:nth-child(4) {
                width: 20%;
            }
        </style>
    `;

    // 模拟报告数据
    const reports = [
        { date: '2025-02-13 14:56:19', status: '已完成', type: '常规检查' },
        { date: '2025-02-13 11:52:32', status: '已完成', type: '血糖监测' },
        { date: '2025-02-13 10:12:12', status: '已完成', type: '血压监测' },
        { date: '2025-02-12 09:41:27', status: '已完成', type: '常规检查' },
        { date: '2025-02-11 11:46:57', status: '已完成', type: '血糖监测' },
        { date: '2025-02-11 10:04:00', status: '已完成', type: '血压监测' },
        { date: '2025-02-10 16:18:51', status: '已完成', type: '常规检查' },
        { date: '2025-02-10 15:37:14', status: '已完成', type: '血糖监测' }
    ];

    // 更新表格内容
    reportList.innerHTML = tableStyle + `
        <table class="report-table">
            <thead>
                <tr>
                    <th>测评日期</th>
                    <th>报告类型</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${reports.map(report => `
                    <tr>
                        <td>${report.date}</td>
                        <td><span class="report-type">${report.type}</span></td>
                        <td><span class="status-tag">${report.status}</span></td>
                        <td><button class="btn-view" onclick="viewNavigationReport('${report.date}')">查看</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    modal.style.display = 'flex';
}

// 关闭导航报告列表模态框
function closeNavigationReportModal() {
    const modal = document.getElementById('navigationReportModal');
    modal.style.display = 'none';
}

// 修改导航报告详细信息模态框
function viewNavigationReport(date) {
    const detailedModal = document.getElementById('detailedReportModal');
    
    // 设置内容容器样式
    detailedModal.querySelector('.modal-content').style.cssText = `
        background: white;
        border-radius: 8px;
        width: 500px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;

    // 更新模态框内容
    detailedModal.querySelector('.modal-body').innerHTML = `
        <div class="report-details" style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0; color: #333; font-size: 16px;">导航报告详细信息</h3>
            <div class="report-content" style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                <p style="margin: 0 0 12px 0;">测评日期：${date}</p>
                <p style="margin: 0;">
                    报告下载地址：
                    <a href="https://lifetide.oss-cn-beijing.aliyuncs.com/upload/room/data/2025/2/12/601-2405294827-20250212141706891-2104240009.pdf" 
                       target="_blank"
                       style="color: #2196F3; text-decoration: none; font-weight: 500;">
                        点击查看报告
                    </a>
                </p>
            </div>
        </div>
    `;

    detailedModal.style.display = 'flex';
}

// 添加睡眠报告相关函数
function openSleepReportModal() {
    const modal = document.getElementById('sleepReportModal');
    const reportList = document.getElementById('sleepReportList');

    // 模拟睡眠报告数据
    const reports = [
        { date: '2025-02-13 14:56:19', status: '已完成', type: '睡眠检测' },
        { date: '2025-02-13 11:52:32', status: '已完成', type: '睡眠检测' },
        { date: '2025-02-13 10:12:12', status: '已完成', type: '睡眠检测' },
        { date: '2025-02-12 09:41:27', status: '已完成', type: '睡眠检测' }
    ];

    // 更新表格内容
    reportList.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>测评日期</th>
                    <th>报告类型</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${reports.map(report => `
                    <tr>
                        <td>${report.date}</td>
                        <td>${report.type}</td>
                        <td>${report.status}</td>
                        <td><button class="btn-view" onclick="viewSleepReport('${report.date}')">查看</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    modal.style.display = 'flex';
}

function viewSleepReport(date) {
    const detailedModal = document.getElementById('sleepDetailedReportModal');
    const detailedReportList = document.getElementById('sleepDetailedReportList');

    detailedReportList.innerHTML = `
        <div class="sleep-report-content">
            <h3>睡眠质量报告</h3>
            <p>测评日期：${date}</p>
            <p>
                <a href="https://lifetide.oss-cn-beijing.aliyuncs.com/report/2025/1/3/60b2fcef-cf6c-48ef-bb71-287e5876acef.pdf" 
                   target="_blank"
                   class="report-link">
                    点击查看报告
                </a>
            </p>
        </div>
    `;

    detailedModal.style.display = 'flex';
}

function closeSleepReportModal() {
    const modal = document.getElementById('sleepReportModal');
    modal.style.display = 'none';
}

function closeSleepDetailedReportModal() {
    const modal = document.getElementById('sleepDetailedReportModal');
    modal.style.display = 'none';
}

// 添加退出登录函数
function logout() {
    // 清除可能存在的登录信息
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    
    // 跳转到登录页面
    window.location.href = 'login.html';
}
