/**
 * EnrollEase - Lightweight Native Supabase REST Client
 * Zero dependencies, works in modern browsers over HTTPS.
 */
(() => {
  "use strict";

  class SupabaseRestClient {
    constructor(config) {
      this.url = (config.url || '').replace(/\/$/, '');
      this.key = config.key || '';
      this.name = config.shortName || 'Supabase';
    }

    async query(table, params = {}) {
      try {
        const url = new URL(`${this.url}/rest/v1/${table}`);
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            url.searchParams.append(k, v);
          }
        });

        const resp = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Accept': 'application/json'
          }
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`[${this.name}] HTTP ${resp.status}: ${errText}`);
        }

        return await resp.json();
      } catch (err) {
        console.warn(`[${this.name}] Query failed on ${table}:`, err.message);
        throw err;
      }
    }

    async insert(table, data) {
      try {
        const url = `${this.url}/rest/v1/${table}`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`[${this.name}] Insert failed HTTP ${resp.status}: ${errText}`);
        }

        return await resp.json();
      } catch (err) {
        console.warn(`[${this.name}] Insert error:`, err.message);
        throw err;
      }
    }

    async update(table, filterField, filterVal, data) {
      try {
        const url = `${this.url}/rest/v1/${table}?${encodeURIComponent(filterField)}=eq.${encodeURIComponent(filterVal)}`;
        const resp = await fetch(url, {
          method: 'PATCH',
          headers: {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`[${this.name}] Update failed HTTP ${resp.status}: ${errText}`);
        }

        return await resp.json();
      } catch (err) {
        console.warn(`[${this.name}] Update error:`, err.message);
        throw err;
      }
    }
  }

  // Initialize REST clients
  const misClient = new SupabaseRestClient(window.SUPABASE_CONFIG.mis);
  const enrolleaseClient = new SupabaseRestClient(window.SUPABASE_CONFIG.enrollease);

  // Fallback data if offline or network failure
  const FALLBACK_SUBJECTS_BSIT2 = [
    { section_code: 'CO379', subject_code: 'MS31', description: 'MILITARY SCIENCE 31', unit: '3.00', time: '08:00AM-12:00PM', day: 'Sat', room: 'FIELD' },
    { section_code: 'CO58', subject_code: 'GEC-E', description: 'ETHICS', unit: '3.00', time: '11:00AM-12:00PM', day: 'M', room: 'ROOM 10' },
    { section_code: 'CO59', subject_code: 'GEE-ES', description: 'ENVIRONMENTAL SCIENCE', unit: '3.00', time: '01:00PM-02:00PM', day: 'Tue', room: 'ROOM 10' },
    { section_code: 'CO60', subject_code: 'GEC-LWR', description: 'LIFE AND WORKS OF RIZAL', unit: '3.00', time: '11:00AM-12:00PM', day: 'Tue', room: 'ROOM 10' },
    { section_code: 'CO61', subject_code: 'PC 212', description: 'QUANTITATIVE METHODS (MODELING & SIMULATION)', unit: '3.00', time: '10:00AM-11:00AM', day: 'M', room: 'ROOM 10' },
    { section_code: 'CO62', subject_code: 'CC 214', description: 'DATA STRUCTURES AND ALGORITHMS (LEC)', unit: '2.00', time: '08:00AM-10:00AM', day: 'M', room: 'ROOM 10' },
    { section_code: 'CO63', subject_code: 'CC 214L', description: 'DATA STRUCTURES AND ALGORITHMS (LAB)', unit: '3.00', time: '08:00AM-11:00AM', day: 'TueWTh', room: 'ROOM 10' },
    { section_code: 'CO64', subject_code: 'P ELEC 1', description: 'OBJECT - ORIENTED PROGRAMMING', unit: '3.00', time: '01:00PM-03:00PM', day: 'M', room: 'ROOM 10' },
    { section_code: 'CO65', subject_code: 'P ELEC 2', description: 'WEB SYSTEMS AND TECHNOLOGIES', unit: '3.00', time: '03:00PM-04:00PM', day: 'MWF', room: 'ROOM 10' },
    { section_code: 'CO66', subject_code: 'PATHFIT 3', description: 'PHYSICAL ACTIVITIES TOWARDS HEALTH AND FITNESS 3: DANCE/SPORTS', unit: '2.00', time: '03:00PM-04:00PM', day: 'M', room: 'ROOM 10' }
  ];

  const FALLBACK_FEES_BSIT2 = [
    { fee_name: 'Tuition', amount: '4200.00' },
    { fee_name: 'Athletics Fee', amount: '200.00' },
    { fee_name: 'Computer Fee', amount: '400.00' },
    { fee_name: 'Cultural Fee', amount: '150.00' },
    { fee_name: 'Development Fee', amount: '2815.00' },
    { fee_name: 'Guidance Fee', amount: '90.00' },
    { fee_name: 'Laboratory Fee', amount: '750.00' },
    { fee_name: 'Library Fee', amount: '350.00' },
    { fee_name: 'Medical and Dental Fee', amount: '200.00' },
    { fee_name: 'Registration Fee', amount: '50.00' }
  ];

  // CTU Central MIS Cloud Service API
  window.CtuMis = {
    client: misClient,

    // Query programs catalog
    async getPrograms() {
      try {
        return await misClient.query('mis_programs', { order: 'id.asc' });
      } catch (e) {
        return [
          { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
          { code: 'BSCS', name: 'Bachelor of Science in Computer Science' }
        ];
      }
    },

    // Query student master record by ID
    async getStudent(studentId) {
      try {
        const records = await misClient.query('mis_students_master', {
          student_id: `eq.${studentId}`
        });
        return records.length ? records[0] : null;
      } catch (e) {
        console.warn('Fallback student query for', studentId);
        if (studentId === '8240873') {
          return {
            student_id: '8240873',
            full_name: 'CAPECENIO, LLYOD',
            program_code: 'BSIT',
            year_level: 2,
            section: 'BSIT 2-A',
            block_name: 'BLK_BSIT-2A_DAY',
            email: 'capecenio.llyod@ctu.edu.ph',
            contact: '09123456789',
            academic_status: 'Officially Enrolled'
          };
        }
        return null;
      }
    },

    // Query dynamic subjects for Certificate of Registration (COR)
    async getCurriculum(programCode = 'BSIT', yearLevel = 2) {
      try {
        const code = (programCode || 'BSIT').toUpperCase().trim();
        const yr = parseInt(yearLevel, 10) || 2;
        const subjects = await misClient.query('mis_curriculum_subjects', {
          program_code: `eq.${code}`,
          year_level: `eq.${yr}`,
          order: 'id.asc'
        });
        if (subjects && subjects.length) {
          return subjects;
        }
        // If course has no custom rows yet, fall back to default CTU load
        return FALLBACK_SUBJECTS_BSIT2;
      } catch (e) {
        console.warn('Using fallback CTU subjects due to network/database response.');
        return FALLBACK_SUBJECTS_BSIT2;
      }
    },

    // Query dynamic fees for Certificate of Registration (COR)
    async getFees(programCode = 'BSIT', yearLevel = 2) {
      try {
        const code = (programCode || 'BSIT').toUpperCase().trim();
        const yr = parseInt(yearLevel, 10) || 2;
        const fees = await misClient.query('mis_fee_structures', {
          program_code: `eq.${code}`,
          year_level: `eq.${yr}`,
          order: 'id.asc'
        });
        if (fees && fees.length) {
          return fees;
        }
        return FALLBACK_FEES_BSIT2;
      } catch (e) {
        return FALLBACK_FEES_BSIT2;
      }
    },

    // Measure live round-trip latency to CTU MIS
    async checkConnection() {
      try {
        const start = performance.now();
        await misClient.query('mis_programs', { limit: '1' });
        const latency = Math.max(1, Math.round(performance.now() - start));
        return { connected: true, latency };
      } catch (e) {
        return { connected: false, error: e.message };
      }
    }
  };

  // EnrollEase Cloud Appointments API
  window.EnrollEaseCloud = {
    client: enrolleaseClient,

    async saveAppointment(appt) {
      try {
        const payload = {
          id: appt.id,
          student_id: appt.sid,
          appointment_type: appt.type,
          department: (appt.type || '').split(' ')[0] || 'Registrar',
          appointment_date: appt.date,
          appointment_time: appt.time,
          queue_number: appt.queue,
          status: appt.status || 'Confirmed'
        };
        await enrolleaseClient.insert('ee_appointments', payload);
        console.log('[EnrollEase Cloud] Appointment synced to cloud successfully.');
      } catch (e) {
        console.warn('[EnrollEase Cloud] Could not sync appointment to cloud (offline fallback active).', e.message);
      }
    },

    async getAppointments(studentId) {
      try {
        return await enrolleaseClient.query('ee_appointments', {
          student_id: `eq.${studentId}`,
          order: 'created_at.desc'
        });
      } catch (e) {
        return [];
      }
    }
  };

})();
