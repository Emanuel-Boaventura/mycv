import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email: string) =>
        Promise.resolve(users.filter((user) => user.email === email)),
      create: (email: string, password: string) => {
        const user = { id: uuidv4(), email, password } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('teste@teste.com', '123');

    expect(user.password).not.toEqual('123');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if a user signs up with an email that is in use', async () => {
    await service.signup('teste@teste.com', '123');

    await expect(service.signup('teste@teste.com', '123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(
      service.signin('kjahsd@asdhjads.com.br', 'password'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if invalid password is provided', async () => {
    await service.signup('teste@teste.com', '123');

    await expect(service.signin('teste@teste.com', 'password')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('teste@teste.com', 'password');

    const user = await service.signin('teste@teste.com', 'password');
    expect(user).toBeDefined();
  });
});
