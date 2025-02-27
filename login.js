// 登录表单提交处理
document.querySelector('.login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 获取输入值
    const username = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;
    const captcha = document.querySelector('.captcha-group input').value;

    // 固定的测试账号
    const testAccount = {
        username: 'admin',
        password: '123456',
        captcha: '1234'  // 固定验证码
    };

    // 验证账号密码
    if (username === testAccount.username && 
        password === testAccount.password && 
        captcha === testAccount.captcha) {
        // 登录成功
        localStorage.setItem('userInfo', JSON.stringify({
            username: username,
            isLoggedIn: true
        }));
        // 跳转到健康管理中心页面
        window.location.href = '健康管理中心.html';
    } else {
        // 登录失败
        alert('账号、密码或验证码错误！\n测试账号：admin\n密码：123456\n验证码：1234');
    }
});

// 显示/隐藏密码功能
document.querySelector('.show-password').addEventListener('click', function() {
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
});

// 显示小弹窗
function showToast(message, type) {
    // 创建遮罩
    const mask = document.createElement('div');
    mask.className = 'toast-mask';
    document.body.appendChild(mask);

    // 创建弹窗
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // 添加图标
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = type === 'success' ? '✅' : '❌'; // 根据类型设置图标
    toast.appendChild(icon);

    // 添加消息文本
    const text = document.createElement('span');
    text.className = 'toast-text';
    text.textContent = message;
    toast.appendChild(text);

    // 添加到页面
    document.body.appendChild(toast);

    // 显示遮罩和弹窗
    setTimeout(() => {
        mask.classList.add('show');
        toast.classList.add('show');
    }, 10);

    // 2秒后移除遮罩和弹窗
    setTimeout(() => {
        toast.classList.remove('show');
        mask.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            mask.remove();
        }, 300); // 等待动画结束
    }, 2000);
}