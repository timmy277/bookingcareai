import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('specialties')
  getSpecialties(@Query('query') query?: string) {
    if (query) {
      return this.catalogService.findSpecialtiesByQuery(query);
    }
    return this.catalogService.getAllSpecialties();
  }

  @Get('specialties/:id')
  getSpecialtyById(@Param('id') id: string) {
    return this.catalogService.getSpecialtyById(id);
  }

  @Get('clinics')
  getClinics(@Query('city') city?: string, @Query('specialtyId') specialtyId?: string) {
    return this.catalogService.searchClinics(city, specialtyId);
  }

  @Get('doctors')
  getDoctors(
    @Query('specialtyId') specialtyId?: string,
    @Query('city') city?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.catalogService.searchDoctors(
      specialtyId,
      city,
      maxPrice ? parseInt(maxPrice, 10) : undefined,
    );
  }

  @Get('doctors/:id/schedule')
  getDoctorSchedule(@Param('id') id: string) {
    return this.catalogService.getDoctorSchedule(id);
  }
}
