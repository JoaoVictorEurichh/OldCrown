import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create({ ...body, role: 'CUSTOMER' });
  }

  @Post('barber')
  @UseGuards(JwtAuthGuard)
  createBarber(@Body() body: { name: string; email: string; password: string }, @Req() req: any) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Apenas administradores podem cadastrar barbeiros');
    return this.usersService.create({ ...body, role: 'BARBER' });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}