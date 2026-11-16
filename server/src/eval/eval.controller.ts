import { Controller, Get, Post } from '@nestjs/common';
import { EvalService } from './eval.service';

@Controller('api/eval')
export class EvalController {
  constructor(private readonly evalService: EvalService) {}

  @Get('summary')
  async getSummary() {
    let summary = this.evalService.getSummary();
    if (!summary) {
      // If not yet run, trigger benchmark automatically
      summary = await this.evalService.runFullBenchmark();
    }
    return summary;
  }

  @Post('run')
  async runBenchmark() {
    return this.evalService.runFullBenchmark();
  }
}
