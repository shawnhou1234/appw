import axios from 'axios';

async function testAudioProcessing() {
  try {
    // 1. 首先检查环境
    console.log('\n1. 检查环境配置...');
    const checkResponse = await axios.get('http://localhost:3000/api/test-process-audio');
    console.log('环境检查结果:', JSON.stringify(checkResponse.data, null, 2));

    if (!checkResponse.data.success) {
      throw new Error('环境检查失败');
    }

    // 2. 如果有可用的音频文件，测试处理
    if (checkResponse.data.checks.storage.hasFiles) {
      console.log('\n2. 开始测试音频处理...');
      const testFile = checkResponse.data.checks.storage.firstFile;
      console.log('使用测试文件:', testFile);
      
      console.log('\n3. 发送处理请求...');
      const processResponse = await axios.post('http://localhost:3000/api/process-audio', {
        filePath: testFile,
        userId: 'test-user-' + Date.now()
      });

      console.log('\n4. 处理结果:');
      console.log(JSON.stringify(processResponse.data, null, 2));

      if (processResponse.data.success) {
        console.log('\n✅ 测试成功完成！');
        console.log('- 转录文本:', processResponse.data.results.transcription);
        console.log('- 情感分析结果已保存');
      } else {
        console.log('\n❌ 处理失败');
      }
    } else {
      console.log('\n❌ 没有找到可用的音频文件进行测试');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (axios.isAxiosError(error)) {
      console.error('API 错误:', error.response?.data || error.message);
      console.error('状态码:', error.response?.status);
    } else {
      console.error('错误:', error);
    }
  }
}

// 运行测试
console.log('开始音频处理 API 测试...');
testAudioProcessing(); 