import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { Appointment } from '../database/interfaces';
import { sendAppointmentMail } from '../lib/sendAppointmentMail';
import { z } from 'zod';

export const scheduleAppointmentSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    doctorName: z.string().min(1),
    appointmentDate: z.string().min(1), // ISO string
    notes: z.string().optional(),
  }),
});

export class AppointmentController {
  constructor(
    private appointmentService: AppointmentService,
    private profileRepo: UserProfileRepository
  ) {}

  schedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointment = await this.appointmentService.scheduleAppointment(req.body);
      res.status(201).json({
        success: true,
        message: 'Your appointment has been scheduled successfully!',
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  };

  getByUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointments = await this.appointmentService.getUserAppointments(req.params.userId as string);
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.appointmentService.cancelAppointment(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Appointment cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  getAllAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const appointments = await this.appointmentService.getAllAppointments();
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatusAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const status = req.body.status as Appointment['status'];

      let appointment;
      if (status === 'rejected') {
        appointment = (await this.appointmentService.getAllAppointments()).find(a => a.id === id);
        if (appointment) {
          const user = await this.profileRepo.getById(appointment.userId as string).catch(() => null);
          if (user) {
            await sendAppointmentMail(user.email, user.name, appointment.doctorName, appointment.appointmentDate, 'rejected').catch(console.error);
          }
          await this.appointmentService.deleteAppointment(id);
        }
        res.status(200).json({ success: true, message: 'Appointment rejected and deleted' });
        return;
      }

      appointment = await this.appointmentService.updateAppointmentStatus(id, status);
      
      if (status === 'approved' || status === 'completed') {
        const user = await this.profileRepo.getById(appointment.userId as string).catch(() => null);
        if (user) {
          // Cast status to the specific union type required by sendAppointmentMail
          const mailStatus = status as 'approved' | 'completed';
          await sendAppointmentMail(user.email, user.name, appointment.doctorName, appointment.appointmentDate, mailStatus).catch(console.error);
        }
      }

      res.status(200).json({
        success: true,
        message: `Appointment marked as ${status}`,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  };
}
