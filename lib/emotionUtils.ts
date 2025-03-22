export interface EmotionScore {
  name: string;
  score: number;
}

export interface ProcessedEmotions {
  topEmotions: EmotionScore[];
  timestamp: Date;
}

export function processHumeEmotions(humeResults: any): ProcessedEmotions {
  try {
    // 确保结果是一个数组
    if (!Array.isArray(humeResults) || humeResults.length === 0) {
      console.error('无效的 Hume 结果格式:', humeResults);
      throw new Error('无效的 Hume 结果格式');
    }

    // 获取语音模型的结果
    const speechResults = humeResults[0].results;
    if (!speechResults || !Array.isArray(speechResults)) {
      console.error('无法找到语音分析结果:', humeResults);
      throw new Error('无法找到语音分析结果');
    }

    // 收集所有情感得分
    const emotionScores: { [key: string]: number } = {};
    let segmentsCount = 0;

    // 遍历每个时间段的结果
    speechResults.forEach((segment: any) => {
      if (segment.emotions && Array.isArray(segment.emotions)) {
        segmentsCount++;
        segment.emotions.forEach((emotion: any) => {
          const { name, score } = emotion;
          emotionScores[name] = (emotionScores[name] || 0) + score;
        });
      }
    });

    if (segmentsCount === 0) {
      console.error('没有找到有效的情感数据');
      throw new Error('没有找到有效的情感数据');
    }

    // 计算平均得分
    Object.keys(emotionScores).forEach(emotion => {
      emotionScores[emotion] /= segmentsCount;
    });

    // 转换为数组并排序
    const sortedEmotions = Object.entries(emotionScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    // 获取前三个情感
    const topEmotions = sortedEmotions.slice(0, 3);

    console.log('处理后的情感数据:', topEmotions);
    return {
      topEmotions,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('处理情感数据时出错:', error);
    return {
      topEmotions: [],
      timestamp: new Date()
    };
  }
} 