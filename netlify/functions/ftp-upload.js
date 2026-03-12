// netlify/functions/ftp-upload.js

exports.handler = async function(event, context) {
  console.log('FTP上传函数被调用');
  console.log('Content-Type:', event.headers['content-type']);
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    console.log('开始处理上传请求');
    console.log('body长度:', event.body ? event.body.length : 0);
    
    if (!event.body) {
      throw new Error('请求体为空');
    }

    let parsed;
    try {
      parsed = JSON.parse(event.body);
      console.log('JSON解析成功');
    } catch (parseError) {
      console.error('JSON解析失败:', parseError.message);
      throw new Error('请求体格式错误，不是有效的JSON');
    }
    
    const { filename, fileData } = parsed;
    
    if (!fileData) {
      console.error('未收到文件数据');
      throw new Error('未收到文件数据');
    }
    
    const fileName = filename || 'app.apk';
    console.log('文件名:', fileName);
    console.log('文件数据长度:', fileData.length);
    
    // 检查文件大小（Base64编码会增加约33%的大小）
    const estimatedSize = (fileData.length * 3) / 4;
    console.log('预估文件大小:', estimatedSize, 'bytes');
    
    // Netlify免费版函数体大小限制约为6MB
    if (estimatedSize > 5 * 1024 * 1024) {
      throw new Error('文件太大，超出Netlify函数限制（5MB）。请使用更小的APK文件或直接提供下载链接。');
    }
    
    const buffer = Buffer.from(fileData, 'base64');
    console.log('Buffer创建成功，大小:', buffer.length);
    
    // 上传函数
    const uploadToCatbox = async () => {
      console.log('尝试上传到 catbox.moe...');
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', new Blob([buffer]), fileName);
      formData.append('time', '72h');
      
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.text();
      console.log('catbox响应:', result.substring(0, 200));
      
      if (result.startsWith('https://')) {
        return result.trim();
      }
      throw new Error('catbox上传失败: ' + result.substring(0, 100));
    };
    
    const uploadToTmpFiles = async () => {
      console.log('尝试上传到 tmpfiles.org...');
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), fileName);
      
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('tmpfiles响应:', JSON.stringify(result).substring(0, 200));
      
      if (result.success) {
        return result.data.url;
      }
      throw new Error('tmpfiles上传失败');
    };
    
    const uploadToFileIo = async () => {
      console.log('尝试上传到 file.io...');
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), fileName);
      
      const response = await fetch('https://file.io', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      console.log('file.io响应:', JSON.stringify(result).substring(0, 200));
      
      if (result.success) {
        return result.link;
      }
      throw new Error('file.io上传失败');
    };
    
    let downloadUrl = null;
    let lastError = null;
    
    // 尝试上传到 catbox（首选）
    try {
      downloadUrl = await uploadToCatbox();
      console.log('catbox上传成功');
    } catch (e) {
      console.error('catbox上传失败:', e.message);
      lastError = e;
      
      // 尝试 tmpfiles
      try {
        downloadUrl = await uploadToTmpFiles();
        console.log('tmpfiles上传成功');
      } catch (e2) {
        console.error('tmpfiles上传失败:', e2.message);
        lastError = e2;
        
        // 最后尝试 file.io
        try {
          downloadUrl = await uploadToFileIo();
          console.log('file.io上传成功');
        } catch (e3) {
          console.error('file.io上传失败:', e3.message);
          lastError = e3;
        }
      }
    }
    
    if (downloadUrl) {
      console.log('上传成功，下载URL:', downloadUrl);
      return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
          success: true,
          downloadUrl: downloadUrl,
          filename: fileName
        })
      };
    }
    
    console.error('所有上传服务都失败');
    throw new Error(lastError?.message || '所有上传服务均不可用，请稍后重试');

  } catch (error) {
    console.error('上传函数错误:', error.message);
    console.error('错误堆栈:', error.stack);
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};
