// 全局配置
const CONFIG = {
    // Supabase 配置（需要根据实际情况替换）
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // API 配置
    API_BASE_URL: '/.netlify/functions',
    
    // 验证码倒计时（秒）
    CODE_COUNTDOWN: 60,
    
    // 手机号正则
    PHONE_REGEX: /^1[3-9]\d{9}$/,
    
    // 密码正则（至少 6 位，包含数字和字母，允许特殊字符）
    PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&*(),.?":{}|<>!_\-+=\[\]{};'/\\~`]{6,16}$/
};

// 注册状态管理
const registerState = {
    currentStep: 1,
    phone: '',
    verificationCode: '',
    password: '',
    isSendingCode: false,
    countdown: 0,
    countdownTimer: null
};

// DOM 元素引用
let elements = {};

// 初始化
initializeAuth();

function initializeAuth() {
    initializeElements();
    bindEvents();
    initializeSupabase();
}

// 初始化 DOM 元素引用
function initializeElements() {
    elements = {
        // 标签切换
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabSlider: document.querySelector('.tab-slider'),
        loginFormContainer: document.getElementById('loginFormContainer'),
        registerFormContainer: document.getElementById('registerFormContainer'),
        
        // 登录表单
        loginForm: document.getElementById('loginForm'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        remember: document.getElementById('remember'),
        
        // 注册表单
        registerForm: document.getElementById('registerForm'),
        phone: document.getElementById('phone'),
        verificationCode: document.getElementById('verificationCode'),
        getCodeBtn: document.getElementById('getCodeBtn'),
        passwordToggle: document.getElementById('passwordToggle'),
        confirmPasswordToggle: document.getElementById('confirmPasswordToggle'),
        agreeTerms: document.getElementById('agreeTerms'),
        submitBtn: document.getElementById('submitBtn'),
        backToLogin: document.getElementById('backToLogin'),
        
        // 错误提示
        phoneError: document.getElementById('phone-error'),
        codeError: document.getElementById('code-error'),
        passwordMatchError: document.getElementById('password-match-error'),
        termsError: document.getElementById('terms-error'),
        
        // 密码强度
        passwordStrength: document.getElementById('passwordStrength'),
        strengthBar: document.querySelector('.strength-bar'),
        strengthText: document.querySelector('.strength-text'),
        
        // 步骤
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
        termsGroup: document.getElementById('termsGroup'),
        
        // 进度条
        progressSteps: document.querySelectorAll('.progress-step')
    };
}

// 绑定事件
function bindEvents() {
    // 标签切换
    elements.tabBtns.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // 登录表单提交
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // 注册表单提交
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // 获取验证码
    if (elements.getCodeBtn) {
        elements.getCodeBtn.addEventListener('click', handleGetVerificationCode);
    }
    
    // 密码可见性切换
    if (elements.passwordToggle) {
        elements.passwordToggle.addEventListener('click', () => togglePasswordVisibility('password'));
    }
    if (elements.confirmPasswordToggle) {
        elements.confirmPasswordToggle.addEventListener('click', () => togglePasswordVisibility('confirmPassword'));
    }
    
    // 实时验证
    if (elements.phone) {
        elements.phone.addEventListener('blur', validatePhone);
    }
    
    // 注意：注册密码框在第二步才显示，需要在 goToStep(2) 后重新绑定事件
    
    // 返回登录
    if (elements.backToLogin) {
        elements.backToLogin.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('login');
        });
    }
    
    // 输入框焦点效果
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.parentElement.classList.remove('focused');
        });
    });
}

// 切换标签（优化版）
function switchTab(tab) {
    const isLogin = tab === 'login';
    
    // 更新按钮状态
    elements.tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // 移动滑块（使用 CSS transition）
    if (elements.tabSlider) {
        elements.tabSlider.style.transform = isLogin ? 'translateX(0)' : 'translateX(100%)';
    }
    
    // 切换表单容器（使用 Promise 和 requestAnimationFrame 优化）
    if (elements.loginFormContainer && elements.registerFormContainer) {
        const fromContainer = isLogin ? elements.registerFormContainer : elements.loginFormContainer;
        const toContainer = isLogin ? elements.loginFormContainer : elements.registerFormContainer;
        
        // 使用 Promise 链式调用，确保动画顺序执行
        fadeOutContainer(fromContainer)
            .then(() => {
                // 隐藏离开的容器
                fromContainer.style.display = 'none';
                fromContainer.classList.remove('active');
                
                // 显示进入的容器
                toContainer.style.display = 'block';
                
                // 强制重绘后触发动画
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        toContainer.classList.add('active');
                    });
                });
                
                return fadeInContainer(toContainer);
            })
            .catch(err => console.error('切换失败:', err));
    }
}

// 淡出动画（Promise 封装）
function fadeOutContainer(container) {
    return new Promise((resolve, reject) => {
        try {
            container.classList.remove('active');
            container.classList.add('fade-out');
            
            // 等待动画完成
            const handleTransitionEnd = () => {
                container.removeEventListener('transitionend', handleTransitionEnd);
                container.classList.remove('fade-out');
                resolve();
            };
            
            container.addEventListener('transitionend', handleTransitionEnd, { once: true });
            
            // 超时保护
            setTimeout(() => {
                container.removeEventListener('transitionend', handleTransitionEnd);
                resolve(); // 即使动画未完成也继续
            }, 500);
        } catch (error) {
            reject(error);
        }
    });
}

// 淡入动画（Promise 封装）
function fadeInContainer(container) {
    return new Promise((resolve, reject) => {
        try {
            // 已经在 switchTab 中添加了 active 类
            const handleTransitionEnd = () => {
                container.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            };
            
            container.addEventListener('transitionend', handleTransitionEnd, { once: true });
            
            // 超时保护
            setTimeout(() => {
                container.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, 500);
        } catch (error) {
            reject(error);
        }
    });
}

// 初始化 Supabase
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined') {
        window.supabaseClient = window.supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );
    }
}

// 处理登录
function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.username.value;
    const password = elements.password.value;

    // 固定的测试账号
    const testAccount = {
        username: 'admin',
        password: '123456'
    };

    // 验证账号密码
    if (username.toLowerCase() === testAccount.username && 
        password === testAccount.password) {
        
        showToast('登录成功，正在跳转...', 'success');

        // 登录成功
        localStorage.setItem('userInfo', JSON.stringify({
            username: username,
            isLoggedIn: true
        }));

        // 延迟跳转，让用户看到提示
        setTimeout(() => {
            window.location.href = 'health-management.html';
        }, 1500);

    } else {
        // 登录失败
        showToast('账号或密码错误!', 'error');
    }
}

// 切换密码可见性
function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = document.getElementById(`${fieldId}Toggle`);
    
    console.log('切换密码可见性:', fieldId, 'input:', input, 'icon:', icon);
    
    if (!input || !icon) {
        console.error('未找到密码输入框或图标');
        return;
    }
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        console.log('设置为明文显示');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        console.log('设置为密文显示');
    }
}

// 处理获取验证码
async function handleGetVerificationCode() {
    if (!validatePhone()) return;
    
    if (registerState.isSendingCode) return;
    
    try {
        registerState.isSendingCode = true;
        elements.getCodeBtn.disabled = true;
        elements.getCodeBtn.textContent = '发送中...';
        
        // 开发模式：固定验证码 8888
        startCountdown();
        
    } catch (error) {
        console.error('发送验证码失败:', error);
        showError(elements.codeError, '网络连接失败，请检查网络后重试');
    } finally {
        registerState.isSendingCode = false;
        elements.getCodeBtn.disabled = false;
        elements.getCodeBtn.textContent = '获取验证码';
    }
}

// 开始倒计时
function startCountdown() {
    registerState.countdown = CONFIG.CODE_COUNTDOWN;
    updateCountdownDisplay();
    
    registerState.countdownTimer = setInterval(() => {
        registerState.countdown--;
        updateCountdownDisplay();
        
        if (registerState.countdown <= 0) {
            clearInterval(registerState.countdownTimer);
            elements.getCodeBtn.disabled = false;
            elements.getCodeBtn.textContent = '重新获取';
        }
    }, 1000);
}

// 更新倒计时显示
function updateCountdownDisplay() {
    if (registerState.countdown > 0) {
        elements.getCodeBtn.disabled = true;
        elements.getCodeBtn.textContent = `${registerState.countdown}秒后重试`;
    }
}

// 验证手机号
function validatePhone() {
    const phone = elements.phone.value.trim();
    registerState.phone = phone;
    
    if (!phone) {
        showError(elements.phoneError, '请输入手机号');
        return false;
    }
    
    if (!CONFIG.PHONE_REGEX.test(phone)) {
        showError(elements.phoneError, '请输入正确的 11 位手机号');
        return false;
    }
    
    clearError(elements.phoneError);
    return true;
}

// 验证密码匹配
function validatePasswordMatch() {
    const password = elements.password.value;
    const confirmPassword = elements.confirmPassword.value;
    
    if (confirmPassword && password !== confirmPassword) {
        showError(elements.passwordMatchError, '两次输入的密码不一致');
        return false;
    }
    
    clearError(elements.passwordMatchError);
    return true;
}

// 检查密码强度
function checkPasswordStrength() {
    const password = elements.password.value;
    registerState.password = password;
    
    if (!password) {
        resetPasswordStrength();
        return;
    }
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (password.length >= 16) strength++;
    if (/\d/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    elements.strengthBar.className = 'strength-bar';
    
    if (strength <= 2) {
        elements.strengthBar.classList.add('weak');
        elements.strengthText.textContent = '密码强度：弱';
        elements.strengthText.style.color = '#f44336';
    } else if (strength <= 4) {
        elements.strengthBar.classList.add('medium');
        elements.strengthText.textContent = '密码强度：中';
        elements.strengthText.style.color = '#ff9800';
    } else {
        elements.strengthBar.classList.add('strong');
        elements.strengthText.textContent = '密码强度：强';
        elements.strengthText.style.color = '#4caf50';
    }
}

// 重置密码强度显示
function resetPasswordStrength() {
    elements.strengthBar.className = 'strength-bar';
    elements.strengthText.textContent = '密码强度：未检测';
    elements.strengthText.style.color = '#666';
}

// 处理注册表单提交
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    if (registerState.currentStep === 1) {
        if (!validatePhone()) return;
        
        const code = elements.verificationCode.value.trim();
        if (!code) {
            showError(elements.codeError, '输入验证码');
            return;
        }
        
        // 固定验证码 123456
        if (code !== '123456') {
            showError(elements.codeError, '验证码错误，请输入 123456');
            return;
        }
        
        // 清除错误提示
        clearError(elements.codeError);
        
        if (!elements.agreeTerms.checked) {
            showError(elements.termsError, '请先同意用户服务协议和隐私政策');
            return;
        }
        
        goToStep(2);
        
    } else if (registerState.currentStep === 2) {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
            
        if (!passwordInput || !confirmPasswordInput) {
            showToast('表单元素未准备好，请刷新页面重试', 'error');
            return;
        }
            
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
                
        console.log('密码验证:', {
            password: password,
            length: password.length,
            hasLetter: /[A-Za-z]/.test(password),
            hasDigit: /\d/.test(password)
        });
                
        // 简化验证：固定密码 123456
        if (password !== '123456') {
            showToast('密码错误，请使用固定密码 123456', 'error');
            return;
        }
            
        if (confirmPassword && password !== confirmPassword) {
            showError(elements.passwordMatchError, '两次输入的密码不一致');
            return;
        }
            
        await performRegistration();
    }
}

// 执行注册
async function performRegistration() {
    try {
        elements.submitBtn.disabled = true;
        elements.submitBtn.innerHTML = '<span class="btn-text">注册中...</span>';
        
        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient.auth.signUp({
                phone: registerState.phone,
                password: registerState.password,
                options: {
                    data: {
                        phone: registerState.phone,
                        created_at: new Date().toISOString()
                    }
                }
            });
            
            if (error) throw error;
            
            if (data.user) {
                await createUserProfile(data.user.id, registerState.phone);
            }
        }
        
        registrationSuccess();
        
    } catch (error) {
        console.error('注册失败:', error);
        showToast(`注册失败：${error.message}`, 'error');
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = `
            <span class="btn-text">下一步：设置密码</span>
            <i class="fas fa-arrow-right btn-icon"></i>
        `;
    }
}

// 创建用户档案
async function createUserProfile(userId, phone) {
    try {
        await window.supabaseClient
            .from('user_profiles')
            .insert({ id: userId, phone, created_at: new Date().toISOString() });
    } catch (error) {
        console.error('创建用户档案失败:', error);
    }
}

// 注册成功后的处理
function registrationSuccess() {
    goToStep(3);
    
    setTimeout(() => {
        showToast('注册成功！即将完善健康档案...', 'success');
        // window.location.href = 'health-profile.html';
    }, 1500);
}

// 切换到指定步骤
function goToStep(step) {
    elements.step1.style.display = 'none';
    elements.step2.style.display = 'none';
    elements.step3.style.display = 'none';
    elements.termsGroup.style.display = 'none';
    elements.backToLogin.style.display = 'none';
    
    elements.progressSteps.forEach((stepEl, index) => {
        stepEl.classList.remove('active', 'completed');
        if (index + 1 < step) {
            stepEl.classList.add('completed');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
        }
    });
    
    if (step === 1) {
        elements.step1.style.display = 'block';
        elements.termsGroup.style.display = 'block';
        elements.backToLogin.style.display = 'block';
        elements.submitBtn.innerHTML = `
            <span class="btn-text">下一步：设置密码</span>
            <i class="fas fa-arrow-right btn-icon"></i>
        `;
    } else if (step === 2) {
        elements.step2.style.display = 'block';
        elements.submitBtn.innerHTML = `
            <span class="btn-text">完成注册</span>
            <i class="fas fa-check-circle btn-icon"></i>
        `;
        
        // 重新获取密码输入框并绑定事件
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const passwordToggle = document.getElementById('passwordToggle');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', checkPasswordStrength);
        }
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        }
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => togglePasswordVisibility('password'));
        }
        if (confirmPasswordToggle) {
            confirmPasswordToggle.addEventListener('click', () => togglePasswordVisibility('confirmPassword'));
        }
    } else if (step === 3) {
        elements.step3.style.display = 'block';
        elements.submitBtn.style.display = 'none';
    }
    
    registerState.currentStep = step;
}

// 显示错误
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// 清除错误
function clearError(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

// 显示小弹窗（保留原有功能）
function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    const existingMask = document.querySelector('.toast-mask');
    
    if (existingToast) existingToast.remove();
    if (existingMask) existingMask.remove();

    const mask = document.createElement('div');
    mask.className = 'toast-mask';
    document.body.appendChild(mask);

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✅' : '❌';
    toast.appendChild(icon);

    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    toast.appendChild(text);

    document.body.appendChild(toast);

    setTimeout(() => {
        mask.classList.add('show');
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        mask.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            mask.remove();
        }, 300);
    }, 2000);
}