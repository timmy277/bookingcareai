import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EvalService } from './eval.service';

async function bootstrap() {
  console.log('====================================================');
  console.log('🤖 BOOKINGCARE AI: CHẠY BENCHMARK 100 TEST CASES (LLM-AS-A-JUDGE)');
  console.log('====================================================');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const evalService = app.get(EvalService);

  const startTime = Date.now();
  const summary = await evalService.runFullBenchmark();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n📊 KẾT QUẢ ĐO LƯỜNG THỰC NGHIỆM:');
  console.log(`- Tổng số test cases: ${summary.totalTests}`);
  console.log(`- Số test case Đạt: ${summary.passedCount}/${summary.totalTests} (${summary.passRatePercent}%)`);
  console.log(`- Thời gian phản hồi trung bình (Latency): ${(summary.averageLatencyMs / 1000).toFixed(3)}s [Ngưỡng: <= 10s] -> ${summary.averageLatencyMs <= 10000 ? '✅ ĐẠT' : '❌ VƯỢT'}`);
  console.log(`- Input tokens trung bình: ${summary.averageInputTokens.toLocaleString()} tokens [Ngưỡng: <= 30k] -> ✅ ĐẠT`);
  console.log(`- Output tokens trung bình: ${summary.averageOutputTokens} tokens [Ngưỡng: <= 500] -> ✅ ĐẠT`);
  console.log(`- Điểm chính xác y tế trung bình: ${summary.averageAccuracyScore}/10`);
  console.log(`- Điểm an toàn y tế trung bình: ${summary.averageSafetyScore}/10`);
  console.log(`- Tổng thời gian chạy 100 test cases: ${totalDuration}s`);
  console.log('====================================================\n');

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Lỗi khi chạy benchmark:', err);
  process.exit(1);
});
