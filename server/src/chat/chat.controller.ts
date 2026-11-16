import { Body, Controller, Post } from '@nestjs/common';
import { ChatRequestDto } from '../types';
import { LangChainAgentService } from './langchain-agent.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly agentService: LangChainAgentService) {}

  @Post()
  async handleChat(@Body() dto: ChatRequestDto) {
    return this.agentService.processChat(dto);
  }
}
