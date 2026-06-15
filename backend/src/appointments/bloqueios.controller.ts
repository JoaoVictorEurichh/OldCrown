import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { BloqueiosService } from './bloqueios.service';

@Controller('bloqueios')
@UseGuards(JwtAuthGuard)
export class BloqueiosController {
  constructor(private readonly service: BloqueiosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: { date: string; time: string; barber: string; motivo?: string }, @Req() req: any) {
    return this.service.create(body, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.service.remove(id, req.user);
  }
}