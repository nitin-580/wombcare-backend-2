import { DoctorController } from '../src/controllers/doctorController';
import { DoctorRepository } from '../src/repositories/doctorRepository';
import { PatientRepository } from '../src/repositories/patientRepository';
import { UserProfileRepository } from '../src/repositories/userProfileRepository';
import { AppointmentRepository } from '../src/repositories/appointmentRepository';
import { EarningsRepository } from '../src/repositories/earningsRepository';
import { SupabaseAdapter } from '../src/database/supabaseAdapter';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbAdapter = new SupabaseAdapter();
const doctorRepo = new DoctorRepository(dbAdapter);
const patientRepo = new PatientRepository(dbAdapter);
const profileRepo = new UserProfileRepository(dbAdapter);
const appointmentRepo = new AppointmentRepository(dbAdapter);
const earningsRepo = new EarningsRepository(dbAdapter);

const doctorController = new DoctorController(
  doctorRepo,
  patientRepo,
  profileRepo,
  appointmentRepo,
  earningsRepo
);

async function testApi() {
  const testDoctorId = '2ec424fd-b1e0-40d0-95bd-becd6cfd5f42'; // Dr. Nitin Kumar
  
  const req = {
    user: {
      id: testDoctorId,
      email: 'iitknitin@gmail.com',
      role: 'doctor'
    }
  } as any;

  let jsonResult: any = null;
  let statusCode: number = 0;

  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      jsonResult = data;
    }
  } as any;

  console.log('Invoking doctorController.getDoctorEarnings for doctorId:', testDoctorId);
  await doctorController.getDoctorEarnings(req, res);

  console.log('Response Status:', statusCode);
  console.log('Response JSON:', jsonResult);
}

testApi();
