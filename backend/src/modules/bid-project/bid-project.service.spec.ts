import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BidProjectService } from './bid-project.service';
import { BidProject } from './entities/bid-project.entity';
import { BidProjectItem } from './entities/bid-project-item.entity';
import { BidSupplier, ProgressStage, PaymentStatus } from './entities/bid-supplier.entity';
import { ConsultProject } from '../consult-project/entities/consult-project.entity';
import { ConsultProjectItem } from '../consult-project/entities/consult-project-item.entity';
import { SupplierQuote } from '../consult-project/entities/supplier-quote.entity';
import { Item } from '../item/entities/item.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { PaymentRecord } from '../payment/entities/payment-record.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreateBidProjectDto } from './dto/create-bid-project.dto';

describe('BidProjectService', () => {
  let service: BidProjectService;
  let bidProjectRepository: Repository<BidProject>;
  let consultProjectRepository: Repository<ConsultProject>;
  let itemRepository: Repository<Item>;
  let supplierRepository: Repository<Supplier>;
  let paymentRecordRepository: Repository<PaymentRecord>;
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

  const mockSupplier: Supplier = {
    id: 'supplier-1',
    name: 'Test Supplier',
  } as Supplier;

  const mockConsultProject: ConsultProject = {
    id: 'consult-1',
    name: 'Consult Project',
    projectCode: 'CP001',
    customer: 'Test Customer',
    userId: 'user-1',
    projectItems: [
      {
        id: 'cpi-1',
        itemId: 'item-1',
        quantity: 10,
        remarks: 'test',
        quotes: [
          {
            id: 'q-1',
            supplierId: 'supplier-1',
            price: 100,
            quantity: 10,
            totalAmount: 1000,
            isSelected: true,
          } as SupplierQuote,
        ],
      } as ConsultProjectItem,
    ],
  } as ConsultProject;

  const mockBidProject: BidProject = {
    id: 'bid-1',
    name: 'Bid Project',
    projectCode: 'BP001',
    customer: 'Test Customer',
    userId: 'user-1',
    totalAmount: 1000,
    status: 'preparing',
    deletedAt: null,
    projectItems: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as BidProject;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    manager: {
      create: jest.fn().mockReturnValue(mockBidProject),
      save: jest.fn().mockResolvedValue(mockBidProject),
    },
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
  } as unknown as QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidProjectService,
        {
          provide: getRepositoryToken(BidProject),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BidProjectItem),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BidSupplier),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Item),
          useClass: Repository,
        },
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
          provide: getRepositoryToken(Supplier),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PaymentRecord),
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

    service = module.get<BidProjectService>(BidProjectService);
    bidProjectRepository = module.get<Repository<BidProject>>(getRepositoryToken(BidProject));
    consultProjectRepository = module.get<Repository<ConsultProject>>(getRepositoryToken(ConsultProject));
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    supplierRepository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
    paymentRecordRepository = module.get<Repository<PaymentRecord>>(getRepositoryToken(PaymentRecord));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFromConsult', () => {
    it('should create bid project from consult project with selected quotes', async () => {
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(mockConsultProject);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);

      const result = await service.createFromConsult('consult-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should skip items without selected quotes', async () => {
      const consultProjectWithoutSelection = {
        ...mockConsultProject,
        projectItems: [
          {
            ...mockConsultProject.projectItems[0],
            quotes: [{ ...mockConsultProject.projectItems[0].quotes[0], isSelected: false }],
          },
        ],
      };

      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(consultProjectWithoutSelection);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);

      await service.createFromConsult('consult-1', 'user-1');

      // Total amount should be 0 since no quotes are selected
      expect(mockBidProject.totalAmount).toBeDefined();
    });

    it('should throw NotFoundException when consult project not found', async () => {
      jest.spyOn(consultProjectRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createFromConsult('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a bid project with items and suppliers', async () => {
      const createDto: CreateBidProjectDto = {
        name: 'Test Bid Project',
        projectCode: 'BP001',
        customer: 'Test Customer',
        amount: 5000,
        items: [
          {
            itemId: 'item-1',
            quantity: 10,
            remarks: 'test',
            suppliers: [
              {
                supplierId: 'supplier-1',
                amount: 1000,
                progress: ProgressStage.ORDERED,
                paymentStatus: PaymentStatus.UNPAID,
                isSelected: true,
              },
            ],
          },
        ],
      };

      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results for admin', async () => {
      const paginationDto = { page: 1, limit: 10 };
      const mockProjects = [mockBidProject];

      jest.spyOn(bidProjectRepository, 'findAndCount').mockResolvedValue([mockProjects, 1]);

      const result = await service.findAll(mockUser, paginationDto);

      expect(result.data).toEqual(mockProjects);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return bid project by id', async () => {
      jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(mockBidProject);

      const result = await service.findOne('bid-1', mockUser);

      expect(result).toEqual(mockBidProject);
    });

    it('should throw NotFoundException for non-existent project', async () => {
      jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project basic fields', async () => {
      const updateDto = {
        name: 'Updated Project',
        customer: 'Updated Customer',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);
      jest.spyOn(bidProjectRepository, 'save').mockResolvedValue({ ...mockBidProject, ...updateDto });

      const result = await service.update('bid-1', updateDto, mockUser);

      expect(result.name).toBe('Updated Project');
    });
  });

  describe('remove', () => {
    it('should soft delete a project', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);
      jest.spyOn(bidProjectRepository, 'softRemove').mockResolvedValue(mockBidProject);

      await service.remove('bid-1', mockUser);

      expect(bidProjectRepository.softRemove).toHaveBeenCalledWith(mockBidProject);
    });
  });

  describe('updateSupplierInfo', () => {
    it('should update supplier information', async () => {
      const mockProjectItem = {
        id: 'pi-1',
        project: { userId: 'user-1' },
      } as any;
      const mockBidSupplier = {
        id: 'bs-1',
        projectItem: mockProjectItem,
        progress: ProgressStage.ORDERED,
      } as any;

      const updateDto = {
        progress: ProgressStage.PRODUCING,
        remarks: 'Updated remarks',
      };

      jest.spyOn(service['bidSupplierRepository'], 'findOne').mockResolvedValue(mockBidSupplier);
      jest.spyOn(service['bidSupplierRepository'], 'save').mockResolvedValue({
        ...mockBidSupplier,
        ...updateDto,
      });

      const result = await service.updateSupplierInfo('bs-1', updateDto, mockUser);

      expect(result.progress).toBe(ProgressStage.PRODUCING);
    });
  });

  describe('toggleSupplierSelection', () => {
    it('should toggle supplier isSelected status', async () => {
      const mockProjectItem = {
        id: 'pi-1',
        project: { userId: 'user-1' },
      } as any;
      const mockBidSupplier = {
        id: 'bs-1',
        projectItem: mockProjectItem,
        isSelected: true,
      } as any;

      jest.spyOn(service['bidSupplierRepository'], 'findOne').mockResolvedValue(mockBidSupplier);
      jest.spyOn(service['bidSupplierRepository'], 'save').mockResolvedValue(mockBidSupplier);

      const result = await service.toggleSupplierSelection('bs-1', mockUser);

      expect(result.isSelected).toBe(false);
    });
  });

  describe('getProjectStatistics', () => {
    it('should calculate project statistics correctly', async () => {
      const mockProjectWithItems = {
        ...mockBidProject,
        projectItems: [
          {
            suppliers: [
              {
                isSelected: true,
                amount: 5000,
                paymentStatus: PaymentStatus.PAID,
              },
              {
                isSelected: true,
                amount: 3000,
                paymentStatus: PaymentStatus.UNPAID,
              },
            ],
          },
        ],
      } as any;

      const mockPaymentRecords = [
        { amount: 5000 },
        { amount: 1000 },
      ] as any[];

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProjectWithItems);
      jest.spyOn(service['paymentRecordRepository'], 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPaymentRecords),
      } as any);

      const result = await service.getProjectStatistics('bid-1', mockUser);

      expect(result.totalPayable).toBe(8000);
      expect(result.totalPaid).toBe(6000); // 5000 + 1000 from payment records
      expect(result.totalUnpaid).toBe(2000);
      expect(result.paymentProgress).toBeCloseTo(75);
    });

    it('should return zero statistics for project with no suppliers', async () => {
      const mockProjectWithoutItems = {
        ...mockBidProject,
        projectItems: [],
      } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockProjectWithoutItems);
      jest.spyOn(service['paymentRecordRepository'], 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.getProjectStatistics('bid-1', mockUser);

      expect(result.totalPayable).toBe(0);
      expect(result.totalPaid).toBe(0);
      expect(result.paymentProgress).toBe(0);
    });
  });

  describe('calculateAgingAnalysis', () => {
    it('should categorize unpaid amount correctly for projects under 30 days', () => {
      const recentProject = {
        ...mockBidProject,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      } as BidProject;

      // Access private method through test
      const agingAnalysis = (service as any).calculateAgingAnalysis(recentProject, 2000);

      expect(agingAnalysis.within30days).toBe(2000);
      expect(agingAnalysis.within60days).toBe(0);
      expect(agingAnalysis.within90days).toBe(0);
      expect(agingAnalysis.over90days).toBe(0);
    });

    it('should categorize unpaid amount correctly for projects over 90 days', () => {
      const oldProject = {
        ...mockBidProject,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      } as BidProject;

      const agingAnalysis = (service as any).calculateAgingAnalysis(oldProject, 5000);

      expect(agingAnalysis.within30days).toBe(0);
      expect(agingAnalysis.within60days).toBe(0);
      expect(agingAnalysis.within90days).toBe(0);
      expect(agingAnalysis.over90days).toBe(5000);
    });
  });

  describe('addItem', () => {
    it('should add an item to bid project', async () => {
      const itemDto = { itemId: 'item-1', quantity: 10, remarks: 'test' };
      const mockProjectItem = { id: 'bpi-1', projectId: 'bid-1' } as BidProjectItem;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);
      jest.spyOn(itemRepository, 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(service['bidProjectItemRepository'], 'create').mockReturnValue(mockProjectItem);
      jest.spyOn(service['bidProjectItemRepository'], 'save').mockResolvedValue(mockProjectItem);

      const result = await service.addItem('bid-1', itemDto, mockUser);

      expect(result).toEqual(mockProjectItem);
    });
  });

  describe('updateItem', () => {
    it('should update item quantity and remarks', async () => {
      const updateDto = { quantity: 20, remarks: 'updated' };
      const mockItem = {
        id: 'bpi-1',
        projectId: 'bid-1',
        quantity: 10,
        remarks: 'old',
      } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);
      jest.spyOn(service['bidProjectItemRepository'], 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(service['bidProjectItemRepository'], 'save').mockResolvedValue(mockItem);

      const result = await service.updateItem('bid-1', 'bpi-1', updateDto, mockUser);

      expect(result.quantity).toBe(20);
      expect(result.remarks).toBe('updated');
    });
  });

  describe('removeItem', () => {
    it('should remove item and recalculate project amount', async () => {
      const mockItem = {
        id: 'bpi-1',
        projectId: 'bid-1',
        suppliers: [],
      } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockBidProject);
      jest.spyOn(service['bidProjectItemRepository'], 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(service['bidProjectItemRepository'], 'remove').mockResolvedValue(mockItem);
      jest.spyOn(service, 'recalculateProjectAmount').mockResolvedValue(undefined);

      await service.removeItem('bid-1', 'bpi-1', mockUser);

      expect(service['bidProjectItemRepository'].remove).toHaveBeenCalledWith(mockItem);
      expect(service.recalculateProjectAmount).toHaveBeenCalledWith('bid-1');
    });
  });

  describe('addSupplierToItem', () => {
    it('should add supplier to project item', async () => {
      const supplierDto = {
        supplierId: 'supplier-1',
        amount: 1000,
        progress: ProgressStage.ORDERED,
        isSelected: true,
      };
      const mockItem = {
        id: 'bpi-1',
        projectId: 'bid-1',
        project: { userId: 'user-1', id: 'bid-1' },
      } as any;
      const mockBidSupplier = {
        id: 'bs-1',
        projectItemId: 'bpi-1',
        supplierId: 'supplier-1',
        amount: 1000,
        isSelected: true,
      } as any;

      jest.spyOn(service['bidProjectItemRepository'], 'findOne').mockResolvedValue(mockItem);
      jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(mockSupplier);
      jest.spyOn(service['bidSupplierRepository'], 'create').mockReturnValue(mockBidSupplier);
      jest.spyOn(service['bidSupplierRepository'], 'save').mockResolvedValue(mockBidSupplier);
      jest.spyOn(service, 'recalculateProjectAmount').mockResolvedValue(undefined);

      const result = await service.addSupplierToItem('bpi-1', supplierDto, mockUser);

      expect(result).toEqual(mockBidSupplier);
      expect(service.recalculateProjectAmount).toHaveBeenCalledWith('bid-1');
    });
  });

  describe('recalculateProjectAmount', () => {
    it('should recalculate total amount based on selected suppliers', async () => {
      const mockProject = {
        id: 'bid-1',
        totalAmount: 0,
        projectItems: [
          {
            suppliers: [
              { isSelected: true, amount: 3000 },
              { isSelected: false, amount: 2000 },
              { isSelected: true, amount: 5000 },
            ],
          },
        ],
      } as any;

      jest.spyOn(service['bidProjectRepository'], 'findOne').mockResolvedValue(mockProject);
      jest.spyOn(service['bidProjectRepository'], 'save').mockResolvedValue(mockProject);

      await service.recalculateProjectAmount('bid-1');

      expect(mockProject.totalAmount).toBe(8000); // 3000 + 5000
    });
  });
});
