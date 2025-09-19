// 登录表单提交处理
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 获取输入值
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

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
        }, 500);

    } else {
        // 登录失败
        showToast('账号或密码错误!', 'error');
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