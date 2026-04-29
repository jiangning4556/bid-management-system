const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testBidConversion() {
  // 1. 登录获取 token
  console.log('1. 登录获取 token...');
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    username: 'admin',
    password: 'admin123'
  }).catch(err => {
    console.error('❌ 登录失败:', err.response?.data || err.message);
    process.exit(1);
  });

  const token = loginResponse.data.data.access_token;
  console.log('✅ 登录成功');

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 2. 获取咨询项目列表
  console.log('\n2. 获取咨询项目列表...');
  const consultProjectsResponse = await axios.get(`${API_URL}/consult-projects`, { headers });
  const consultProjects = consultProjectsResponse.data.data;
  console.log(`✅ 找到 ${consultProjects.length} 个咨询项目`);

  if (consultProjects.length === 0) {
    console.log('❌ 没有咨询项目，无法测试');
    return;
  }

  const testProject = consultProjects[0];
  console.log(`   测试项目: ${testProject.name} (ID: ${testProject.id})`);

  // 3. 检查该咨询项目是否已转为中标项目
  console.log('\n3. 检查是否已转为中标项目...');
  const bidProjectsResponse = await axios.get(`${API_URL}/bid-projects?consultProjectId=${testProject.id}`, { headers });
  const existingBidProjects = bidProjectsResponse.data.data;

  if (existingBidProjects.length > 0) {
    console.log(`✅ 该项目已转为中标项目 (数量: ${existingBidProjects.length})`);
    existingBidProjects.forEach(bp => {
      console.log(`   - ${bp.name} (ID: ${bp.id}, 金额: ${bp.totalAmount})`);
    });
  } else {
    console.log('⚠️  该项目尚未转为中标项目');

    // 4. 检查是否有选中的报价
    console.log('\n4. 检查项目报价状态...');
    const projectDetailResponse = await axios.get(`${API_URL}/consult-projects/${testProject.id}`, { headers });
    const projectDetail = projectDetailResponse.data;
    const projectItems = projectDetail.projectItems || [];

    console.log(`   项目项数量: ${projectItems.length}`);

    let hasSelectedQuotes = false;
    for (const item of projectItems) {
      const quotes = item.quotes || [];
      const selectedCount = quotes.filter(q => q.isSelected).length;
      console.log(`   - 项目项 ${item.item?.name || item.id}: ${quotes.length} 个报价, ${selectedCount} 个已选`);
      if (selectedCount > 0) {
        hasSelectedQuotes = true;
      }
    }

    if (hasSelectedQuotes) {
      console.log('\n✅ 有选中的报价，可以转为中标项目');
    } else {
      console.log('\n❌ 没有选中的报价，无法转为中标项目');
      console.log('   请先在管理报价中选中至少一个供应商报价');
    }
  }
}

testBidConversion().catch(err => {
  console.error('测试失败:', err.response?.data || err.message);
  process.exit(1);
});
