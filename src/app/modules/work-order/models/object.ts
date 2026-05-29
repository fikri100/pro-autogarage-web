export interface WorkOrder {
  id?: number;
  bookingId?: number;
  vehicleId: number;
  licensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  customerId?: number;
  customerName?: string;
  mechanicId?: number;
  mechanicName?: string;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  estimatedCompletion?: string;
  workStatus: 'IN_PROGRESS' | 'COMPLETED' | 'PAID';
  notes?: string;
  status?: string;
}
