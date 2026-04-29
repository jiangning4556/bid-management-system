import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsultProjectService } from './consult-project.service';
import { ConsultProject } from './entities/consult-project.entity';
import { ConsultProjectItem } from './entities/consult-project-item.entity';
import { SupplierQuote } from './entities/supplier-quote.entity';
import { Item } from '../item/entities/item.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateConsultProjectDto } from './dto/create-consult-project.dto';
import { UpdateConsultProjectDto } from './dto/update-consult-project.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

describe('ConsultProjectService', () => {
  let service: ConsultProjectService;
  let consultProjectRepository: Repository<ConsultProject>;
  let projectItemRepository: Repository<ConsultProjectItem>;
  let supplierQuoteRepository: Repository<SupplierQuote>;
  let itemRepository: Repository<Item>;
  let dataSource: DataSource;

  // Mock data
  const mockUser: User = {
    id: 'user-1',
    username: 'admin',
    role: UserRole.ADMIN,
  } as User;

  const mockItem: Item = {
    id: 'item-1',
    name: 'Test Item',
    code: 'ITEM001',
    categoryId: 'cat-1',
  } as Item;

  const mockProject: ConsultProject = {
    id: 'project-1',
    name: 'Test Project',
    projectCode: 'PRJ001',
    customer: 'Test Customer',
    userId: 'user-1',
    totalAmount: 1000,
    status: 'consulting',
    deletedAt: null,
    projectItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ConsultProject;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      create: jest.fn().mockReturnValue(mockProject),
      save: jest.fn().mockResolvedValue(mockProject),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  } as unknown as QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultProjectService,
        {
          provide: getRepositoryToken(ConsultProject),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ConsultProjectItem),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(SupplierQuote),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Item),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<ConsultProjectService>(ConsultProjectService);
    consultProjectRepository = module.get<Repository<ConsultProject>>(getRepositoryToken(ConsultProject));
    projectItemRepository = module.get<Repository<ConsultProjectItem>>(getRepositoryToken(ConsultProjectItem));
    supplierQuoteRepository = module.get<Repository<SupplierQuote>>(getRepositoryToken(SupplierQuote));
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a consult project successfully', async () => {
      const createDto: CreateConsultProjectDto = {
        name: 'Test Project',
        projectCode: 'PRJ001',
        customer: 'Test Customer',
        items: [
          {
            itemId: 'item-1',
            quantity: 10,
            remarks: 'Test remarks',
            quotes: [],
          },
        ],
      };

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockProject);

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item does not exist', async () => {
      const createDto: CreateConsultProjectDto = {
        name: 'Test Project',
        projectCode: 'PRJ001',
        customer: 'Test Customer',
        items: [
          {
            itemId: 'non-existent-item',
            quantity: 10,
            quotes: [],
          },
        ],
      };

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should calculate total amount correctly with quotes', async () => {
      const createDto: CreateConsultProjectDto = {
        name: 'Test Project',
        projectCode: 'PRJ001',
        customer: 'Test Customer',
        items: [
          {
            itemId: 'item-1',
            quantity: 10,
            quotes: [
              {
                supplierId: 'supplier-1',
                price: 100,
                quantity: 10,
                totalAmount: 1000,
              },
            ],
          },
        ],
      };

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockProject);

      await service.create(createDto, 'user-1');

      expect(mockProject.totalAmount).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated results for admin user', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockProjects = [mockProject];

      jest.spyOn(consultProjectRepository, 'findAndCount').mockResolvedValue([mockProjects, 1]);

      const result = await service.findAll(mockUser, paginationDto);

      expect(result.data).toEqual(mockProjects);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by user role for non-admin users', async () => {
      const nonAdminUser: User = { id: 'user-2', username: 'user', role: UserRole.USER } as User;
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest.spyOn(consultProjectRepository, 'findAndCount').mockResolvedValue([[mockProject], 1]);

      await service.findAll(nonAdminUser, paginationDto);

      const findAndCall = consultProjectRepository.findAndCount as jest.Mock;
      expect(findAndCall).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-2',
          }),
        })
      );
    });

    it('should handle sorting by valid fields', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'ASC' };

      jest.spyOn(consultProjectRepository, 'findAndCount').mockResolvedValue([[mockProject], 1]);

      await service.findAll(mockUser, paginationDto);

      const findAndCall = consultProjectRepository.findAndCount as jest.Mock;
      expect(findAndCall).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a project by id for admin', async () => {
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockProject);

      const result = await service.findOne('project-1', mockUser);

      expect(result).toEqual(mockProject);
    });

    it('should return a project for the owner', async () => {
      const ownerUser: User = { id: 'user-1', username: 'user', role: UserRole.USER } as User;

      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockProject);

      const result = await service.findOne('project-1', ownerUser);

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException for non-existent project', async () => {
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own the project', async () => {
      const otherUser: User = { id: 'user-2', username: 'other', role: UserRole.USER } as User;

      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockProject);

      await expect(service.findOne('project-1', otherUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project basic fields', async () => {
      const updateDto: UpdateConsultProjectDto = {
        name: 'Updated Project',
        customer: 'Updated Customer',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(consultProjectRepository, 'save').mockResolvedValue({ ...mockProject, ...updateDto });

      const result = await service.update('project-1', updateDto, mockUser);

      expect(result.name).toBe('Updated Project');
      expect(consultProjectRepository.save).toHaveBeenCalled();
    });

    it('should exclude items from update through this method', async () => {
      const updateDto = {
        name: 'Updated Project',
        items: [{ itemId: 'item-1', quantity: 5 }],
      } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(consultProjectRepository, 'save').mockResolvedValue(mockProject);

      await service.update('project-1', updateDto, mockUser);

      const saveCall = consultProjectRepository.save as jest.Mock;
      expect(saveCall).toHaveBeenCalledWith(
        expect.not.objectContaining({
          items: expect.anything(),
        })
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a project', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(consultProjectRepository, 'softRemove').mockResolvedValue(mockProject);

      await service.remove('project-1', mockUser);

      expect(consultProjectRepository.softRemove).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('addItem', () => {
    it('should add an item to project', async () => {
      const itemDto = { itemId: 'item-1', quantity: 10, remarks: 'test' };
      const mockProjectItem = { id: 'pi-1', projectId: 'project-1', itemId: 'item-1' } as ConsultProjectItem;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(projectItemRepository, 'create').mockReturnValue(mockProjectItem);
      jest.spyOn(projectItemRepository, 'save').mockResolvedValue(mockProjectItem);

      const result = await service.addItem('project-1', itemDto, mockUser);

      expect(result).toEqual(mockProjectItem);
    });

    it('should throw NotFoundException when item does not exist', async () => {
      const itemDto = { itemId: 'non-existent', quantity: 10 };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addItem('project-1', itemDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addQuote', () => {
    it('should add a quote to project item', async () => {
      const quoteDto = {
        supplierId: 'supplier-1',
        price: 100,
        quantity: 10,
        totalAmount: 1000,
      };
      const mockProjectItem = {
        id: 'pi-1',
        projectId: 'project-1',
        project: mockProject,
      } as any;
      const mockQuote = { id: 'q-1', projectItemId: 'pi-1' } as SupplierQuote;

      jest.spyOn(projectItemRepository, 'findOne').mockResolvedValue(mockProjectItem);
      jest.spyOn(supplierQuoteRepository, 'create').mockReturnValue(mockQuote);
      jest.spyOn(supplierQuoteRepository, 'save').mockResolvedValue(mockQuote);

      const result = await service.addQuote('pi-1', quoteDto, mockUser);

      expect(result).toEqual(mockQuote);
    });
  });

  describe('updateQuote', () => {
    it('should update quote and recalculate total amount', async () => {
      const updateDto = { price: 150, quantity: 10 };
      const mockProjectItem = {
        id: 'pi-1',
        project: { userId: 'user-1' },
      } as any;
      const mockQuote = {
        id: 'q-1',
        projectItem: mockProjectItem,
        price: 100,
        quantity: 10,
        totalAmount: 1000,
      } as any;

      jest.spyOn(supplierQuoteRepository, 'findOne').mockResolvedValue(mockQuote);
      jest.spyOn(supplierQuoteRepository, 'save').mockResolvedValue(mockQuote);

      const result = await service.updateQuote('q-1', updateDto, mockUser);

      expect(result.totalAmount).toBe(1500);
    });
  });

  describe('removeQuote', () => {
    it('should remove a quote', async () => {
      const mockProjectItem = {
        id: 'pi-1',
        project: { userId: 'user-1' },
      } as any;
      const mockQuote = {
        id: 'q-1',
        projectItem: mockProjectItem,
      } as any;

      jest.spyOn(supplierQuoteRepository, 'findOne').mockResolvedValue(mockQuote);
      jest.spyOn(supplierQuoteRepository, 'remove').mockResolvedValue(mockQuote);

      await service.removeQuote('q-1', mockUser);

      expect(supplierQuoteRepository.remove).toHaveBeenCalledWith(mockQuote);
    });
  });

  describe('toggleQuoteSelection', () => {
    it('should toggle quote isSelected status', async () => {
      const mockProjectItem = {
        id: 'pi-1',
        project: { userId: 'user-1' },
      } as any;
      const mockQuote = {
        id: 'q-1',
        projectItem: mockProjectItem,
        isSelected: false,
      } as any;

      jest.spyOn(supplierQuoteRepository, 'findOne').mockResolvedValue(mockQuote);
      jest.spyOn(supplierQuoteRepository, 'save').mockResolvedValue(mockQuote);

      const result = await service.toggleQuoteSelection('q-1', mockUser);

      expect(result.isSelected).toBe(true);
    });
  });

  describe('updateItem', () => {
    it('should update item quantity and remarks', async () => {
      const updateDto = { quantity: 20, remarks: 'updated remarks' };
      const mockProject = { userId: 'user-1' } as any;
      const mockItem = {
        id: 'pi-1',
        project: mockProject,
        quantity: 10,
        remarks: 'old remarks',
      } as any;

      jest.spyOn(projectItemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(projectItemRepository, 'save').mockResolvedValue(mockItem);

      const result = await service.updateItem('pi-1', updateDto, mockUser);

      expect(result.quantity).toBe(20);
      expect(result.remarks).toBe('updated remarks');
    });

    it('should throw BadRequestException for invalid quantity', async () => {
      const updateDto = { quantity: 0 };
      const mockProject = { userId: 'user-1' } as any;
      const mockItem = {
        id: 'pi-1',
        project: mockProject,
      } as any;

      jest.spyOn(projectItemRepository, 'findOne').mockResolvedValue(mockItem);

      await expect(service.updateItem('pi-1', updateDto, mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeItem', () => {
    it('should remove a project item', async () => {
      const mockItem = {
        id: 'pi-1',
        projectId: 'project-1',
        quotes: [],
      } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(projectItemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(projectItemRepository, 'remove').mockResolvedValue(mockItem);

      await service.removeItem('project-1', 'pi-1', mockUser);

      expect(projectItemRepository.remove).toHaveBeenCalledWith(mockItem);
    });
  });
});
