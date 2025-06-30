// 用户管理功能 - 这个文件已不再使用，所有功能已移至JKscript.js
// 请使用JKscript.js中的函数而不是这个文件

/*
// 初始化Supabase客户端
const supabaseUrl = 'https://gxohpxiekmpsmkzkcxfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4b2hweGlla21wc21remtjeGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYzNjI1NDksImV4cCI6MjAzMTkzODU0OX0.YOUR_ANON_KEY'; // 注意：在实际应用中应该使用环境变量
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 用户管理功能
const userManagement = {
    // 获取所有用户
    async getAllUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('获取用户列表失败:', error.message);
            return [];
        }
    },
    
    // 添加新用户
    async addUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('添加用户失败:', error.message);
            return { success: false, message: error.message };
        }
    },
    
    // 更新用户信息
    async updateUser(userId, userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update(userData)
                .eq('id', userId)
                .select();
                
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('更新用户失败:', error.message);
            return { success: false, message: error.message };
        }
    },
    
    // 删除用户
    async deleteUser(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);
                
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('删除用户失败:', error.message);
            return { success: false, message: error.message };
        }
    },
    
    // 按条件搜索用户
    async searchUsers(searchParams) {
        try {
            let query = supabase.from('users').select('*');
            
            // 添加搜索条件
            if (searchParams.name) {
                query = query.ilike('name', `%${searchParams.name}%`);
            }
            
            if (searchParams.phone) {
                query = query.eq('phone', searchParams.phone);
            }
            
            if (searchParams.direction) {
                query = query.eq('direction', searchParams.direction);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('搜索用户失败:', error.message);
            return [];
        }
    }
};
*/ 