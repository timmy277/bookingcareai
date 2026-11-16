import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CatalogService } from '../catalog/catalog.service';
import { Appointment } from '../types';

export interface CreateBookingDto {
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  date: string;
  timeSlot: string;
  symptoms?: string;
}

@Injectable()
export class BookingService implements OnModuleInit {
  private appointments: Appointment[] = [];
  private filePath: string;

  constructor(private readonly catalogService: CatalogService) {
    this.filePath = path.resolve(__dirname, '../../../data/appointments.json');
  }

  onModuleInit() {
    this.loadAppointments();
  }

  private loadAppointments() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.appointments = JSON.parse(raw);
      } else {
        this.appointments = [];
        this.saveAppointments();
      }
    } catch {
      this.appointments = [];
    }
  }

  private saveAppointments() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.appointments, null, 2), 'utf-8');
    } catch (err) {
      console.error('[BookingService] Failed to save appointments:', err);
    }
  }

  createBooking(dto: CreateBookingDto): Appointment {
    const doc = this.catalogService.getDoctorById(dto.doctorId);
    if (!doc) {
      throw new Error(`Bác sĩ với mã [${dto.doctorId}] không tồn tại trong hệ thống BookingCare.`);
    }

    const clinic = this.catalogService.getClinicById(doc.clinicId);
    const specialty = this.catalogService.getSpecialtyById(doc.specialtyId);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appointmentId = `BKC-${randomSuffix}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      patientName: dto.patientName,
      patientPhone: dto.patientPhone,
      patientEmail: dto.patientEmail || '',
      doctorId: doc.id,
      doctorName: doc.name,
      doctorTitle: doc.title,
      clinicId: clinic ? clinic.id : '',
      clinicName: clinic ? clinic.name : 'BookingCare Clinic',
      clinicAddress: clinic ? clinic.address : 'Trung tâm Y tế BookingCare',
      specialtyName: specialty ? specialty.name : 'Đa khoa',
      price: doc.price,
      date: dto.date,
      timeSlot: dto.timeSlot,
      symptoms: dto.symptoms || 'Khám bệnh tổng quát',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    this.appointments.unshift(newAppointment);
    this.saveAppointments();
    return newAppointment;
  }

  getAllAppointments(): Appointment[] {
    return this.appointments;
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.appointments.find((a) => a.id.toLowerCase() === id.toLowerCase());
  }
}
