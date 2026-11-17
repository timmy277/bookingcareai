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

  removeVietnameseTones(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  getAllSpecialties(): Specialty[] {
    return this.specialties;
  }

  getSpecialtyById(id: string): Specialty | undefined {
    return this.specialties.find((s) => s.id === id);
  }

  findDoctorByNameInQuery(query: string): (Doctor & { clinicName: string; clinicCity: string; specialtyName: string }) | undefined {
    const qClean = this.removeVietnameseTones(query);
    for (const doc of this.doctors) {
      const docClean = this.removeVietnameseTones(doc.name);
      // Check full name or short name
      const nameParts = docClean.split(' ');
      const shortName = nameParts.slice(-2).join(' '); // e.g. "trung dung", "thu thuy"
      const singleName = nameParts.slice(-1).join(' '); // e.g. "dung"

      if (qClean.includes(docClean) || (shortName.length > 4 && qClean.includes(shortName))) {
        const clinic = this.getClinicById(doc.clinicId);
        const specialty = this.getSpecialtyById(doc.specialtyId);
        return {
          ...doc,
          clinicName: clinic ? clinic.name : 'BookingCare Partner Clinic',
          clinicCity: clinic ? clinic.city : '',
          specialtyName: specialty ? specialty.name : '',
        };
      }
    }
    return undefined;
  }

  findClinicByNameInQuery(query: string): Clinic | undefined {
    const qClean = this.removeVietnameseTones(query);
    for (const clinic of this.clinics) {
      const clinicClean = this.removeVietnameseTones(clinic.name);
      if (qClean.includes(clinicClean)) return clinic;
      if (clinic.id === 'bv-bach-mai' && (qClean.includes('bach mai') || qClean.includes('bạch mai'))) return clinic;
      if (clinic.id === 'bv-viet-duc' && (qClean.includes('viet duc') || qClean.includes('việt đức'))) return clinic;
      if (clinic.id === 'bv-cho-ray' && (qClean.includes('cho ray') || qClean.includes('chợ rẫy'))) return clinic;
      if (clinic.id === 'bv-dai-hoc-y-duoc' && (qClean.includes('dai hoc y duoc') || qClean.includes('đại học y dược'))) return clinic;
      if (clinic.id === 'pk-doctor-check' && qClean.includes('doctor check')) return clinic;
      if (clinic.id === 'pk-pro-skin' && (qClean.includes('pro skin') || qClean.includes('proskin'))) return clinic;
      if (clinic.id === 'pk-saigon-healthcare' && (qClean.includes('saigon healthcare') || qClean.includes('sai gon healthcare'))) return clinic;
      if (clinic.id === 'bv-mat-ha-noi-2' && (qClean.includes('mat ha noi') || qClean.includes('mắt hà nội'))) return clinic;
    }
    return undefined;
  }

  findSpecialtiesByQuery(query: string): Specialty[] {
    const raw = query.toLowerCase().trim();
    const clean = this.removeVietnameseTones(query).trim();
    if (!clean) return this.specialties.slice(0, 5);

    // Rule-based high-confidence mapping for key medical keywords
    const rules: Array<{ pattern: RegExp; specialtyId: string }> = [
      { pattern: /khop|khớp|goi|gối|lung|lưng|thoat vi|thoát vị|dia dem|đĩa đệm|cot song|cột sống|loang xuong|loãng xương|gout|gut/i, specialtyId: 'co-xuong-khop' },
      { pattern: /da day|dạ dày|trao nguoc|trào ngược|o chua|ợ chua|o hoi|ợ hơi|viem loet|viêm loét|tieu hoa|tiêu hóa|men gan|viem gan|viêm gan|soi mat|sỏi mật|hp|dai trang|đại tràng|noi soi|nội soi/i, specialtyId: 'tieu-hoa' },
      { pattern: /dau dau|đau đầu|mat ngu|mất ngủ|chong mat|chóng mặt|tien dinh|tiền đình|than kinh|thần kinh|parkinson|tai bien|tai biến|co giat|co giật|te bi|tê bì/i, specialtyId: 'than-kinh' },
      { pattern: /tim|huyet ap|huyết áp|mach vanh|mạch vành|nhip tim|nhịp tim|hoi hop|hồi hộp|suy tim/i, specialtyId: 'tim-mach' },
      { pattern: /mun|mụn|ngua|ngứa|di ung da|dị ứng da|da lieu|da liễu|vay nen|vảy nến|viem da|viêm da|rung toc|rụng tóc|nam da|nấm da/i, specialtyId: 'da-lieu' },
      { pattern: /tai|mui|mũi|hong|họng|viem xoang|viêm xoang|amidan|u tai|ù tai|khan tieng|khàn tiếng|chay nuoc mui/i, specialtyId: 'tai-mui-hong' },
      { pattern: /thai|phu khoa|phụ khoa|kinh nguyet|kinh nguyệt|cham kinh|chậm kinh|khi hu|khí hư|u xo|u xơ|buong trung|buồng trứng/i, specialtyId: 'san-phu-khoa' },
      { pattern: /tre|trẻ|be|bé|sot|sốt|nhi|kho khe|khò khè|bieng an|biếng ăn/i, specialtyId: 'nhi-khoa' },
      { pattern: /mat|mắt|can thi|cận thị|loan thi|loạn thị|thuy tinh the|thủy tinh thể|nhin mo|nhìn mờ|mo mat|mờ mắt|phaco|khuc xa|khúc xạ/i, specialtyId: 'mat' },
      { pattern: /rang|răng|rang khon|răng khôn|nieng rang|niềng răng|nha khoa|sau rang|sâu răng|tuy rang|tủy răng|implant/i, specialtyId: 'rang-ham-mat' },
      { pattern: /stress|tram cam|trầm cảm|lo au|lo âu|tam ly|tâm lý|tam than|tâm thần|bat an|bất an|hoang so|hoảng sợ/i, specialtyId: 'tam-than-tam-ly' },
      { pattern: /tieu duong|tiểu đường|dai thao duong|đái tháo đường|tuyen giap|tuyến giáp|buou co|bướu cổ|basedow|noi tiet|nội tiết/i, specialtyId: 'noi-tiet' },
    ];

    for (const rule of rules) {
      if (rule.pattern.test(raw) || rule.pattern.test(clean)) {
        const spec = this.getSpecialtyById(rule.specialtyId);
        if (spec) return [spec];
      }
    }

    // Fallback: Score matching
    const scored = this.specialties.map((spec) => {
      let score = 0;
      const specNameClean = this.removeVietnameseTones(spec.name);

      if (clean.includes(specNameClean)) score += 15;
      for (const kw of spec.keywords) {
        const kwClean = this.removeVietnameseTones(kw);
        if (clean.includes(kwClean)) score += 8;
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
