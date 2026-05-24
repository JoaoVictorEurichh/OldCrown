import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
<<<<<<< HEAD
=======
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
>>>>>>> 0940b38 (Initial commit)

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }
<<<<<<< HEAD

=======
  @UseGuards(JwtAuthGuard)
>>>>>>> 0940b38 (Initial commit)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
}