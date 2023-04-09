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

import { CreateTextDtoRequest } from '../dto/CreateTextDtoRequest';
import { TextEntity } from '../entities/TextEntity';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('texts')
export class TextsController {
  constructor(
    @InjectRepository(TextEntity)
    private readonly textsRepository: Repository<TextEntity>,
  ) {}

  @Get('')
  async find(): Promise<TextEntity[]> {
    return this.textsRepository.find({
      take: 100,
    });
  }

  @Get('/:id')
  async findById(@Param('id') id: string): Promise<TextEntity> {
    const text = await this.textsRepository.findOne({
      where: { id },
    });

    if (!text) {
      throw new NotFoundException();
    }

    return text;
  }

  @Post()
  async create(@Body() newTextDto: CreateTextDtoRequest): Promise<TextEntity> {
    const newText = await this.textsRepository.save({
      ...newTextDto,
      id: nanoid(20),
    });

    return plainToClass(TextEntity, newText);
  }
}
