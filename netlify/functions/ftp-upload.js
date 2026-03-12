// netlify/functions/ftp-upload.js

exports.handler = async function(event, context) {
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
    if (!event.body) {
      throw new Error('请求体为空');
    }

    const { filename, fileData } = JSON.parse(event.body);
    
    if (!fileData) {
      throw new Error('未收到文件数据');
    }
    
    const fileName = filename || 'app.apk';
    
    const buffer = Buffer.from(fileData, 'base64');
    
    const uploadToCatbox = async () => {
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', new Blob([buffer]), fileName);
      formData.append('time', '72h');
      
      const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.text();
      
      if (result.startsWith('https://')) {
        return result.trim();
      }
      return null;
    };
    
    const uploadToFileIo = async () => {
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), fileName);
      
      const response = await fetch('https://file.io', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.link;
      }
      return null;
    };
    
    const uploadToTmpFiles = async () => {
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), fileName);
      
      const response = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        return result.data.url;
      }
      return null;
    };
    
    let downloadUrl = null;
    let lastError = null;
    
    try {
      downloadUrl = await uploadToCatbox();
    } catch (e) {
      lastError = e;
      try {
        downloadUrl = await uploadToFileIo();
      } catch (e2) {
        lastError = e2;
        try {
          downloadUrl = await uploadToTmpFiles();
        } catch (e3) {
          lastError = e3;
        }
      }
    }
    
    if (downloadUrl) {
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
    
    throw new Error(lastError?.message || '所有上传服务均不可用，请稍后重试');

  } catch (error) {
    console.error('上传错误:', error);
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
