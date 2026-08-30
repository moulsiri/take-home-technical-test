import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';



@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: { email: string; name: string; passwordHash: string; verificationToken?: string }) {
    return this.prisma.user.create({ data });
  }
}
