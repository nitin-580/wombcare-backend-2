import { DatabaseAdapter, CreateAppointmentInput, Appointment } from '../database/interfaces';

export class AppointmentRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(appointment: CreateAppointmentInput): Promise<Appointment> {
    return this.dbAdapter.createAppointment(appointment);
  }

  async getByUserId(userId: string): Promise<Appointment[]> {
    return this.dbAdapter.getUserAppointments(userId);
  }

  async getByDoctorId(doctorId: string): Promise<Appointment[]> {
    return this.dbAdapter.getDoctorAppointments(doctorId);
  }

  async getAll(): Promise<Appointment[]> {
    return this.dbAdapter.getAllAppointments();
  }

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    return this.dbAdapter.updateAppointmentStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    return this.dbAdapter.deleteAppointment(id);
  }
}
