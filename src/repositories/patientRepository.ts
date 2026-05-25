import { 
  DatabaseAdapter, 
  Patient, 
  CreatePatientInput, 
  UpdatePatientInput, 
  PaginatedResult 
} from '../database/interfaces';

export class PatientRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(patient: CreatePatientInput): Promise<Patient> {
    return this.dbAdapter.createPatient(patient);
  }

  async findById(id: string): Promise<Patient | null> {
    return this.dbAdapter.getPatientById(id);
  }

  async findByDoctor(doctorId: string): Promise<Patient[]> {
    return this.dbAdapter.getPatientsByDoctor(doctorId);
  }

  async getPaginatedByDoctor(doctorId: string, page: number, limit: number): Promise<PaginatedResult<Patient>> {
    return this.dbAdapter.getPaginatedPatientsByDoctor(doctorId, page, limit);
  }
}
