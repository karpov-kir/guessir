import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { nanoid } from 'nanoid';
import { Repository } from 'typeorm';

import { CreateTextDto } from '../dto';
import { Text } from '../entities';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('texts')
export class TextsController {
  constructor(
    @InjectRepository(Text)
    private readonly textsRepository: Repository<Text>,
  ) {}

  @Get('')
  async find(): Promise<Text[]> {
    return await this.textsRepository.find({
      take: 100,
    });
  }

  @Get('/:id')
  async findById(@Param('id') id: string): Promise<Text> {
    const text = await this.textsRepository.findOne({
      id,
    });

    if (!text) {
      throw new NotFoundException();
    }

    return text;
  }

  @Post()
  async create(@Body() newTextDto: CreateTextDto): Promise<Text> {
    const newText = await this.textsRepository.save({
      ...newTextDto,
      id: nanoid(20),
    });

    return plainToClass(Text, newText);
  }
}
