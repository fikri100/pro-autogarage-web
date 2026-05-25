export interface Booking {
  id?: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  vehicleId: number;
  licensePlate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  bookingDate: string;
  bookingTime: string;
  complaints?: string;
  operationalStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  status?: string;
  createdBy?: string;
  createdAt?: string;
}
