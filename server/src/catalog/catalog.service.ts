import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Clinic, Doctor, Specialty } from '../types';

@Injectable()
export class CatalogService implements OnModuleInit {
  private specialties: Specialty[] = [];
  private clinics: Clinic[] = [];
  private doctors: Doctor[] = [];

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      const dataPath = path.resolve(__dirname, '../../../data/bookingcare_data.json');
      const raw = fs.readFileSync(dataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.specialties = parsed.specialties || [];
      this.clinics = parsed.clinics || [];
      this.doctors = parsed.doctors || [];
      console.log(`[CatalogService] Loaded ${this.specialties.length} specialties, ${this.clinics.length} clinics, ${this.doctors.length} doctors.`);
    } catch (err) {
      console.error('[CatalogService] Failed to load bookingcare_data.json:', err);
    }
  }

  getAllSpecialties(): Specialty[] {
    return this.specialties;
  }

  getSpecialtyById(id: string): Specialty | undefined {
    return this.specialties.find((s) => s.id === id);
  }

  private removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  findSpecialtiesByQuery(query: string): Specialty[] {
    const raw = query.toLowerCase().trim();
    const clean = this.removeVietnameseTones(query).trim();
    if (!clean) return this.specialties.slice(0, 5);

    // Score matching
    const scored = this.specialties.map((spec) => {
      let score = 0;
      const specNameRaw = spec.name.toLowerCase();
      const specNameClean = this.removeVietnameseTones(spec.name);

      if (specNameRaw.includes(raw) || specNameClean.includes(clean)) score += 10;
      if (spec.description.toLowerCase().includes(raw) || this.removeVietnameseTones(spec.description).includes(clean)) score += 4;

      for (const kw of spec.keywords) {
        const kwRaw = kw.toLowerCase();
        const kwClean = this.removeVietnameseTones(kw);
        if (raw.includes(kwRaw) || kwRaw.includes(raw) || clean.includes(kwClean) || kwClean.includes(clean)) {
          score += 6;
        }
      }
      return { spec, score };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.spec);
  }

  getAllClinics(): Clinic[] {
    return this.clinics;
  }

  getClinicById(id: string): Clinic | undefined {
    return this.clinics.find((c) => c.id === id);
  }

  searchClinics(city?: string, specialtyId?: string): Clinic[] {
    return this.clinics.filter((clinic) => {
      if (city && !clinic.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (specialtyId && !clinic.specialties.includes(specialtyId)) return false;
      return true;
    });
  }

  getAllDoctors(): Doctor[] {
    return this.doctors;
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find((d) => d.id === id);
  }

  searchDoctors(specialtyId?: string, city?: string, maxPrice?: number): (Doctor & { clinicName: string; clinicCity: string; specialtyName: string })[] {
    return this.doctors
      .filter((doc) => {
        if (specialtyId && doc.specialtyId !== specialtyId) return false;
        if (maxPrice && doc.price > maxPrice) return false;
        if (city) {
          const clinic = this.getClinicById(doc.clinicId);
          if (!clinic || !clinic.city.toLowerCase().includes(city.toLowerCase())) return false;
        }
        return true;
      })
      .map((doc) => {
        const clinic = this.getClinicById(doc.clinicId);
        const specialty = this.getSpecialtyById(doc.specialtyId);
        return {
          ...doc,
          clinicName: clinic ? clinic.name : 'BookingCare Partner Clinic',
          clinicCity: clinic ? clinic.city : '',
          specialtyName: specialty ? specialty.name : '',
        };
      });
  }

  getDoctorSchedule(doctorId: string) {
    const doc = this.getDoctorById(doctorId);
    if (!doc) return null;
    const clinic = this.getClinicById(doc.clinicId);
    return {
      doctorId: doc.id,
      doctorName: doc.name,
      doctorTitle: doc.title,
      price: doc.price,
      clinicName: clinic?.name || '',
      clinicAddress: clinic?.address || '',
      availableDays: doc.availableDays,
      timeSlots: doc.timeSlots,
    };
  }
}
