const axios = require('axios');

async function test() {
  try {
    // 登录获取 token
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.data.accessToken;
    console.log('Token:', token.substring(0, 50) + '...');

    // 获取供应商列表
    const supplierRes = await axios.get('http://localhost:3000/api/suppliers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('\n供应商列表:');
    console.log('总数:', supplierRes.data.data.total);
    console.log('供应商:', supplierRes.data.data.data.map(s => ({ id: s.id, name: s.name, userId: s.userId })));
  } catch (error) {
    console.error('错误:', error.response?.data || error.message);
  }
}

test();
