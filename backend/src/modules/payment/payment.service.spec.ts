import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRecord } from './entities/payment-record.entity';
import { ReceiptRecord } from './entities/receipt-record.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { CreateReceiptRecordDto } from './dto/create-receipt-record.dto';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRecordRepository: Repository<PaymentRecord>;
  let receiptRecordRepository: Repository<ReceiptRecord>;
  let bidProjectRepository: Repository<BidProject>;
  let supplierRepository: Repository<Supplier>;

  // Mock data
  const mockAdmin: User = {
    id: 'admin-1',
    username: 'admin',
    role: UserRole.ADMIN,
  } as User;

  const mockUser: User = {
    id: 'user-1',
    username: 'user',
    role: UserRole.USER,
  } as User;

  const mockProject: BidProject = {
    id: 'project-1',
    name: 'Test Project',
    projectCode: 'PRJ001',
    userId: 'user-1',
    totalAmount: 10000,
  } as BidProject;

  const mockSupplier: Supplier = {
    id: 'supplier-1',
    name: 'Test Supplier',
    contact: 'John Doe',
    phone: '1234567890',
  } as Supplier;

  const mockPaymentRecord: PaymentRecord = {
    id: 'payment-1',
    projectId: 'project-1',
    supplierId: 'supplier-1',
    userId: 'user-1',
    amount: 5000,
    paymentTime: new Date(),
    remarks: 'Test payment',
    project: mockProject,
    supplier: mockSupplier,
  } as PaymentRecord;

  const mockReceiptRecord: ReceiptRecord = {
    id: 'receipt-1',
    projectId: 'project-1',
    userId: 'user-1',
    amount: 8000,
    receiptTime: new Date(),
    remarks: 'Test receipt',
    project: mockProject,
  } as ReceiptRecord;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(PaymentRecord),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ReceiptRecord),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(BidProject),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentRecordRepository = module.get<Repository<PaymentRecord>>(getRepositoryToken(PaymentRecord));
    receiptRecordRepository = module.get<Repository<ReceiptRecord>>(getRepositoryToken(ReceiptRecord));
    bidProjectRepository = module.get<Repository<BidProject>>(getRepositoryToken(BidProject));
    supplierRepository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Payment Records', () => {
    describe('createPayment', () => {
      it('should create a payment record successfully', async () => {
        const createDto: CreatePaymentRecordDto = {
          projectId: 'project-1',
          supplierId: 'supplier-1',
          amount: 5000,
          paymentTime: new Date(),
          remarks: 'Test payment',
        };

        jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(mockProject);
        jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(mockSupplier);
        jest.spyOn(paymentRecordRepository, 'create').mockReturnValue(mockPaymentRecord);
        jest.spyOn(paymentRecordRepository, 'save').mockResolvedValue(mockPaymentRecord);

        const result = await service.createPayment(createDto, 'user-1');

        expect(result).toEqual(mockPaymentRecord);
        expect(bidProjectRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'project-1' },
        });
        expect(supplierRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'supplier-1' },
        });
      });

      it('should throw NotFoundException when project not found', async () => {
        const createDto: CreatePaymentRecordDto = {
          projectId: 'non-existent',
          supplierId: 'supplier-1',
          amount: 5000,
          paymentTime: new Date(),
        };

        jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(null);

        await expect(service.createPayment(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when supplier not found', async () => {
        const createDto: CreatePaymentRecordDto = {
          projectId: 'project-1',
          supplierId: 'non-existent',
          amount: 5000,
          paymentTime: new Date(),
        };

        jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(mockProject);
        jest.spyOn(supplierRepository, 'findOne').mockResolvedValue(null);

        await expect(service.createPayment(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      });
    });

    describe('findAllPayments', () => {
      it('should return all payments for admin', async () => {
        const mockPayments = [mockPaymentRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPayments),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findAllPayments(mockAdmin);

        expect(result).toEqual(mockPayments);
        expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      });

      it('should filter payments by user for non-admin', async () => {
        const mockPayments = [mockPaymentRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPayments),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        await service.findAllPayments(mockUser);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('payment.userId = :userId', {
          userId: 'user-1',
        });
      });

      it('should filter by project ID when provided', async () => {
        const mockPayments = [mockPaymentRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPayments),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        await service.findAllPayments(mockAdmin, 'project-1');

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('payment.projectId = :projectId', {
          projectId: 'project-1',
        });
      });
    });

    describe('findPaymentsByProject', () => {
      it('should return payments for a specific project', async () => {
        const mockPayments = [mockPaymentRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPayments),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findPaymentsByProject('project-1', mockAdmin);

        expect(result).toEqual(mockPayments);
      });
    });

    describe('findPaymentsBySupplier', () => {
      it('should return payments for a specific supplier', async () => {
        const mockPayments = [mockPaymentRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockPayments),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findPaymentsBySupplier('supplier-1', mockAdmin);

        expect(result).toEqual(mockPayments);
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('payment.supplierId = :supplierId', {
          supplierId: 'supplier-1',
        });
      });
    });

    describe('findOnePayment', () => {
      it('should return a payment record by id', async () => {
        jest.spyOn(paymentRecordRepository, 'findOne').mockResolvedValue(mockPaymentRecord);

        const result = await service.findOnePayment('payment-1', mockAdmin);

        expect(result).toEqual(mockPaymentRecord);
      });

      it('should throw NotFoundException for non-existent payment', async () => {
        jest.spyOn(paymentRecordRepository, 'findOne').mockResolvedValue(null);

        await expect(service.findOnePayment('non-existent', mockAdmin)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when user does not own the payment', async () => {
        const otherUser: User = { id: 'user-2', username: 'other', role: UserRole.USER } as User;

        jest.spyOn(paymentRecordRepository, 'findOne').mockResolvedValue(mockPaymentRecord);

        await expect(service.findOnePayment('payment-1', otherUser)).rejects.toThrow(NotFoundException);
      });
    });

    describe('removePayment', () => {
      it('should soft remove a payment record', async () => {
        jest.spyOn(service, 'findOnePayment').mockResolvedValue(mockPaymentRecord);
        jest.spyOn(paymentRecordRepository, 'softRemove').mockResolvedValue(mockPaymentRecord);

        await service.removePayment('payment-1', mockAdmin);

        expect(paymentRecordRepository.softRemove).toHaveBeenCalledWith(mockPaymentRecord);
      });
    });

    describe('updatePaymentVoucher', () => {
      it('should update payment proof URL', async () => {
        const proofUrl = '/uploads/payment-proof.jpg';

        jest.spyOn(service, 'findOnePayment').mockResolvedValue(mockPaymentRecord);
        jest.spyOn(paymentRecordRepository, 'save').mockResolvedValue({
          ...mockPaymentRecord,
          proofUrl,
        });

        const result = await service.updatePaymentVoucher('payment-1', proofUrl, mockAdmin);

        expect(result.proofUrl).toBe(proofUrl);
      });
    });
  });

  describe('Receipt Records', () => {
    describe('createReceipt', () => {
      it('should create a receipt record successfully', async () => {
        const createDto: CreateReceiptRecordDto = {
          projectId: 'project-1',
          amount: 8000,
          receiptTime: new Date(),
          remarks: 'Test receipt',
        };

        jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(mockProject);
        jest.spyOn(receiptRecordRepository, 'create').mockReturnValue(mockReceiptRecord);
        jest.spyOn(receiptRecordRepository, 'save').mockResolvedValue(mockReceiptRecord);

        const result = await service.createReceipt(createDto, 'user-1');

        expect(result).toEqual(mockReceiptRecord);
      });

      it('should throw NotFoundException when project not found', async () => {
        const createDto: CreateReceiptRecordDto = {
          projectId: 'non-existent',
          amount: 8000,
          receiptTime: new Date(),
        };

        jest.spyOn(bidProjectRepository, 'findOne').mockResolvedValue(null);

        await expect(service.createReceipt(createDto, 'user-1')).rejects.toThrow(NotFoundException);
      });
    });

    describe('findAllReceipts', () => {
      it('should return all receipts for admin', async () => {
        const mockReceipts = [mockReceiptRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockReceipts),
        };

        jest.spyOn(receiptRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findAllReceipts(mockAdmin);

        expect(result).toEqual(mockReceipts);
      });

      it('should filter receipts by user for non-admin', async () => {
        const mockReceipts = [mockReceiptRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockReceipts),
        };

        jest.spyOn(receiptRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        await service.findAllReceipts(mockUser);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('receipt.userId = :userId', {
          userId: 'user-1',
        });
      });
    });

    describe('findReceiptsByProject', () => {
      it('should return receipts for a specific project', async () => {
        const mockReceipts = [mockReceiptRecord];
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockReceipts),
        };

        jest.spyOn(receiptRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.findReceiptsByProject('project-1', mockAdmin);

        expect(result).toEqual(mockReceipts);
      });
    });

    describe('findOneReceipt', () => {
      it('should return a receipt record by id', async () => {
        jest.spyOn(receiptRecordRepository, 'findOne').mockResolvedValue(mockReceiptRecord);

        const result = await service.findOneReceipt('receipt-1', mockAdmin);

        expect(result).toEqual(mockReceiptRecord);
      });

      it('should throw NotFoundException for non-existent receipt', async () => {
        jest.spyOn(receiptRecordRepository, 'findOne').mockResolvedValue(null);

        await expect(service.findOneReceipt('non-existent', mockAdmin)).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateReceipt', () => {
      it('should update receipt fields', async () => {
        const updateDto = { amount: 9000, remarks: 'Updated receipt' };

        jest.spyOn(service, 'findOneReceipt').mockResolvedValue(mockReceiptRecord);
        jest.spyOn(receiptRecordRepository, 'save').mockResolvedValue({
          ...mockReceiptRecord,
          ...updateDto,
        });

        const result = await service.updateReceipt('receipt-1', updateDto, mockAdmin);

        expect(result.amount).toBe(9000);
        expect(result.remarks).toBe('Updated receipt');
      });
    });

    describe('removeReceipt', () => {
      it('should soft remove a receipt record', async () => {
        jest.spyOn(service, 'findOneReceipt').mockResolvedValue(mockReceiptRecord);
        jest.spyOn(receiptRecordRepository, 'softRemove').mockResolvedValue(mockReceiptRecord);

        await service.removeReceipt('receipt-1', mockAdmin);

        expect(receiptRecordRepository.softRemove).toHaveBeenCalledWith(mockReceiptRecord);
      });
    });

    describe('updateReceiptVoucher', () => {
      it('should update receipt proof URL', async () => {
        const proofUrl = '/uploads/receipt-proof.jpg';

        jest.spyOn(service, 'findOneReceipt').mockResolvedValue(mockReceiptRecord);
        jest.spyOn(receiptRecordRepository, 'save').mockResolvedValue({
          ...mockReceiptRecord,
          proofUrl,
        });

        const result = await service.updateReceiptVoucher('receipt-1', proofUrl, mockAdmin);

        expect(result.proofUrl).toBe(proofUrl);
      });
    });
  });

  describe('Statistics', () => {
    describe('getPaymentStatistics', () => {
      it('should return total paid amount for admin', async () => {
        const mockResult = { totalPaid: '15000' };
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(mockResult),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getPaymentStatistics(mockAdmin);

        expect(result.totalPaid).toBe(15000);
      });

      it('should filter by user for non-admin', async () => {
        const mockResult = { totalPaid: '5000' };
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(mockResult),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        await service.getPaymentStatistics(mockUser);

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('payment.userId = :userId', {
          userId: 'user-1',
        });
      });

      it('should filter by project when provided', async () => {
        const mockResult = { totalPaid: '5000' };
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(mockResult),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        await service.getPaymentStatistics(mockAdmin, 'project-1');

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('payment.projectId = :projectId', {
          projectId: 'project-1',
        });
      });

      it('should return 0 when no payments exist', async () => {
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(null),
        };

        jest.spyOn(paymentRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getPaymentStatistics(mockAdmin);

        expect(result.totalPaid).toBe(0);
      });
    });

    describe('getReceiptStatistics', () => {
      it('should return total received amount', async () => {
        const mockResult = { totalReceived: '20000' };
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(mockResult),
        };

        jest.spyOn(receiptRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getReceiptStatistics(mockAdmin);

        expect(result.totalReceived).toBe(20000);
      });

      it('should return 0 when no receipts exist', async () => {
        const mockQueryBuilder = {
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue(null),
        };

        jest.spyOn(receiptRecordRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getReceiptStatistics(mockAdmin);

        expect(result.totalReceived).toBe(0);
      });
    });
  });
});
